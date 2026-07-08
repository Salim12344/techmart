// app/api/products/[id]/route.js
import { connectDB } from '@/lib/db';
import Product from '@/models/product';
import Order from '@/models/order';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const product = await Product.findById(id);
    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }
    return Response.json({ product }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const product = await Product.findByIdAndUpdate(id, body, { new: true });
    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }
    return Response.json({ product });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    // Block deletion while the product is tied to an order that hasn't reached a
    // terminal state yet - the customer paid for something real and it needs to
    // actually ship (or the order needs to be cancelled) before the listing goes away.
    const activeOrders = await Order.countDocuments({
      'items.productId': id,
      status: { $nin: ['delivered', 'cancelled', 'refunded'] },
    });
    if (activeOrders > 0) {
      return Response.json({
        error: `Cannot delete - ${activeOrders} order${activeOrders === 1 ? ' is' : 's are'} still in progress for this product. Wait until ${activeOrders === 1 ? 'it has' : 'they have'} been delivered, cancelled, or refunded.`,
      }, { status: 409 });
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }
    return Response.json({ message: 'Product deleted' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
