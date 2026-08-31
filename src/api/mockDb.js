const STORAGE_KEY = 'vstitch_admin_mock_db_v1';

const initialCategories = [
  { vstitch_category_id: 1, category_name: "Sarees", parent_category_id: null, image_url: null, is_active: true },
  { vstitch_category_id: 2, category_name: "Lehengas", parent_category_id: null, image_url: null, is_active: true },
  { vstitch_category_id: 3, category_name: "Kurti Sets", parent_category_id: null, image_url: null, is_active: true },
  { vstitch_category_id: 4, category_name: "Palazzo Sets", parent_category_id: null, image_url: null, is_active: true },
];

const initialProducts = [
  {
    vstitch_product_id: 1,
    product_name: "Banarasi Silk Saree - Maroon",
    description: "Handwoven Banarasi silk saree with zari border.",
    category_id: 1,
    base_price: 4899,
    is_active: true,
    variants: [
      { vstitch_product_variant_id: 1, sku: "SAR-0142", size: "Standard", color: "Maroon", price: 4899, stock_quantity: 12, weight_kg: 0.5, length_cm: 30, breadth_cm: 20, height_cm: 5 },
    ],
    images: [{ image_url: null, is_primary: true, display_order: 0 }],
  },
  {
    vstitch_product_id: 2,
    product_name: "Chikankari Lehenga - Ivory",
    description: "Ivory chikankari embroidered lehenga set.",
    category_id: 2,
    base_price: 7499,
    is_active: true,
    variants: [
      { vstitch_product_variant_id: 2, sku: "LEH-0087", size: "M", color: "Ivory", price: 7499, stock_quantity: 3, weight_kg: 0.8, length_cm: 35, breadth_cm: 25, height_cm: 8 },
    ],
    images: [{ image_url: null, is_primary: true, display_order: 0 }],
  },
  {
    vstitch_product_id: 3,
    product_name: "Anarkali Kurti Set - Teal",
    description: "Teal anarkali kurti set with dupatta.",
    category_id: 3,
    base_price: 1599,
    is_active: true,
    variants: [
      { vstitch_product_variant_id: 3, sku: "KUR-0231", size: "L", color: "Teal", price: 1599, stock_quantity: 0, weight_kg: 0.4, length_cm: 28, breadth_cm: 18, height_cm: 4 },
    ],
    images: [{ image_url: null, is_primary: true, display_order: 0 }],
  },
  {
    vstitch_product_id: 4,
    product_name: "Bridal Lehenga - Wine Red",
    description: "Heavy embroidered bridal lehenga.",
    category_id: 2,
    base_price: 15999,
    is_active: false,
    variants: [
      { vstitch_product_variant_id: 4, sku: "LEH-0091", size: "M", color: "Wine Red", price: 15999, stock_quantity: 5, weight_kg: 1.2, length_cm: 40, breadth_cm: 30, height_cm: 10 },
    ],
    images: [{ image_url: null, is_primary: true, display_order: 0 }],
  },
];

const now = Date.now();
const daysAgo = (n) => new Date(now - n * 86400000).toISOString();

const initialOrders = [
  {
    vstitch_order_id: 10231, vstitch_user_id: 501, customer_name: "Ananya Sharma", customer_email: "ananya.sharma@example.com",
    order_status: "placed", payment_method: "razorpay", total_amount: 4899,
    shipping_recipient_name: "Ananya Sharma", shipping_address_line1: "12 MG Road", shipping_address_line2: "",
    shipping_city: "Bengaluru", shipping_state: "Karnataka", shipping_postal_code: "560001", shipping_country: "India",
    shipping_phone_number: "9876543210", awb_code: null, courier_name: null, created_date: daysAgo(0),
    items: [{ vstitch_order_item_id: 1, product_name_snapshot: "Banarasi Silk Saree - Maroon", size_snapshot: "Standard", color_snapshot: "Maroon", unit_price_snapshot: 4899, quantity: 1 }],
  },
  {
    vstitch_order_id: 10230, vstitch_user_id: 502, customer_name: "Priya Menon", customer_email: "priya.menon@example.com",
    order_status: "confirmed", payment_method: "cod", total_amount: 3198,
    shipping_recipient_name: "Priya Menon", shipping_address_line1: "45 Marine Drive", shipping_address_line2: "",
    shipping_city: "Kochi", shipping_state: "Kerala", shipping_postal_code: "682001", shipping_country: "India",
    shipping_phone_number: "9876500001", awb_code: null, courier_name: null, created_date: daysAgo(0),
    items: [{ vstitch_order_item_id: 2, product_name_snapshot: "Anarkali Kurti Set - Teal", size_snapshot: "L", color_snapshot: "Teal", unit_price_snapshot: 1599, quantity: 2 }],
  },
  {
    vstitch_order_id: 10229, vstitch_user_id: 503, customer_name: "Kavita Rao", customer_email: "kavita.rao@example.com",
    order_status: "processing", payment_method: "razorpay", total_amount: 7499,
    shipping_recipient_name: "Kavita Rao", shipping_address_line1: "8 Jubilee Hills", shipping_address_line2: "",
    shipping_city: "Hyderabad", shipping_state: "Telangana", shipping_postal_code: "500033", shipping_country: "India",
    shipping_phone_number: "9876500002", awb_code: null, courier_name: null, created_date: daysAgo(1),
    items: [{ vstitch_order_item_id: 3, product_name_snapshot: "Chikankari Lehenga - Ivory", size_snapshot: "M", color_snapshot: "Ivory", unit_price_snapshot: 7499, quantity: 1 }],
  },
  {
    vstitch_order_id: 10228, vstitch_user_id: 504, customer_name: "Simran Kaur", customer_email: "simran.kaur@example.com",
    order_status: "shipped", payment_method: "razorpay", total_amount: 2697,
    shipping_recipient_name: "Simran Kaur", shipping_address_line1: "21 Model Town", shipping_address_line2: "",
    shipping_city: "Ludhiana", shipping_state: "Punjab", shipping_postal_code: "141002", shipping_country: "India",
    shipping_phone_number: "9876500003", awb_code: "SR482910341", courier_name: "Delhivery", created_date: daysAgo(1),
    items: [{ vstitch_order_item_id: 4, product_name_snapshot: "Cotton Kurti", size_snapshot: "S", color_snapshot: "White", unit_price_snapshot: 899, quantity: 3 }],
  },
  {
    vstitch_order_id: 10227, vstitch_user_id: 505, customer_name: "Neha Gupta", customer_email: "neha.gupta@example.com",
    order_status: "delivered", payment_method: "razorpay", total_amount: 15999,
    shipping_recipient_name: "Neha Gupta", shipping_address_line1: "3 Civil Lines", shipping_address_line2: "",
    shipping_city: "Jaipur", shipping_state: "Rajasthan", shipping_postal_code: "302006", shipping_country: "India",
    shipping_phone_number: "9876500004", awb_code: "SR482910209", courier_name: "Shiprocket", created_date: daysAgo(2),
    items: [{ vstitch_order_item_id: 5, product_name_snapshot: "Bridal Lehenga - Wine Red", size_snapshot: "M", color_snapshot: "Wine Red", unit_price_snapshot: 15999, quantity: 1 }],
  },
  {
    vstitch_order_id: 10226, vstitch_user_id: 506, customer_name: "Ritu Verma", customer_email: "ritu.verma@example.com",
    order_status: "cancelled", payment_method: "cod", total_amount: 1899,
    shipping_recipient_name: "Ritu Verma", shipping_address_line1: "17 Sector 22", shipping_address_line2: "",
    shipping_city: "Chandigarh", shipping_state: "Chandigarh", shipping_postal_code: "160022", shipping_country: "India",
    shipping_phone_number: "9876500005", awb_code: null, courier_name: null, created_date: daysAgo(2),
    items: [{ vstitch_order_item_id: 6, product_name_snapshot: "Palazzo Set", size_snapshot: "M", color_snapshot: "Beige", unit_price_snapshot: 1899, quantity: 1 }],
  },
  {
    vstitch_order_id: 10225, vstitch_user_id: 507, customer_name: "Sneha Iyer", customer_email: "sneha.iyer@example.com",
    order_status: "payment_pending", payment_method: "razorpay", total_amount: 3499,
    shipping_recipient_name: "Sneha Iyer", shipping_address_line1: "9 Anna Nagar", shipping_address_line2: "",
    shipping_city: "Chennai", shipping_state: "Tamil Nadu", shipping_postal_code: "600040", shipping_country: "India",
    shipping_phone_number: "9876500006", awb_code: null, courier_name: null, created_date: daysAgo(3),
    items: [{ vstitch_order_item_id: 7, product_name_snapshot: "Georgette Saree", size_snapshot: "Standard", color_snapshot: "Blue", unit_price_snapshot: 3499, quantity: 1 }],
  },
];

const initialCoupons = [
  {
    vstitch_coupon_id: 1, coupon_code: "FESTIVE20", discount_type: "percentage", discount_value: 20,
    min_order_amount: 2000, max_discount_amount: null, usage_limit: null, used_count: 0,
    valid_from: daysAgo(10), valid_until: null, is_active: true, created_date: daysAgo(10),
  },
  {
    vstitch_coupon_id: 2, coupon_code: "WELCOME150", discount_type: "flat", discount_value: 150,
    min_order_amount: null, max_discount_amount: null, usage_limit: null, used_count: 0,
    valid_from: daysAgo(30), valid_until: null, is_active: true, created_date: daysAgo(30),
  },
];

const initialCollections = [
  {
    vstitch_collection_id: 1,
    collection_name: "Summer Luxe",
    slug: "summer-luxe",
    season: "SUMMER",
    subtitle: "Lightweight luxury for the warm months",
    description: "A hand-picked edit of our airiest, most elegant pieces.",
    display_order: 0,
    is_active: true,
    product_ids: [1, 3],
    images: [],
  },
  {
    vstitch_collection_id: 2,
    collection_name: "Winter Warmth",
    slug: "winter-warmth",
    season: "WINTER",
    subtitle: "Rich textures for the cold season",
    description: null,
    display_order: 1,
    is_active: true,
    product_ids: [],
    images: [],
  },
];

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      // Older persisted DBs predate collections — backfill so mock mode works
      // without forcing the user to clear storage.
      if (!saved.collections) {
        saved.collections = initialCollections;
        saved.nextCollectionId = 3;
        saved.nextCollectionImageId = 1;
      }
      return saved;
    }
  } catch {
    // fall through to defaults
  }
  return {
    categories: initialCategories,
    products: initialProducts,
    orders: initialOrders,
    coupons: initialCoupons,
    collections: initialCollections,
    nextCategoryId: 5,
    nextProductId: 5,
    nextVariantId: 5,
    nextCouponId: 3,
    nextCollectionId: 3,
    nextCollectionImageId: 1,
  };
}

let db = load();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // storage may be unavailable (private mode, quota) — mock still works in-memory
  }
}

export function getDb() {
  return db;
}

export function mutateDb(fn) {
  fn(db);
  persist();
}

export function resetDb() {
  localStorage.removeItem(STORAGE_KEY);
  db = load();
}
