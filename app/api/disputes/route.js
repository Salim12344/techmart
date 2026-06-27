import { connectDB } from '@/lib/db';
import Dispute from '@/models/Dispute';
import Order from '@/models/order';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { orderId, reason, description } = await req.json();

    if (!orderId || !reason) {
      return Response.json({ error: 'Order ID and reason are required' }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.userId.toString() !== session.user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (order.status !== 'delivered') {
      return Response.json({ error: 'Disputes can only be filed for delivered orders' }, { status: 400 });
    }

    const existingDispute = await Dispute.findOne({ orderId, status: 'OPEN' });
    if (existingDispute) {
      return Response.json({ error: 'An open dispute already exists for this order' }, { status: 400 });
    }

    const dispute = await Dispute.create({
      orderId,
      orderNumber: order.orderNumber,
      userId: session.user.id,
      reason,
      description,
    });

    return Response.json({ dispute }, { status: 201 });
  } catch (error) {
    console.error('Create dispute error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const disputes = await Dispute.find({ userId: session.user.id })
      .populate('orderId')
      .sort({ createdAt: -1 });

    return Response.json({ disputes });
  } catch (error) {
    console.error('List disputes error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
