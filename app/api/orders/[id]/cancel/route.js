import { connectDB } from '@/lib/db';
import Order from '@/models/order';
import Product from '@/models/product';
import Coupon from '@/models/Coupon';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sendOrderCancellationEmail } from '@/lib/email';

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const order = await Order.findById(id);
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.userId.toString() !== session.user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return Response.json({ error: 'Only pending or confirmed orders can be cancelled' }, { status: 400 });
    }

    // Refund via Paystack
    try {
      const refundRes = await fetch('https://api.paystack.co/refund', {
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
      const refundData = await refundRes.json();
      if (!refundData.status) {
        console.error('Paystack refund error:', refundData.message);
      }
    } catch (refundErr) {
      console.error('Paystack refund request failed:', refundErr);
    }

    // Restore stock
    for (const item of order.items) {
      await Product.findOneAndUpdate(
        {
          _id: item.productId,
          'variants.color': item.color,
          'variants.storage': item.storage,
        },
        { $inc: { 'variants.$.stock': item.quantity } }
      );
    }

    // Update order status
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    await order.save();

    // Release the coupon use reserved for this order - the customer didn't end up
    // keeping the discount, so it shouldn't count against their one-time use or the
    // coupon's overall usage cap.
    if (order.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: order.couponCode },
        { $inc: { usedCount: -1 }, $pull: { usedBy: order.userId } }
      );
    }

    // Send cancellation email
    try {
      await sendOrderCancellationEmail(session.user.email, order);
    } catch (emailErr) {
      console.error('Cancellation email error:', emailErr);
    }

    return Response.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    console.error('Cancel order error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
