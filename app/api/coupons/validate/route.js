import { connectDB } from '@/lib/db';
import Coupon from '@/models/Coupon';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { code } = await req.json();

    if (!code) {
      return Response.json({ valid: false, error: 'Please enter a coupon code' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return Response.json({ valid: false, error: 'Coupon code not found' });
    }

    if (!coupon.isActive) {
      return Response.json({ valid: false, error: 'This coupon is no longer active' });
    }

    if (new Date() > new Date(coupon.expiresAt)) {
      return Response.json({ valid: false, error: 'This coupon has expired' });
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return Response.json({ valid: false, error: 'This coupon has reached its usage limit' });
    }

    return Response.json({
      valid: true,
      discountPercent: coupon.discountPercent,
      code: coupon.code,
    });
  } catch (error) {
    return Response.json({ valid: false, error: error.message }, { status: 500 });
  }
}
