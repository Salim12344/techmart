import { connectDB } from '@/lib/db';
import SupportTicket from '@/models/SupportTicket';
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

    const ticket = await SupportTicket.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { userLastReadAt: new Date() },
      { new: true }
    );
    if (!ticket) {
      return Response.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return Response.json({ ticket });
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
    const { message } = await req.json();

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    await connectDB();

    const ticket = await SupportTicket.findOne({ _id: id, userId: session.user.id });
    if (!ticket) {
      return Response.json({ error: 'Ticket not found' }, { status: 404 });
    }

    ticket.messages.push({ sender: 'user', text: message });
    await ticket.save();

    return Response.json({ ticket });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
