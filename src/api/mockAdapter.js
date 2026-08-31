import { getDb, mutateDb } from './mockDb.js';
import { REVENUE_COUNTING_STATUSES, PENDING_ACTION_STATUSES } from '../data/seed.js';
import { SLUG_PATTERN, SEASONS } from '../data/collections.js';

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

export async function resetPassword({ admin_username, email, new_password }) {
  if (!admin_username || !admin_username.trim()) {
    throw new Error('Username is required.');
  }
  if (!email || !email.trim()) {
    throw new Error('Email is required.');
  }
  if (!new_password || new_password.length < 8) {
    throw new Error('New password must be at least 8 characters.');
  }
  return delay(null);
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

export async function syncOrderStatus(orderId) {
  let updated = null;
  mutateDb((db) => {
    const order = db.orders.find((o) => o.vstitch_order_id === orderId);
    if (!order) throw new Error('Order not found.');
    if (!order.awb_code) throw new Error('This order has no AWB or shipment assigned yet.');
    updated = { ...order };
  });
  if (!updated) throw new Error('Order not found.');
  return delay(updated);
}

const READY_TO_SHIP_ELIGIBLE = new Set(['placed', 'confirmed', 'processing']);
const MOCK_COURIERS = ['Delhivery', 'Bluedart', 'DTDC', 'Ekart', 'XpressBees'];

// Mirrors the delivered contract in READY_TO_SHIP_API_REQUEST.md — same
// status codes and `detail` messages so mock mode behaves like production.
function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export async function markOrderReadyToShip(orderId) {
  let updated = null;
  let failure = null;
  mutateDb((db) => {
    const order = db.orders.find((o) => o.vstitch_order_id === orderId);
    if (!order) {
      failure = httpError('Order not found', 404);
      return;
    }
    if (!READY_TO_SHIP_ELIGIBLE.has(order.order_status)) {
      failure = httpError('Order cannot be marked ready to ship from its current status', 409);
      return;
    }
    // Simulate the backend booking a Shiprocket shipment + assigning a courier.
    if (!order.awb_code) {
      order.awb_code = String(Math.floor(1e11 + Math.random() * 9e11));
      order.courier_name = MOCK_COURIERS[Math.floor(Math.random() * MOCK_COURIERS.length)];
    }
    order.order_status = 'shipped';
    updated = { ...order };
  });
  if (failure) throw failure;
  if (!updated) throw httpError('Order not found', 404);
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

// ---------- Collections ----------
// Mirrors COLLECTIONS_API_CONTRACT.md — same status codes and `detail`
// messages so mock mode behaves like the real backend.

function collectionSummary(c) {
  const primary = (c.images || []).find((i) => i.is_active && i.is_primary);
  return {
    vstitch_collection_id: c.vstitch_collection_id,
    collection_name: c.collection_name,
    slug: c.slug,
    season: c.season,
    subtitle: c.subtitle ?? null,
    description: c.description ?? null,
    display_order: c.display_order ?? 0,
    is_active: c.is_active !== false,
    product_count: (c.product_ids || []).length,
    primary_image_url: primary ? primary.image_url : null,
  };
}

function collectionDetail(c) {
  const images = (c.images || [])
    .filter((i) => i.is_active)
    .slice()
    .sort(
      (a, b) =>
        (b.is_primary === true) - (a.is_primary === true) ||
        (a.display_order ?? 0) - (b.display_order ?? 0)
    );
  return {
    vstitch_collection_id: c.vstitch_collection_id,
    collection_name: c.collection_name,
    slug: c.slug,
    season: c.season,
    subtitle: c.subtitle ?? null,
    description: c.description ?? null,
    display_order: c.display_order ?? 0,
    is_active: c.is_active !== false,
    product_ids: [...(c.product_ids || [])],
    images: images.map((i) => ({ ...i })),
  };
}

export async function getCollections() {
  const { collections = [] } = getDb();
  const sorted = [...collections].sort(
    (a, b) =>
      (a.display_order ?? 0) - (b.display_order ?? 0) ||
      a.vstitch_collection_id - b.vstitch_collection_id
  );
  return delay(sorted.map(collectionSummary));
}

export async function getCollection(collectionId) {
  const { collections = [] } = getDb();
  const c = collections.find((x) => x.vstitch_collection_id === Number(collectionId));
  if (!c) throw httpError(`Collection ${collectionId} was not found.`, 404);
  return delay(collectionDetail(c));
}

export async function createCollection(payload = {}) {
  const {
    collection_name,
    slug,
    season,
    subtitle = null,
    description = null,
    is_active = true,
    display_order = 0,
  } = payload;

  if (!collection_name || !collection_name.trim() || collection_name.length > 250) {
    throw httpError('collection_name must be 1–250 characters.', 422);
  }
  if (!slug || !SLUG_PATTERN.test(slug) || slug.length > 120) {
    throw httpError("String should match pattern '^[a-z0-9]+(?:-[a-z0-9]+)*$'", 422);
  }
  if (!SEASONS.includes(season)) {
    throw httpError('season must be one of SUMMER, WINTER, SPRING, AUTUMN.', 422);
  }
  const { collections = [] } = getDb();
  if (collections.some((c) => c.slug === slug)) {
    throw httpError('A collection with this slug already exists.', 409);
  }

  let created = null;
  mutateDb((db) => {
    if (!db.collections) db.collections = [];
    if (!db.nextCollectionId) db.nextCollectionId = 1;
    created = {
      vstitch_collection_id: db.nextCollectionId++,
      collection_name: collection_name.trim(),
      slug,
      season,
      subtitle: subtitle || null,
      description: description || null,
      display_order: Number(display_order) || 0,
      is_active: is_active !== false,
      product_ids: [],
      images: [],
    };
    db.collections.push(created);
  });
  return delay(collectionDetail(created));
}

export async function updateCollection(collectionId, patch = {}) {
  let result = null;
  let failure = null;
  mutateDb((db) => {
    const c = (db.collections || []).find((x) => x.vstitch_collection_id === Number(collectionId));
    if (!c) {
      failure = httpError(`Collection ${collectionId} was not found.`, 404);
      return;
    }
    if ('slug' in patch && patch.slug !== null) {
      if (!SLUG_PATTERN.test(patch.slug) || patch.slug.length > 120) {
        failure = httpError("String should match pattern '^[a-z0-9]+(?:-[a-z0-9]+)*$'", 422);
        return;
      }
      if (
        (db.collections || []).some(
          (o) => o.slug === patch.slug && o.vstitch_collection_id !== c.vstitch_collection_id
        )
      ) {
        failure = httpError('A collection with this slug already exists.', 409);
        return;
      }
    }
    if ('season' in patch && patch.season !== null && !SEASONS.includes(patch.season)) {
      failure = httpError('season must be one of SUMMER, WINTER, SPRING, AUTUMN.', 422);
      return;
    }
    // These reject an explicit null.
    for (const key of ['collection_name', 'slug', 'season', 'is_active', 'display_order']) {
      if (key in patch) {
        if (patch[key] === null) {
          failure = httpError(`${key} cannot be null.`, 422);
          return;
        }
        if (key === 'display_order') c[key] = Number(patch[key]) || 0;
        else if (key === 'collection_name') c[key] = String(patch[key]).trim();
        else c[key] = patch[key];
      }
    }
    // These accept an explicit null (clears the field).
    for (const key of ['subtitle', 'description']) {
      if (key in patch) c[key] = patch[key] === null || patch[key] === '' ? null : patch[key];
    }
    result = collectionDetail(c);
  });
  if (failure) throw failure;
  return delay(result);
}

export async function deleteCollection(collectionId) {
  let failure = null;
  mutateDb((db) => {
    const c = (db.collections || []).find((x) => x.vstitch_collection_id === Number(collectionId));
    if (!c) {
      failure = httpError(`Collection ${collectionId} was not found.`, 404);
      return;
    }
    c.is_active = false;
  });
  if (failure) throw failure;
  return delay(null);
}

export async function setCollectionProducts(collectionId, productIds) {
  const ids = Array.isArray(productIds) ? productIds : [];
  if (ids.some((id, i) => ids.indexOf(id) !== i)) {
    throw httpError('product_ids contains duplicates.', 422);
  }
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw httpError('product_ids must be positive integers.', 422);
  }
  if (ids.length > 500) {
    throw httpError('product_ids may contain at most 500 items.', 422);
  }

  let result = null;
  let failure = null;
  mutateDb((db) => {
    const c = (db.collections || []).find((x) => x.vstitch_collection_id === Number(collectionId));
    if (!c) {
      failure = httpError(`Collection ${collectionId} was not found.`, 404);
      return;
    }
    const missing = ids.filter((id) => {
      const p = db.products.find((pr) => pr.vstitch_product_id === id);
      return !p || p.is_active === false;
    });
    if (missing.length > 0) {
      failure = httpError(`Products not found or inactive: [${missing.join(', ')}].`, 422);
      return;
    }
    c.product_ids = [...ids];
    result = collectionDetail(c);
  });
  if (failure) throw failure;
  return delay(result);
}

export async function addCollectionImage(collectionId, payload = {}) {
  const { image_url, is_primary = false, display_order = 0 } = payload;
  if (!image_url || image_url.length > 500) {
    throw httpError('image_url must be 1–500 characters.', 422);
  }

  let created = null;
  let failure = null;
  mutateDb((db) => {
    const c = (db.collections || []).find((x) => x.vstitch_collection_id === Number(collectionId));
    if (!c) {
      failure = httpError(`Collection ${collectionId} was not found.`, 404);
      return;
    }
    if (!c.images) c.images = [];
    if (!db.nextCollectionImageId) db.nextCollectionImageId = 1;
    // First image on a collection is forced primary; a new primary demotes the old.
    const forcedPrimary = c.images.filter((i) => i.is_active).length === 0 ? true : !!is_primary;
    if (forcedPrimary) c.images.forEach((i) => { i.is_primary = false; });
    created = {
      vstitch_collection_image_id: db.nextCollectionImageId++,
      image_url,
      is_primary: forcedPrimary,
      display_order: Number(display_order) || 0,
      is_active: true,
    };
    c.images.push(created);
  });
  if (failure) throw failure;
  return delay({ ...created });
}

export async function updateCollectionImage(collectionId, imageId, patch = {}) {
  let result = null;
  let failure = null;
  mutateDb((db) => {
    const c = (db.collections || []).find((x) => x.vstitch_collection_id === Number(collectionId));
    const img =
      c && (c.images || []).find((i) => i.vstitch_collection_image_id === Number(imageId) && i.is_active);
    if (!c || !img) {
      failure = httpError(`Collection image ${imageId} was not found.`, 404);
      return;
    }
    if ('is_primary' in patch) {
      if (patch.is_primary === null) {
        failure = httpError('is_primary cannot be null.', 422);
        return;
      }
      if (patch.is_primary) {
        c.images.forEach((i) => { i.is_primary = false; });
        img.is_primary = true;
      } else {
        img.is_primary = false;
      }
    }
    if ('display_order' in patch) {
      if (patch.display_order === null) {
        failure = httpError('display_order cannot be null.', 422);
        return;
      }
      img.display_order = Number(patch.display_order) || 0;
    }
    result = { ...img };
  });
  if (failure) throw failure;
  return delay(result);
}

export async function deleteCollectionImage(collectionId, imageId) {
  let failure = null;
  mutateDb((db) => {
    const c = (db.collections || []).find((x) => x.vstitch_collection_id === Number(collectionId));
    const img =
      c && (c.images || []).find((i) => i.vstitch_collection_image_id === Number(imageId) && i.is_active);
    if (!c || !img) {
      failure = httpError(`Collection image ${imageId} was not found.`, 404);
      return;
    }
    img.is_active = false;
    if (img.is_primary) {
      img.is_primary = false;
      const next = c.images
        .filter((i) => i.is_active)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))[0];
      if (next) next.is_primary = true;
    }
  });
  if (failure) throw failure;
  return delay(null);
}

// ---------- Images ----------

export async function uploadImage(file) {
  if (!file) throw new Error('No file selected.');
  // No real storage backend in mock mode — an object URL is good enough to
  // preview the upload for the rest of the session.
  return delay({ image_url: URL.createObjectURL(file) });
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

// ---------- Coupons ----------

export async function getCoupons() {
  const { coupons = [] } = getDb();
  return delay([...coupons].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
}

export async function createCoupon({
  coupon_code,
  discount_type,
  discount_value,
  min_order_amount = null,
  max_discount_amount = null,
  usage_limit = null,
  valid_from = null,
  valid_until = null,
}) {
  if (!coupon_code || !coupon_code.trim()) {
    throw new Error('Coupon code is required.');
  }
  if (!['percentage', 'flat'].includes(discount_type)) {
    throw new Error('Discount type must be "percentage" or "flat".');
  }
  if (!discount_value || Number(discount_value) <= 0) {
    throw new Error('Enter a valid discount value.');
  }
  if (discount_type === 'percentage' && Number(discount_value) > 100) {
    throw new Error('Percentage discount cannot exceed 100.');
  }
  const code = coupon_code.trim().toUpperCase();
  const { coupons = [] } = getDb();
  if (coupons.some((c) => c.coupon_code === code)) {
    throw new Error(`Coupon "${code}" already exists.`);
  }
  let created = null;
  mutateDb((db) => {
    if (!db.coupons) db.coupons = [];
    if (!db.nextCouponId) db.nextCouponId = 1;
    created = {
      vstitch_coupon_id: db.nextCouponId++,
      coupon_code: code,
      discount_type,
      discount_value: Number(discount_value),
      min_order_amount: min_order_amount !== null && min_order_amount !== '' ? Number(min_order_amount) : null,
      max_discount_amount: max_discount_amount !== null && max_discount_amount !== '' ? Number(max_discount_amount) : null,
      usage_limit: usage_limit !== null && usage_limit !== '' ? Number(usage_limit) : null,
      used_count: 0,
      valid_from: valid_from || new Date().toISOString(),
      valid_until: valid_until || null,
      is_active: true,
      created_date: new Date().toISOString(),
    };
    db.coupons.push(created);
  });
  return delay(created);
}

export async function updateCouponStatus(couponId, is_active) {
  let updated = null;
  mutateDb((db) => {
    const coupon = (db.coupons || []).find((c) => c.vstitch_coupon_id === couponId);
    if (!coupon) throw new Error('Coupon not found.');
    coupon.is_active = is_active;
    updated = { ...coupon };
  });
  if (!updated) throw new Error('Coupon not found.');
  return delay(updated);
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
