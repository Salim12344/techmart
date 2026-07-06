import { connectDB } from '@/lib/db';
import Cart from '@/models/Cart';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Merges a guest (localStorage) cart into the signed-in user's DB cart on login.
// Matching lines (same sku) have their quantities combined; everything else is appended.
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items: guestItems } = await req.json();
    if (!Array.isArray(guestItems)) {
      return Response.json({ error: 'items must be an array' }, { status: 400 });
    }

    await connectDB();
    const cart = await Cart.findOne({ userId: session.user.id });
    const existing = cart?.items || [];

    const merged = [...existing];
    for (const guestItem of guestItems) {
      const idx = merged.findIndex((i) => i.sku === guestItem.sku);
      if (idx > -1) {
        merged[idx] = { ...merged[idx], quantity: merged[idx].quantity + guestItem.quantity };
      } else {
        merged.push(guestItem);
      }
    }

    const updated = await Cart.findOneAndUpdate(
      { userId: session.user.id },
      { items: merged },
      { upsert: true, new: true }
    );
    return Response.json({ items: updated.items });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
