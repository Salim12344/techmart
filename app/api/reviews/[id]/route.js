import { connectDB } from '@/lib/db';
import Review from '@/models/Review';
import Product from '@/models/product';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const review = await Review.findById(id);
    if (!review) {
      return Response.json({ error: 'Review not found' }, { status: 404 });
    }
    if (review.userId.toString() !== session.user.id) {
      return Response.json({ error: 'You can only delete your own review' }, { status: 403 });
    }

    const { productId } = review;
    await Review.findByIdAndDelete(id);

    // Recalculate product rating/count from remaining approved reviews
    const remaining = await Review.find({ productId, isApproved: true });
    const reviewCount = remaining.length;
    const averageRating = reviewCount > 0
      ? remaining.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;
    await Product.findByIdAndUpdate(productId, { averageRating: Math.round(averageRating * 10) / 10, reviewCount });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await req.json();
    if (action !== 'like') {
      return Response.json({ error: 'Unsupported action' }, { status: 400 });
    }

    await connectDB();
    const review = await Review.findById(id);
    if (!review) {
      return Response.json({ error: 'Review not found' }, { status: 404 });
    }
    if (review.userId.toString() === session.user.id) {
      return Response.json({ error: "You can't like your own review" }, { status: 400 });
    }

    const userId = session.user.id;
    const alreadyLiked = review.likes.some((u) => u.toString() === userId);
    if (alreadyLiked) {
      review.likes = review.likes.filter((u) => u.toString() !== userId);
    } else {
      review.likes.push(userId);
    }
    await review.save();

    return Response.json({ likes: review.likes.length, liked: !alreadyLiked });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
