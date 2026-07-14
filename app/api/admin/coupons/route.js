import { connectDB } from '@/lib/db';
import Coupon from '@/models/Coupon';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return Response.json({ coupons });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { code, discountPercent, expiresAt, maxUses } = await req.json();

    if (!code || !discountPercent || !expiresAt || !maxUses) {
      return Response.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (discountPercent < 1 || discountPercent > 10) {
      return Response.json({ error: 'Discount must be between 1% and 10%' }, { status: 400 });
    }

    if (new Date(expiresAt) <= new Date()) {
      return Response.json({ error: 'Expiry date must be in the future' }, { status: 400 });
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return Response.json({ error: 'Coupon code already exists' }, { status: 400 });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountPercent,
      expiresAt: new Date(expiresAt),
      maxUses,
    });

    return Response.json({ coupon }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
