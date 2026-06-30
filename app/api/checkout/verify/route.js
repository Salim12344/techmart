import { connectDB } from '@/lib/db';
import Order from '@/models/order';
import Product from '@/models/product';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return Response.json({ error: 'Reference is required', verified: false }, { status: 400 });
    }

    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const paystackData = await paystackRes.json();

    if (paystackData.status && paystackData.data?.status === 'success') {
      await connectDB();

      const order = await Order.findOneAndUpdate(
        { paymentReference: reference, status: 'pending', paymentVerifiedAt: { $exists: false } },
        { $set: { paymentVerifiedAt: new Date() } },
        { new: false }
      );

      if (order) {
        // Deduct stock for each item
        for (const item of order.items) {
          await Product.updateOne(
            { _id: item.productId, 'variants.color': item.color, 'variants.storage': item.storage },
            { $inc: { 'variants.$.stock': -item.quantity } }
          );
        }

        if (paystackData.data.customer?.email) {
          try {
            await sendOrderConfirmationEmail(paystackData.data.customer.email, {
              orderNumber: order.orderNumber,
              total: order.totalAmount,
              items: order.items,
              deliveryWindow: {
                earliest: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                latest: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              },
            });
          } catch (emailErr) {
            console.error('Order email failed:', emailErr);
          }
        }
      }

      return Response.json({ verified: true });
    }

    return Response.json({ verified: false });
  } catch (error) {
    console.error('Payment verification error:', error);
    return Response.json({ error: error.message, verified: false }, { status: 500 });
  }
}
