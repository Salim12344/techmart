import { connectDB } from '@/lib/db';
import Dispute from '@/models/Dispute';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const dispute = await Dispute.findById(id).populate('orderId');
    if (!dispute) {
      return Response.json({ error: 'Dispute not found' }, { status: 404 });
    }

    if (dispute.userId.toString() !== session.user.id && session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return Response.json({ dispute });
  } catch (error) {
    console.error('Get dispute error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
