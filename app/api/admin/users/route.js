// app/api/admin/users/route.js
import { connectDB } from '@/lib/db';
import user from '@/models/user';
import Order from '@/models/order';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const users = await user.find().select('-password').sort({ createdAt: -1 });

    const orders = await Order.find().select('orderNumber totalAmount status userId').sort({ createdAt: -1 });
    const ordersByUser = new Map();
    for (const order of orders) {
      const key = order.userId?.toString();
      if (!key) continue;
      if (!ordersByUser.has(key)) ordersByUser.set(key, []);
      ordersByUser.get(key).push(order);
    }

    const usersWithOrders = users.map((u) => ({
      ...u.toObject(),
      orders: ordersByUser.get(u._id.toString()) || [],
    }));

    return Response.json({ users: usersWithOrders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}