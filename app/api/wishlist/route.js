import { connectDB } from '@/lib/db';
import Wishlist from '@/models/Wishlist';
import Product from '@/models/product';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const items = await Wishlist.find({ userId: session.user.id }).sort({ addedAt: -1 });
    const productIds = items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    return Response.json({ wishlist: products });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { productId } = await req.json();

    const product = await Product.findById(productId);
    if (!product) {
      return Response.json({ error: 'Product no longer available' }, { status: 404 });
    }

    const existing = await Wishlist.findOne({ userId: session.user.id, productId });
    if (existing) {
      return Response.json({ message: 'Already in wishlist' });
    }

    await Wishlist.create({ userId: session.user.id, productId });
    return Response.json({ message: 'Added to wishlist' }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { productId } = await req.json();

    await Wishlist.findOneAndDelete({ userId: session.user.id, productId });
    return Response.json({ message: 'Removed from wishlist' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
