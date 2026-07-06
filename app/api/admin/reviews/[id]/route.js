import { connectDB } from '@/lib/db';
import Review from '@/models/Review';
import Product from '@/models/product';
import User from '@/models/user';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sendReviewDeletedEmail } from '@/lib/email';

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    let reason;
    try {
      const body = await req.json();
      reason = body.reason;
    } catch {}

    await connectDB();

    const review = await Review.findById(id).populate('userId', 'email').populate('productId', 'name');
    if (!review) {
      return Response.json({ error: 'Review not found' }, { status: 404 });
    }

    const userEmail = review.userId?.email;
    const productName = review.productId?.name || 'Unknown Product';
    const productId = review.productId?._id;

    await Review.findByIdAndDelete(id);

    // Recalculate product averageRating and reviewCount from approved reviews only
    if (productId) {
      const remaining = await Review.find({ productId, isApproved: true });
      const reviewCount = remaining.length;
      const averageRating = reviewCount > 0
        ? remaining.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;

      await Product.findByIdAndUpdate(productId, { averageRating, reviewCount });
    }

    // Send email notification
    if (userEmail) {
      await sendReviewDeletedEmail(userEmail, productName, reason);
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const { isApproved } = await req.json();

    await connectDB();
    const review = await Review.findById(id);
    if (!review) {
      return Response.json({ error: 'Review not found' }, { status: 404 });
    }

    review.isApproved = !!isApproved;
    await review.save();

    // Recalculate product averageRating and reviewCount from approved reviews only
    const remaining = await Review.find({ productId: review.productId, isApproved: true });
    const reviewCount = remaining.length;
    const averageRating = reviewCount > 0
      ? remaining.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;
    await Product.findByIdAndUpdate(review.productId, { averageRating: Math.round(averageRating * 10) / 10, reviewCount });

    return Response.json({ review });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
