// app/api/admin/stats/route.js
import { connectDB } from '@/lib/db';
import Order from '@/models/order';
import Product from '@/models/product';
import User from '@/models/user';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const LOW_STOCK_THRESHOLD = 5;

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setDate(1)) },
    });

    // Count products that have at least one variant with low stock (1–5)
    const allProducts = await Product.find({}, 'variants');
    const lowStockProducts = allProducts.filter(p =>
      p.variants?.some(v => v.stock > 0 && v.stock <= LOW_STOCK_THRESHOLD)
    ).length;

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name email');

    const formattedOrders = recentOrders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      customerName: order.userId?.name || order.shippingAddress?.fullName || 'Unknown',
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
    }));

    return Response.json({
      totalOrders,
      totalProducts,
      totalUsers,
      pendingOrders,
      newUsersThisMonth,
      lowStockProducts,
    recentOrders: formattedOrders,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
