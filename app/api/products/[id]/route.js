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

    // A color/variant edit can drop entries from `colors` entirely. If an order still
    // in progress references a color being removed, block it the same way a full
    // product delete is blocked - the customer paid for that specific variant.
    if (body.colors) {
      const existing = await Product.findById(id).select('colors.name');
      if (!existing) {
        return Response.json({ error: 'Product not found' }, { status: 404 });
      }
      const keptNames = new Set(body.colors.map((c) => c.name));
      const removedNames = existing.colors.map((c) => c.name).filter((name) => !keptNames.has(name));
      if (removedNames.length > 0) {
        const activeOrders = await Order.countDocuments({
          'items.productId': id,
          'items.color': { $in: removedNames },
          status: { $nin: ['delivered', 'cancelled', 'refunded'] },
        });
        if (activeOrders > 0) {
          return Response.json({
            error: `Cannot remove ${removedNames.join(', ')} - ${activeOrders} order${activeOrders === 1 ? ' is' : 's are'} still in progress for that color. Wait until ${activeOrders === 1 ? 'it has' : 'they have'} been delivered, cancelled, or refunded.`,
          }, { status: 409 });
        }
      }
    }

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
