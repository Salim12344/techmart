import { connectDB } from '@/lib/db';
import Review from '@/models/Review';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('productId', 'name');

    return Response.json({ reviews });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
