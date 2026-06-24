import { connectDB } from '@/lib/db';
import SupportTicket from '@/models/SupportTicket';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subject, category, message, orderId } = await req.json();

    if (!subject || !message) {
      return Response.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    await connectDB();

    const ticket = await SupportTicket.create({
      userId: session.user.id,
      subject,
      category: category || 'general',
      messages: [{ sender: 'user', text: message }],
      orderId: orderId || undefined,
    });

    return Response.json({ ticket }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const tickets = await SupportTicket.find({ userId: session.user.id })
      .sort({ updatedAt: -1 });

    return Response.json({ tickets });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
