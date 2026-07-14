import { connectDB } from '@/lib/db';
import Coupon from '@/models/Coupon';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const updates = await req.json();

    if (updates.discountPercent !== undefined && (updates.discountPercent < 1 || updates.discountPercent > 10)) {
      return Response.json({ error: 'Discount must be between 1% and 10%' }, { status: 400 });
    }

    if (updates.expiresAt !== undefined && new Date(updates.expiresAt) <= new Date()) {
      return Response.json({ error: 'Expiry date must be in the future' }, { status: 400 });
    }

    const coupon = await Coupon.findByIdAndUpdate(id, updates, { new: true });
    if (!coupon) {
      return Response.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return Response.json({ coupon });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return Response.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return Response.json({ message: 'Coupon deleted' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
