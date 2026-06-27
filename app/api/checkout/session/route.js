import { connectDB } from '@/lib/db';
import Order from '@/models/order';
import Product from '@/models/product';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { items, shippingAddress } = await req.json();

    if (!items || items.length === 0) {
      return Response.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Validate stock for each item
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return Response.json({ error: `Product "${item.productName}" not found` }, { status: 400 });
      }
      const variant = product.variants.find(
        v => v.color === item.color && v.storage === item.storage
      );
      if (!variant) {
        return Response.json({
          error: `Variant ${item.color}/${item.storage} for "${item.productName}" not found`,
        }, { status: 400 });
      }
      if (variant.stock < item.quantity) {
        return Response.json({
          error: `Only ${variant.stock} units of "${item.productName}" (${item.color}/${item.storage}) available. You requested ${item.quantity}.`,
        }, { status: 400 });
      }
    }

    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const deliveryFee = subtotal > 500000 ? 0 : 3500;
    const totalAmount = subtotal + deliveryFee;
    const orderNumber = 'TM-' + Date.now();

    const order = await Order.create({
      orderNumber,
      userId: session.user.id,
      items,
      shippingAddress,
      totalAmount,
      status: 'pending',
      paymentReference: 'pending',
    });

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: session.user.email,
        amount: Math.round(totalAmount * 100),
        currency: 'NGN',
        reference: orderNumber,
        callback_url: `${process.env.NEXTAUTH_URL}/checkout/success?reference=${orderNumber}`,
        metadata: {
          orderId: order._id.toString(),
          orderNumber,
          custom_fields: [
            { display_name: 'Order Number', variable_name: 'order_number', value: orderNumber },
            { display_name: 'Customer', variable_name: 'customer', value: shippingAddress.fullName },
          ],
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      await Order.findByIdAndDelete(order._id);
      const keyPreview = process.env.PAYSTACK_SECRET_KEY ? `${process.env.PAYSTACK_SECRET_KEY.slice(0, 8)}...` : 'NOT SET';
      console.error('Paystack error:', paystackData.message, 'Key preview:', keyPreview);
      return Response.json({ error: paystackData.message || 'Payment initialization failed' }, { status: 400 });
    }

    order.paymentReference = paystackData.data.reference;
    await order.save();

    return Response.json({ url: paystackData.data.authorization_url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
