// app/api/reviews/route.js
import { connectDB } from '@/lib/db';
import Review from '@/models/Review';
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
    const { productId, rating, comment, orderId } = await req.json();

    // Verify user has purchased the product
    const order = await Order.findOne({
      _id: orderId,
      userId: session.user.id,
      status: 'delivered',
      'items.productId': productId,
    });

    if (!order) {
      return Response.json(
        { error: 'You must have purchased this product to review it' },
        { status: 403 }
      );
    }

    const review = new Review({
      productId,
      userId: session.user.id,
      orderId,
      rating,
      comment,
    });

    await review.save();

    // Recalculate average rating and review count for the product
    const allReviews = await Review.find({ productId });
    const reviewCount = allReviews.length;
    const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;
    await Product.findByIdAndUpdate(productId, { averageRating: Math.round(averageRating * 10) / 10, reviewCount });

    return Response.json({ review }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    await connectDB();
    
    const query = productId ? { productId } : {};
    const reviews = await Review.find(query)
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    return Response.json({ reviews });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
