// app/api/reviews/route.js
import { connectDB } from '@/lib/db';
import Review from '@/models/Review';
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
    const { productId, rating, comment, orderId } = await req.json();

    // Check for existing review
    const existingReview = await Review.findOne({ productId, userId: session.user.id });
    if (existingReview) {
      return Response.json({ error: 'You have already reviewed this product' }, { status: 400 });
    }

    // Verify user has purchased and received the product
    const userOrders = await Order.find({ userId: session.user.id, status: 'delivered' });
    const order = userOrders.find(o =>
      o.items.some(item => item.productId?.toString() === productId)
    );

    if (!order) {
      return Response.json(
        { error: 'You must have purchased and received this product to review it' },
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

    // Product's rating/count only reflect admin-approved reviews - nothing to
    // recalculate yet, since this review isn't visible until approved.

    return Response.json({ review }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const session = await getServerSession(authOptions);

    await connectDB();

    const baseQuery = productId ? { productId } : {};
    // Show approved reviews to everyone, plus the current user's own pending review(s)
    const query = session?.user?.id
      ? { ...baseQuery, $or: [{ isApproved: true }, { userId: session.user.id }] }
      : { ...baseQuery, isApproved: true };

    const reviews = await Review.find(query)
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    return Response.json({ reviews });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
