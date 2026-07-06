import Order from '@/models/order';
import Product from '@/models/product';
import Refund from '@/models/Refund';
import { sendOrderCancellationEmail } from '@/lib/email';

// Stock is only checked (not reserved) when the checkout session is created, so two
// customers can both pass that check and pay for the same last unit before either
// order reaches this step. Deduct stock atomically per item here - only decrementing
// if enough is still actually available - and if anything lost that race, undo the
// partial deduction, refund the whole order via Paystack, and cancel it instead of
// silently overselling or shipping a partial order.
export async function fulfillOrRefund(order, customerEmail) {
  const decremented = [];
  let oversold = false;

  for (const item of order.items) {
    const result = await Product.updateOne(
      { _id: item.productId, variants: { $elemMatch: { sku: item.sku, stock: { $gte: item.quantity } } } },
      { $inc: { 'variants.$[v].stock': -item.quantity } },
      { arrayFilters: [{ 'v.sku': item.sku }] }
    );
    if (result.modifiedCount > 0) {
      decremented.push(item);
    } else {
      oversold = true;
    }
  }

  if (!oversold) {
    return { fulfilled: true };
  }

  // Roll back whatever was decremented - the order as a whole can't be fulfilled.
  for (const item of decremented) {
    await Product.updateOne(
      { _id: item.productId, 'variants.sku': item.sku },
      { $inc: { 'variants.$.stock': item.quantity } }
    );
  }

  let paystackRefundId = null;
  try {
    const paystackRes = await fetch('https://api.paystack.co/refund', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction: order.paymentReference,
        amount: Math.round(order.totalAmount * 100),
      }),
    });
    const paystackData = await paystackRes.json();
    if (paystackData.status && paystackData.data) {
      paystackRefundId = paystackData.data.id?.toString();
    }
  } catch (err) {
    console.error('Oversold auto-refund error:', err);
  }

  await Refund.create({
    orderId: order._id,
    amount: order.totalAmount,
    status: paystackRefundId ? 'PROCESSED' : 'PENDING',
    paystackRefundId,
    processedAt: paystackRefundId ? new Date() : undefined,
  });

  await Order.findByIdAndUpdate(order._id, { status: 'cancelled', cancelledAt: new Date() });

  if (customerEmail) {
    await sendOrderCancellationEmail(customerEmail, order).catch(() => {});
  }

  return { fulfilled: false };
}
