import { connectDB } from '@/lib/db';
import Dispute from '@/models/Dispute';
import Refund from '@/models/Refund';
import Order from '@/models/order';
import Product from '@/models/product';
import User from '@/models/user';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sendDisputeResolutionEmail } from '@/lib/email';

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const { status, adminResponse } = await req.json();

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 });
    }

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return Response.json({ error: 'Dispute not found' }, { status: 404 });
    }

    if (dispute.status !== 'OPEN') {
      return Response.json({ error: 'Dispute has already been resolved' }, { status: 400 });
    }

    const order = await Order.findById(dispute.orderId);
    if (!order) {
      return Response.json({ error: 'Associated order not found' }, { status: 404 });
    }

    if (status === 'APPROVED' && order.status === 'cancelled') {
      return Response.json({ error: 'Cannot approve dispute for an already-cancelled order (stock already restored)' }, { status: 400 });
    }

    dispute.status = status;
    dispute.adminNote = adminResponse;
    dispute.approvedBy = session.user.id;
    dispute.approvedAt = new Date();

    if (status === 'APPROVED') {
      // Create refund record
      let paystackRefundId = null;
      try {
        const paystackRes = await fetch('https://api.paystack.co/refund', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
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
        console.error('Paystack refund error:', err);
      }

      await Refund.create({
        disputeId: dispute._id,
        orderId: order._id,
        amount: order.totalAmount,
        status: paystackRefundId ? 'PROCESSED' : 'PENDING',
        paystackRefundId,
        processedAt: paystackRefundId ? new Date() : undefined,
      });

      // Restore stock for each item
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.productId, 'variants.sku': item.sku },
          { $inc: { 'variants.$.stock': item.quantity } }
        );
      }

      order.status = 'refunded';
      await order.save();
    }

    await dispute.save();

    // Send email to customer
    const customer = await User.findById(dispute.userId);
    if (customer?.email) {
      try {
        await sendDisputeResolutionEmail(customer.email, dispute, order, status === 'APPROVED');
      } catch (emailErr) {
        console.error('Dispute resolution email failed:', emailErr);
      }
    }

    return Response.json({ dispute });
  } catch (error) {
    console.error('Admin resolve dispute error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
