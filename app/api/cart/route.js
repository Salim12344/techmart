import { connectDB } from '@/lib/db';
import Cart from '@/models/Cart';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const cart = await Cart.findOne({ userId: session.user.id });
    return Response.json({ items: cart?.items || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items } = await req.json();
    if (!Array.isArray(items)) {
      return Response.json({ error: 'items must be an array' }, { status: 400 });
    }

    await connectDB();
    const cart = await Cart.findOneAndUpdate(
      { userId: session.user.id },
      { items },
      { upsert: true, new: true }
    );
    return Response.json({ items: cart.items });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    await Cart.findOneAndUpdate(
      { userId: session.user.id },
      { items: [] },
      { upsert: true }
    );
    return Response.json({ message: 'Cart cleared' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
