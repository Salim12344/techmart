// app/api/products/route.js
import { connectDB } from '@/lib/db';
import Product from '@/models/product';

export async function GET(req) {
  try {
    await connectDB();
    const products = await Product.find({});
    return Response.json({ products }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const product = new Product(body);
    await product.save();
    return Response.json({ product }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
