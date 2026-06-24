import { connectDB } from '@/lib/db';
import SupportTicket from '@/models/SupportTicket';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const { message, status, priority } = await req.json();

    await connectDB();

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return Response.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (message) {
      ticket.messages.push({ sender: 'admin', text: message });
    }
    if (status) {
      ticket.status = status;
    }
    if (priority) {
      ticket.priority = priority;
    }

    await ticket.save();

    const updated = await SupportTicket.findById(id).populate('userId', 'name email');

    return Response.json({ ticket: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
