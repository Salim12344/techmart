// app/api/admin/orders/[id]/route.js
import { connectDB } from '@/lib/db';
import Order from '@/models/order';
import User from '@/models/user';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sendOrderStatusEmail } from '@/lib/email';

const VALID_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [], // terminal, only disputes/refunds can change it after this
  cancelled: [], // terminal
  refunded: [], // terminal
};

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const currentOrder = await Order.findById(id);
    if (!currentOrder) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    if (body.status && body.status !== currentOrder.status) {
      const allowed = VALID_TRANSITIONS[currentOrder.status] || [];
      if (!allowed.includes(body.status)) {
        return Response.json({
          error: `Cannot change order status from "${currentOrder.status}" to "${body.status}"`,
        }, { status: 400 });
      }

      const timestampMap = {
        confirmed: 'confirmedAt',
        shipped: 'shippedAt',
        delivered: 'deliveredAt',
      };
      const field = timestampMap[body.status];
      if (field) {
        body[field] = new Date();
      }
    }

    const order = await Order.findByIdAndUpdate(id, body, { new: true });

    try {
      const user = await User.findById(order.userId);
      if (user?.email && body.status) {
        await sendOrderStatusEmail(user.email, order, body.status);
      }
    } catch (emailError) {
      console.error('Failed to send status email:', emailError);
    }

    return Response.json({ order });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
