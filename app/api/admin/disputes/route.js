import { connectDB } from '@/lib/db';
import Dispute from '@/models/Dispute';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const filter = {};
    if (status) filter.status = status;

    const disputes = await Dispute.find(filter)
      .populate('userId', 'name email')
      .populate('orderId')
      .sort({ createdAt: -1 });

    return Response.json({ disputes });
  } catch (error) {
    console.error('Admin list disputes error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
