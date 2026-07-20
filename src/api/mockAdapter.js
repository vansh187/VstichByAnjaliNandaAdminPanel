import { getDb, mutateDb } from './mockDb.js';
import { REVENUE_COUNTING_STATUSES, PENDING_ACTION_STATUSES } from '../data/seed.js';

const LATENCY_MS = 350;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
}

function isSameDay(isoDate, ref) {
  const d = new Date(isoDate);
  return d.toDateString() === ref.toDateString();
}

// ---------- Auth ----------

export async function login({ admin_username, password }) {
  if (!admin_username || !password) {
    throw new Error('Username and password are required.');
  }
  return delay({
    access_token: 'mock-admin-token',
    token_type: 'bearer',
    admin_id: 1,
    admin_username,
  });
}

// ---------- Orders ----------

export async function getOrders({ status, payment_method, search } = {}) {
  const { orders } = getDb();
  let result = [...orders];
  if (status) result = result.filter((o) => o.order_status === status);
  if (payment_method) result = result.filter((o) => o.payment_method === payment_method);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (o) =>
        String(o.vstitch_order_id).includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_email.toLowerCase().includes(q)
    );
  }
  result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  return delay(result);
}

export async function updateOrderStatus(orderId, order_status) {
  let updated = null;
  mutateDb((db) => {
    const order = db.orders.find((o) => o.vstitch_order_id === orderId);
    if (!order) throw new Error('Order not found.');
    order.order_status = order_status;
    updated = { ...order };
  });
  if (!updated) throw new Error('Order not found.');
  return delay(updated);
}

// ---------- Revenue ----------

export async function getRevenueSummary() {
  const { orders, products } = getDb();
  const today = new Date();

  const paidOrders = orders.filter((o) => REVENUE_COUNTING_STATUSES.has(o.order_status));
  const total_revenue = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);

  const todaysOrders = orders.filter((o) => isSameDay(o.created_date, today));
  const today_revenue = todaysOrders
    .filter((o) => REVENUE_COUNTING_STATUSES.has(o.order_status))
    .reduce((sum, o) => sum + o.total_amount, 0);

  const pending_orders_count = orders.filter((o) => PENDING_ACTION_STATUSES.has(o.order_status)).length;

  const pending_shipments_count = orders.filter((o) =>
    ['confirmed', 'processing', 'shipped', 'out_for_delivery'].includes(o.order_status) && !o.awb_code
  ).length + orders.filter((o) => ['shipped', 'out_for_delivery'].includes(o.order_status)).length;

  const low_stock_count = products.reduce(
    (count, p) => count + p.variants.filter((v) => v.stock_quantity > 0 && v.stock_quantity < 5).length,
    0
  );

  return delay({
    today_revenue,
    today_orders_count: todaysOrders.length,
    total_revenue,
    total_orders_count: orders.length,
    pending_orders_count,
    low_stock_count,
    pending_shipments_count,
  });
}

// ---------- Categories ----------

export async function getCategories() {
  const { categories } = getDb();
  return delay([...categories]);
}

export async function createCategory({ category_name, parent_category_id = null, image_url = null }) {
  if (!category_name || !category_name.trim()) {
    throw new Error('Category name is required.');
  }
  const { categories } = getDb();
  const collision = categories.some(
    (c) => c.category_name.toLowerCase() === category_name.trim().toLowerCase() && c.parent_category_id === parent_category_id
  );
  if (collision) {
    throw new Error(`Category "${category_name}" already exists.`);
  }
  let created = null;
  mutateDb((db) => {
    created = {
      vstitch_category_id: db.nextCategoryId++,
      category_name: category_name.trim(),
      parent_category_id,
      image_url,
      is_active: true,
    };
    db.categories.push(created);
  });
  return delay(created);
}

// ---------- Products ----------

export async function getProducts() {
  const { products, categories } = getDb();
  const withCategory = products.map((p) => ({
    ...p,
    category_name: categories.find((c) => c.vstitch_category_id === p.category_id)?.category_name || null,
  }));
  return delay(withCategory);
}

export async function createProducts(productsPayload) {
  const created = [];
  const errors = [];

  mutateDb((db) => {
    productsPayload.forEach((p, index) => {
      try {
        if (!p.product_name || !p.product_name.trim()) {
          throw new Error('Product name is required.');
        }
        if (!p.category_id) {
          throw new Error('Category is required.');
        }
        if (!p.variants || p.variants.length === 0) {
          throw new Error('At least one variant is required.');
        }
        for (const v of p.variants) {
          if (!v.sku || !v.sku.trim()) throw new Error('SKU is required for every variant.');
          const skuCollision =
            db.products.some((existing) => existing.variants.some((ev) => ev.sku === v.sku)) ||
            created.some((c) => c.variants.some((cv) => cv.sku === v.sku));
          if (skuCollision) throw new Error(`SKU "${v.sku}" already exists.`);
          if (v.price == null || v.price < 0) throw new Error(`Invalid price for SKU "${v.sku}".`);
        }

        const newProduct = {
          vstitch_product_id: db.nextProductId++,
          product_name: p.product_name.trim(),
          description: p.description || '',
          category_id: p.category_id,
          base_price: p.base_price ?? p.variants[0].price,
          is_active: p.is_active !== false,
          variants: p.variants.map((v) => ({
            vstitch_product_variant_id: db.nextVariantId++,
            sku: v.sku.trim(),
            size: v.size || 'Standard',
            color: v.color || 'Standard',
            price: v.price,
            stock_quantity: v.stock_quantity ?? 0,
            weight_kg: v.weight_kg ?? null,
            length_cm: v.length_cm ?? null,
            breadth_cm: v.breadth_cm ?? null,
            height_cm: v.height_cm ?? null,
          })),
          images: p.images || [],
        };
        db.products.push(newProduct);
        created.push(newProduct);
      } catch (err) {
        errors.push({ index, message: err.message });
      }
    });
  });

  return delay({ created, errors });
}

export async function updateProduct(productId, patch) {
  let updated = null;
  mutateDb((db) => {
    const product = db.products.find((p) => p.vstitch_product_id === productId);
    if (!product) throw new Error('Product not found.');
    Object.assign(product, patch);
    updated = { ...product };
  });
  return delay(updated);
}
