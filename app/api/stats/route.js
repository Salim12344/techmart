import { connectDB } from '@/lib/db';
import Product from '@/models/product';
import User from '@/models/user';
import Order from '@/models/order';
import Review from '@/models/Review';

export async function GET() {
  try {
    await connectDB();

    const [totalProducts, totalUsers, totalOrders, deliveredOrders, reviews] = await Promise.all([
      Product.countDocuments(),
      User.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: 'delivered' }),
      Review.find({}, 'rating'),
    ]);

    const totalVariants = await Product.aggregate([
      { $unwind: '$variants' },
      { $count: 'count' },
    ]);

    const variantCount = totalVariants[0]?.count || 0;

    const avgRating = reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

    const satisfactionPercent = reviews.length > 0
      ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100)
      : 0;

    return Response.json({
      totalProducts,
      totalVariants: variantCount,
      totalCustomers: totalUsers,
      totalOrders,
      deliveredOrders,
      totalReviews: reviews.length,
      averageRating: avgRating,
      satisfactionPercent,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
