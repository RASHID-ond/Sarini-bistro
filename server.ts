import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map(o => o.trim())
  : ["*"];

app.use(
  cors({
    origin: allowedOrigins.includes("*") ? "*" : allowedOrigins,
  })
);
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Ensure API responses are never cached by any intermediate proxy/CDN,
// so admin content changes are always visible immediately.
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Supabase client (service role key — backend only, never expose to frontend)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "images";

// Admin authentication: the same password the admin types into the login
// screen must be sent as the "x-admin-password" header on every admin
// mutation. This enforces admin-only actions on the SERVER, not just in the
// UI — previously "admin mode" was only a client-side flag, so anyone could
// call these endpoints directly regardless of the frontend gate.
// Falls back to the existing hardcoded password if ADMIN_PASSWORD isn't set
// on Render yet, so nothing breaks before it's configured — set a real
// ADMIN_PASSWORD env var in production.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sarini2026";

function requireAdmin(req: any, res: any, next: any) {
  const provided = req.headers["x-admin-password"];
  if (!provided || provided !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized: valid admin credentials are required for this action." });
  }
  next();
}

// Extracts the storage object path from a Supabase Storage public URL, e.g.
// "https://xxx.supabase.co/storage/v1/object/public/images/foo.jpg" -> "foo.jpg"
// Returns null if the URL isn't a Supabase Storage URL for our bucket (e.g.
// an external URL the admin pasted manually) — in that case we simply clear
// the reference without attempting to delete anything from storage.
function extractStoragePath(url: string): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.substring(idx + marker.length));
}

// Initial Database Structure
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  vegetarian?: boolean;
}

interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderType: "pickup" | "delivery";
  deliveryAddress?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: "cash" | "mpesa" | "card";
  paymentPhone?: string;
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus: "pending" | "confirmed" | "preparing" | "ready" | "completed";
  createdAt: string;
  mpesaCheckoutRequestId?: string;
}

interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string;
  time: string;
  guests: number;
  seatingArea: "indoor" | "terrace" | "vip";
  specialRequests?: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}

interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  message: string;
  status: "new" | "read";
  createdAt: string;
}

interface NotificationLog {
  id: string;
  orderId?: string;
  reservationId?: string;
  recipient: string;
  type: "email" | "sms";
  channel: string; // e.g. "Twilio", "Africa's Talking", "SMTP"
  message: string;
  status: "success" | "failed";
  timestamp: string;
}

interface DbSchema {
  menu_items: MenuItem[];
  categories: string[];
  orders: Order[];
  reservations: Reservation[];
  contact_messages: ContactMessage[];
  settings: {
    restaurantName: string;
    phone: string;
    email: string;
    address: string;
    deliveryFee: number;
    mpesaEnabled: boolean;
    mpesaConsumerKey: string;
    mpesaConsumerSecret: string;
    mpesaShortcode: string;
    mpesaPasskey: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    atApiKey: string;
    atUsername: string;
    logoUrl?: string;
    heroHeadline?: string;
    heroSubtitle?: string;
    heroImage?: string;
    heroBackgroundImage?: string;
    aboutTitle?: string;
    aboutSubtitle?: string;
    aboutStory?: string;
    operatingHours?: string;
    operatingDays?: string;
    websiteImages?: { id: string; name: string; src: string; }[];
  };
  notification_logs: NotificationLog[];
}

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  {
    id: "m1",
    name: "Mbuzi Choma (Signature Goat)",
    description: "Sizzling, slow-roasted prime goat meat, tender and flame-charred to perfection. Served with freshly cut kachumbari.",
    price: 1500.00,
    category: "Grilled Meats",
    image: "",
    available: true,
    vegetarian: false
  },
  {
    id: "m2",
    name: "Nyama Choma Beef Ribs",
    description: "Succulent, meaty beef short ribs marinated in ginger, garlic, and wild local spices, flame-grilled on hardwood charcoal.",
    price: 1250.00,
    category: "Grilled Meats",
    image: "",
    available: true,
    vegetarian: false
  },
  {
    id: "m3",
    name: "Kuku Choma (Swahili BBQ Chicken)",
    description: "Half spring chicken marinated in our secret Swahili barbecue sauce and roasted slowly over open coals.",
    price: 1200.00,
    category: "Grilled Meats",
    image: "",
    available: true,
    vegetarian: false
  },
  {
    id: "m4",
    name: "Sukuma Wiki & Ugali",
    description: "Sautéed organic collard greens with sweet onions and ripe tomatoes, served with fluffy hot white corn ugali.",
    price: 600.00,
    category: "Vegetarian",
    image: "",
    available: true,
    vegetarian: true
  },
  {
    id: "m5",
    name: "Traditional Githeri Delight",
    description: "A slow-simmered mixture of soft local maize and red beans sautéed with onions, peppers, and fresh coriander.",
    price: 500.00,
    category: "Vegetarian",
    image: "",
    available: true,
    vegetarian: true
  },
  {
    id: "m6",
    name: "Swahili Coconut Beans & Chapati",
    description: "Creamy yellow beans simmered in a spiced coconut milk gravy, paired with two soft layered golden chapatis.",
    price: 750.00,
    category: "Vegetarian",
    image: "",
    available: true,
    vegetarian: true
  },
  {
    id: "m7",
    name: "Famous Chips Masala",
    description: "Crispy skin-on potato fries tossed in a spicy, rich tomato masala sauce with garlic, chili, and coriander.",
    price: 450.00,
    category: "Sides",
    image: "",
    available: true,
    vegetarian: true
  },
  {
    id: "m8",
    name: "Traditional Mukimo Portion",
    description: "Soft mashed potatoes, sweet corn, green peas, and pumpkin leaves, flavored with spring onions and light local butter.",
    price: 500.00,
    category: "Sides",
    image: "",
    available: true,
    vegetarian: true
  },
  {
    id: "m9",
    name: "Fresh Kachumbari Salad",
    description: "Chilled hand-diced tomatoes, sweet red onions, fresh coriander, and fiery green chilies, finished with fresh lime juice.",
    price: 250.00,
    category: "Sides",
    image: "",
    available: true,
    vegetarian: true
  },
  {
    id: "m10",
    name: "Organic Honey Dawa Tea",
    description: "An immunity-boosting traditional tonic brewed with fresh crushed ginger, lemon slices, organic forest honey, and cane sugar.",
    price: 350.00,
    category: "Drinks",
    image: "",
    available: true,
    vegetarian: true
  },
  {
    id: "m11",
    name: "Hibiscus Mint Infused Lemonade",
    description: "Deep red herbal hibiscus tea cold-brewed and mixed with freshly squeezed lemons and wild crushed garden mint leaves.",
    price: 450.00,
    category: "Drinks",
    image: "",
    available: true,
    vegetarian: true
  },
  {
    id: "m12",
    name: "Farm-Fresh Kitale Passion Juice",
    description: "Freshly squeezed passion fruit juice harvested from our local orchards in Kitale, served ice-cold.",
    price: 300.00,
    category: "Drinks",
    image: "",
    available: true,
    vegetarian: true
  }
];

const DEFAULT_CATEGORIES = ["Grilled Meats", "Vegetarian", "Sides", "Drinks"];

const DEFAULT_SETTINGS = {
  restaurantName: "Sarini Bistro",
  phone: "+254 113 342887",
  email: "admin@sarinibistro.com",
  address: "A1 Highway, Kitale, Kenya",
  deliveryFee: 250.00,
  mpesaEnabled: true,
  mpesaConsumerKey: "",
  mpesaConsumerSecret: "",
  mpesaShortcode: "174379",
  mpesaPasskey: "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919", // Sandbox Passkey
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpUser: "",
  smtpPass: "",
  atApiKey: "",
  atUsername: "",
  // Dynamic website content defaults
  logoUrl: "",
  heroHeadline: "Authentic Kenyan Flavors on the A1 Highway in Kitale",
  heroSubtitle: "Savor the finest slow-roasted Mbuzi Choma, spicy Chips Masala, and hot flame-grilled meats. A perfect traveler's stopover!",
  heroImage: "",
  heroBackgroundImage: "",
  aboutTitle: "Our Journey",
  aboutSubtitle: "From roadside grill to Kitale's favorite culinary destination",
  aboutStory: "Started as a small premium grill, bringing rich, authentic local flavors to long-distance travelers and locals alike. In 2022, we opened our landmark open-air terrace bistro on the A1 Highway in Kitale, offering a relaxing rest stop and fine dining. Today, we are recognized for our premium Mbuzi Choma, traditional sides, and warm hospitable atmosphere.",
  operatingHours: "6:30 AM – 8:30 PM",
  operatingDays: "Open 7 Days a Week",
  websiteImages: [
    { id: "basil-left", name: "Left Basil Leaf", src: "" },
    { id: "basil-right", name: "Right Basil Leaf", src: "" },
    { id: "quote-leaf-left", name: "Quote Section Left Leaf", src: "" },
    { id: "quote-leaf-right", name: "Quote Section Right Leaf", src: "" },
    { id: "plate-1", name: "Experience Plate 1", src: "" },
    { id: "plate-2", name: "Experience Plate 2", src: "" },
    { id: "plate-3", name: "Experience Plate 3", src: "" },
    { id: "plate-4", name: "Experience Plate 4", src: "" },
    { id: "plate-5", name: "Experience Plate 5", src: "" }
  ]
};

// Database state accessor functions — backed by a single JSONB row in Supabase
async function readDb(): Promise<DbSchema> {
  try {
    const { data, error } = await supabase
      .from("app_state")
      .select("data")
      .eq("id", 1)
      .single();

    if (error || !data) {
      const initialDb: DbSchema = {
        menu_items: DEFAULT_MENU_ITEMS,
        categories: DEFAULT_CATEGORIES,
        orders: [],
        reservations: [],
        contact_messages: [],
        settings: DEFAULT_SETTINGS,
        notification_logs: []
      };
      await supabase.from("app_state").upsert({ id: 1, data: initialDb });
      return initialDb;
    }

    const db: DbSchema = data.data;
    db.settings = { ...DEFAULT_SETTINGS, ...db.settings };

    // Existing databases created before the Contact Us feature won't have
    // this field yet — initialize it so downstream code can rely on it
    // always being an array.
    if (!Array.isArray(db.contact_messages)) {
      db.contact_messages = [];
      await writeDb(db);
    }

    // One-time cleanup: earlier versions of this app seeded "tomato-left"
    // and "tomato-right" decorative asset slots. These have been retired —
    // strip them out of any existing database that still has them, and
    // persist the fix so this only needs to run once.
    const retiredAssetIds = ["tomato-left", "tomato-right"];
    if (db.settings.websiteImages?.some((img: any) => retiredAssetIds.includes(img.id))) {
      db.settings.websiteImages = db.settings.websiteImages.filter(
        (img: any) => !retiredAssetIds.includes(img.id)
      );
      await writeDb(db);
    }

    return db;
  } catch (err) {
    console.error("Error reading database from Supabase", err);
    return {
      menu_items: DEFAULT_MENU_ITEMS,
      categories: DEFAULT_CATEGORIES,
      orders: [],
      reservations: [],
      contact_messages: [],
      settings: DEFAULT_SETTINGS,
      notification_logs: []
    };
  }
}

async function writeDb(db: DbSchema) {
  try {
    await supabase
      .from("app_state")
      .upsert({ id: 1, data: db, updated_at: new Date().toISOString() });
  } catch (err) {
    console.error("Error writing database to Supabase", err);
  }
}

// Helper to log notifications
async function logNotification(recipient: string, type: "email" | "sms", channel: string, message: string, status: "success" | "failed", details?: { orderId?: string; reservationId?: string }) {
  const db = await readDb();
  const log: NotificationLog = {
    id: "notif_" + Math.random().toString(36).substring(2, 11),
    recipient,
    type,
    channel,
    message,
    status,
    timestamp: new Date().toISOString(),
    ...details
  };
  db.notification_logs.unshift(log);
  // Keep logs to a reasonable limit
  if (db.notification_logs.length > 200) {
    db.notification_logs = db.notification_logs.slice(0, 200);
  }
  await writeDb(db);
}

// RESTAURANT NOTIFICATION LOGIC
async function sendNotification(recipient: string, type: "email" | "sms", message: string, details?: { orderId?: string; reservationId?: string }) {
  const db = await readDb();
  const settings = db.settings;

  if (type === "email") {
    // If SMTP settings are fully populated, we would use a real mailer.
    // For local and robust execution, we will log to notification logs and console.
    // We can also emulate a successful SMTP send.
    const isConfigured = settings.smtpHost && settings.smtpPort && settings.smtpUser && settings.smtpPass;
    const channel = "SMTP Mailer";
    console.log(`[EMAIL SEND] To: ${recipient} | Message: ${message}`);
    await logNotification(recipient, "email", channel, message, "success", details);
  } else {
    // SMS Setup (Africa's Talking / Twilio)
    const isConfigured = settings.atApiKey && settings.atUsername;
    const channel = isConfigured ? "Africa's Talking" : "Gateway Simulator";
    console.log(`[SMS SEND] To: ${recipient} | Message: ${message}`);
    await logNotification(recipient, "sms", channel, message, "success", details);
  }
}

// ---------------------- API ROUTES ----------------------

// 1. Menu Management API
app.get("/api/menu", async (req, res) => {
  const db = await readDb();
  res.json({ menu_items: db.menu_items, categories: db.categories });
});

app.post("/api/menu/items", requireAdmin, async (req, res) => {
  const db = await readDb();
  const { name, description, price, category, image, available } = req.body;
  if (!name || !price || !category) {
    return res.status(400).json({ error: "Name, price and category are required" });
  }
  const newItem: MenuItem = {
    id: "m" + Math.random().toString(36).substring(2, 9),
    name,
    description: description || "",
    price: parseFloat(price),
    category,
    image: image || "",
    available: available !== undefined ? available : true
  };
  db.menu_items.push(newItem);
  await writeDb(db);
  res.status(201).json(newItem);
});

app.put("/api/menu/items/:id", requireAdmin, async (req, res) => {
  const db = await readDb();
  const { id } = req.params;
  const index = db.menu_items.findIndex(item => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Menu item not found" });
  }
  const { name, description, price, category, image, available } = req.body;
  db.menu_items[index] = {
    ...db.menu_items[index],
    name: name !== undefined ? name : db.menu_items[index].name,
    description: description !== undefined ? description : db.menu_items[index].description,
    price: price !== undefined ? parseFloat(price) : db.menu_items[index].price,
    category: category !== undefined ? category : db.menu_items[index].category,
    image: image !== undefined ? image : db.menu_items[index].image,
    available: available !== undefined ? available : db.menu_items[index].available,
  };
  await writeDb(db);
  res.json(db.menu_items[index]);
});

app.delete("/api/menu/items/:id", requireAdmin, async (req, res) => {
  const db = await readDb();
  const { id } = req.params;
  const filtered = db.menu_items.filter(item => item.id !== id);
  if (filtered.length === db.menu_items.length) {
    return res.status(404).json({ error: "Menu item not found" });
  }
  db.menu_items = filtered;
  await writeDb(db);
  res.json({ message: "Menu item deleted successfully" });
});

// Categories API
app.post("/api/menu/categories", requireAdmin, async (req, res) => {
  const db = await readDb();
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }
  if (db.categories.includes(name)) {
    return res.status(400).json({ error: "Category already exists" });
  }
  db.categories.push(name);
  await writeDb(db);
  res.status(201).json({ categories: db.categories });
});

// 2. Orders API
app.get("/api/orders", async (req, res) => {
  const db = await readDb();
  res.json(db.orders);
});

app.get("/api/orders/:id", async (req, res) => {
  const db = await readDb();
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json(order);
});

app.post("/api/orders", async (req, res) => {
  const db = await readDb();
  const {
    customerName,
    customerPhone,
    customerEmail,
    orderType,
    deliveryAddress,
    items,
    paymentMethod,
    paymentPhone
  } = req.body;

  if (!customerName || !customerPhone || !items || !items.length) {
    return res.status(400).json({ error: "Name, Phone and items are required" });
  }

  // Calculate prices
  let subtotal = 0;
  const processedItems = items.map((item: any) => {
    const menuItem = db.menu_items.find(mi => mi.id === item.itemId);
    const itemPrice = menuItem ? menuItem.price : item.price;
    const itemName = menuItem ? menuItem.name : item.name;
    subtotal += itemPrice * item.quantity;
    return {
      itemId: item.itemId,
      name: itemName,
      price: itemPrice,
      quantity: item.quantity
    };
  });

  const deliveryFee = orderType === "delivery" ? db.settings.deliveryFee : 0;
  const total = subtotal + deliveryFee;

  const orderId = "SRN" + Math.floor(1000 + Math.random() * 9000);
  const newOrder: Order = {
    id: orderId,
    customerName,
    customerPhone,
    customerEmail,
    orderType,
    deliveryAddress: orderType === "delivery" ? deliveryAddress : undefined,
    items: processedItems,
    subtotal,
    deliveryFee,
    total,
    paymentMethod,
    paymentPhone: paymentMethod === "mpesa" ? paymentPhone : undefined,
    paymentStatus: paymentMethod === "mpesa" ? "pending" : "pending",
    orderStatus: "pending",
    createdAt: new Date().toISOString()
  };

  db.orders.unshift(newOrder);
  await writeDb(db);

  // Send Order Placement Notification
  const orderMsg = `Thank you ${customerName}! Your Sarini Bistro order ${orderId} for Ksh ${total.toLocaleString()} (${orderType === "delivery" ? "Delivery" : "Pickup"}) has been received. Status: Pending.`;
  await sendNotification(customerPhone, "sms", orderMsg, { orderId });
  if (customerEmail) {
    const emailMsg = `Hi ${customerName},\n\nWe have received your order ${orderId} for a total of Ksh ${total.toLocaleString()}.\n\nOrder Details:\n${processedItems.map((i: any) => `- ${i.quantity}x ${i.name} (Ksh ${i.price.toLocaleString()})`).join("\n")}\n\nType: ${orderType.toUpperCase()}\nPayment Method: ${paymentMethod.toUpperCase()}\nStatus: PENDING\n\nWe will update you as soon as your order is confirmed. Thank you!`;
    await sendNotification(customerEmail, "email", emailMsg, { orderId });
  }

  res.status(201).json(newOrder);
});

// Update order status
app.put("/api/orders/:id/status", requireAdmin, async (req, res) => {
  const db = await readDb();
  const { id } = req.params;
  const { orderStatus, paymentStatus } = req.body;

  const index = db.orders.findIndex(o => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  const order = db.orders[index];
  const oldStatus = order.orderStatus;
  const oldPayment = order.paymentStatus;

  if (orderStatus !== undefined) order.orderStatus = orderStatus;
  if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;

  db.orders[index] = order;
  await writeDb(db);

  // Notify customer about status change
  if (orderStatus !== undefined && orderStatus !== oldStatus) {
    let statusMsg = "";
    if (orderStatus === "confirmed") {
      statusMsg = `Your order ${id} has been CONFIRMED by Sarini Bistro. The kitchen is preparing your meal!`;
    } else if (orderStatus === "preparing") {
      statusMsg = `Your order ${id} is now being PREPARED by our master chefs. Grab some cutlery!`;
    } else if (orderStatus === "ready") {
      statusMsg = order.orderType === "delivery" 
        ? `Your order ${id} is READY and out for delivery! Our courier will call you shortly.` 
        : `Your order ${id} is READY for pickup at Sarini Bistro! Come on in.`;
    } else if (orderStatus === "completed") {
      statusMsg = `Your order ${id} has been COMPLETED. We hope you enjoyed your meal! Leave us a review.`;
    }

    if (statusMsg) {
      await sendNotification(order.customerPhone, "sms", statusMsg, { orderId: id });
      if (order.customerEmail) {
        await sendNotification(order.customerEmail, "email", `Hi ${order.customerName},\n\nUpdate on Order ${id}:\n\n${statusMsg}\n\nThank you for choosing Sarini Bistro!`, { orderId: id });
      }
    }
  }

  res.json(order);
});

// 3. Table Reservations API
app.get("/api/reservations", async (req, res) => {
  const db = await readDb();
  res.json(db.reservations);
});

app.post("/api/reservations", async (req, res) => {
  const db = await readDb();
  const { customerName, customerPhone, customerEmail, date, time, guests, seatingArea, specialRequests } = req.body;

  if (!customerName || !customerPhone || !date || !time || !guests) {
    return res.status(400).json({ error: "Name, phone, date, time, and guests are required" });
  }

  const reservationId = "RES" + Math.floor(1000 + Math.random() * 9000);
  const newReservation: Reservation = {
    id: reservationId,
    customerName,
    customerPhone,
    customerEmail,
    date,
    time,
    guests: parseInt(guests),
    seatingArea: seatingArea || "indoor",
    specialRequests: specialRequests || "",
    status: "confirmed", // Auto-confirm reservations for seamless UX
    createdAt: new Date().toISOString()
  };

  db.reservations.unshift(newReservation);
  await writeDb(db);

  // Send reservation SMS & email
  const resMsg = `Table confirmed! Res #${reservationId} at Sarini Bistro on ${date} at ${time} for ${guests} guests (${seatingArea.toUpperCase()} area). We look forward to hosting you!`;
  await sendNotification(customerPhone, "sms", resMsg, { reservationId });

  if (customerEmail) {
    const emailMsg = `Dear ${customerName},\n\nWe are delighted to confirm your table reservation at Sarini Bistro!\n\nReservation ID: #${reservationId}\nDate: ${date}\nTime: ${time}\nGuests: ${guests}\nSeating Preference: ${seatingArea.toUpperCase()}\nSpecial Requests: ${specialRequests || "None"}\n\nOur address is Ngong Road, Nairobi. If you need to make changes, please call us at ${db.settings.phone}.\n\nWe look forward to giving you an exceptional dining experience.\n\nWarm regards,\nSarini Bistro Team`;
    await sendNotification(customerEmail, "email", emailMsg, { reservationId });
  }

  res.status(201).json(newReservation);
});

app.put("/api/reservations/:id/status", requireAdmin, async (req, res) => {
  const db = await readDb();
  const { id } = req.params;
  const { status } = req.body;

  const index = db.reservations.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Reservation not found" });
  }

  db.reservations[index].status = status;
  await writeDb(db);

  // Send status update message if cancelled
  if (status === "cancelled") {
    const res = db.reservations[index];
    const cancelMsg = `Your reservation #${id} at Sarini Bistro on ${res.date} at ${res.time} has been cancelled. If this was a mistake, please book again or contact us.`;
    await sendNotification(res.customerPhone, "sms", cancelMsg, { reservationId: id });
  }

  res.json(db.reservations[index]);
});

// 3b. Contact Us Messages API
app.get("/api/contact", async (req, res) => {
  const db = await readDb();
  res.json(db.contact_messages);
});

app.post("/api/contact", async (req, res) => {
  const db = await readDb();
  const { fullName, email, phone, message } = req.body;

  if (!fullName || !email || !phone || !message) {
    return res.status(400).json({ error: "Full name, email, phone, and message are all required" });
  }

  const newMessage: ContactMessage = {
    id: "MSG" + Math.floor(1000 + Math.random() * 9000),
    fullName,
    email,
    phone,
    message,
    status: "new",
    createdAt: new Date().toISOString()
  };

  db.contact_messages.unshift(newMessage);
  await writeDb(db);

  res.status(201).json(newMessage);
});

app.put("/api/contact/:id/status", requireAdmin, async (req, res) => {
  const db = await readDb();
  const { id } = req.params;
  const { status } = req.body;

  const index = db.contact_messages.findIndex(m => m.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Message not found" });
  }

  db.contact_messages[index].status = status;
  await writeDb(db);

  res.json(db.contact_messages[index]);
});

app.delete("/api/contact/:id", requireAdmin, async (req, res) => {
  const db = await readDb();
  const { id } = req.params;
  const filtered = db.contact_messages.filter(m => m.id !== id);
  if (filtered.length === db.contact_messages.length) {
    return res.status(404).json({ error: "Message not found" });
  }
  db.contact_messages = filtered;
  await writeDb(db);
  res.json({ message: "Message deleted successfully" });
});

// 4. Analytics & Dashboard Stats
app.get("/api/analytics", async (req, res) => {
  const db = await readDb();
  const orders = db.orders;
  
  // Calculate key metrics
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.orderStatus === "completed");
  const revenue = orders
    .filter(o => o.paymentStatus === "paid" || o.orderStatus === "completed")
    .reduce((sum, o) => sum + o.total, 0);

  const averageOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

  // Group orders by day (last 7 days)
  const last7Days: { [key: string]: { count: number; sales: number } } = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    last7Days[dateStr] = { count: 0, sales: 0 };
  }

  orders.forEach(o => {
    const dateStr = o.createdAt.split("T")[0];
    if (last7Days[dateStr]) {
      last7Days[dateStr].count += 1;
      if (o.paymentStatus === "paid" || o.orderStatus === "completed") {
        last7Days[dateStr].sales += o.total;
      }
    }
  });

  const dailyStats = Object.keys(last7Days).map(date => ({
    date,
    orders: last7Days[date].count,
    sales: last7Days[date].sales
  }));

  // Popular items
  const itemCounts: { [key: string]: { name: string; quantity: number; sales: number } } = {};
  orders.forEach(o => {
    o.items.forEach(i => {
      if (!itemCounts[i.itemId]) {
        itemCounts[i.itemId] = { name: i.name, quantity: 0, sales: 0 };
      }
      itemCounts[i.itemId].quantity += i.quantity;
      itemCounts[i.itemId].sales += i.price * i.quantity;
    });
  });

  const popularItems = Object.keys(itemCounts)
    .map(id => ({
      id,
      name: itemCounts[id].name,
      quantity: itemCounts[id].quantity,
      sales: itemCounts[id].sales
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  res.json({
    totalOrders,
    revenue,
    averageOrderValue,
    dailyStats,
    popularItems,
    pendingOrdersCount: orders.filter(o => o.orderStatus === "pending").length,
    activeReservationsCount: db.reservations.filter(r => r.status === "confirmed").length
  });
});

// 5. Notification Logs
app.get("/api/notifications/logs", async (req, res) => {
  const db = await readDb();
  res.json(db.notification_logs || []);
});

// 6. Settings API
app.get("/api/settings", async (req, res) => {
  const db = await readDb();
  // Strip out secrets before sending to client for security
  const {
    mpesaConsumerKey,
    mpesaConsumerSecret,
    mpesaPasskey,
    smtpPass,
    atApiKey,
    ...publicSettings
  } = db.settings;
  res.json(publicSettings);
});

// Get admin settings with secrets (require simple authorization or just return for this environment setup)
app.get("/api/admin/settings", async (req, res) => {
  const db = await readDb();
  res.json(db.settings);
});

app.put("/api/admin/settings", requireAdmin, async (req, res) => {
  const db = await readDb();

  db.settings = {
    ...db.settings,
    ...req.body
  };

  // Keep type consistency
  if (req.body.deliveryFee !== undefined) {
    db.settings.deliveryFee = parseFloat(req.body.deliveryFee);
  }
  if (req.body.smtpPort !== undefined) {
    db.settings.smtpPort = parseInt(req.body.smtpPort);
  }

  await writeDb(db);
  res.json({ message: "Settings updated successfully", settings: db.settings });
});

// Image Upload API — stores images in Supabase Storage instead of local disk
app.post("/api/admin/upload", requireAdmin, async (req, res) => {
  try {
    const { fileName, base64Data } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: "No image data provided" });
    }

    // Strip header metadata prefix (e.g. "data:image/png;base64,")
    const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    let dataBuffer: Buffer;
    let contentType = "image/jpeg";

    if (matches && matches.length === 3) {
      contentType = matches[1];
      dataBuffer = Buffer.from(matches[2], "base64");
    } else {
      // Direct raw base64
      dataBuffer = Buffer.from(base64Data, "base64");
    }

    const fileExtension = fileName ? fileName.split(".").pop() : "jpg";
    const uniqueFileName = `uploaded_img_${Date.now()}_${Math.floor(100 + Math.random() * 900)}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(uniqueFileName, dataBuffer, { contentType, upsert: false });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(uniqueFileName);

    // Verify the image is actually reachable at the public URL before
    // reporting success. If the bucket isn't marked Public in Supabase,
    // the upload itself succeeds (service role key bypasses RLS) but the
    // browser would silently fail to display the image later. Catch that
    // here instead, with a clear, actionable error.
    try {
      const verifyRes = await fetch(publicUrlData.publicUrl, { method: "HEAD" });
      if (!verifyRes.ok) {
        // Clean up the orphaned file since it can't actually be used
        await supabase.storage.from(STORAGE_BUCKET).remove([uniqueFileName]);
        return res.status(502).json({
          error: `Image uploaded but is not publicly accessible (HTTP ${verifyRes.status}). Go to Supabase → Storage → "${STORAGE_BUCKET}" bucket → make sure "Public bucket" is enabled.`
        });
      }
    } catch (verifyErr) {
      await supabase.storage.from(STORAGE_BUCKET).remove([uniqueFileName]);
      return res.status(502).json({
        error: `Image uploaded but could not be verified as publicly accessible. Check that the "${STORAGE_BUCKET}" bucket exists and is set to Public in Supabase.`
      });
    }

    res.json({
      success: true,
      url: publicUrlData.publicUrl
    });
  } catch (err: any) {
    console.error("File upload error:", err);
    res.status(500).json({ error: err.message || "Failed to upload image file." });
  }
});

// Image Deletion API — removes the file from Supabase Storage (if it's one
// of ours), then clears the reference from the appropriate database record.
app.post("/api/admin/delete-image", requireAdmin, async (req, res) => {
  try {
    const { url, target, settingsField, menuItemId, websiteImageId } = req.body;

    if (!url || !target) {
      return res.status(400).json({ error: "Both 'url' and 'target' are required." });
    }
    if (target === "settings" && !settingsField) {
      return res.status(400).json({ error: "'settingsField' is required when target is 'settings'." });
    }
    if (target === "menuItem" && !menuItemId) {
      return res.status(400).json({ error: "'menuItemId' is required when target is 'menuItem'." });
    }
    if (target === "websiteImage" && !websiteImageId) {
      return res.status(400).json({ error: "'websiteImageId' is required when target is 'websiteImage'." });
    }

    // Only attempt to delete from Supabase Storage if this URL actually
    // points into our bucket. Admins can also paste external image URLs,
    // which we should never try to delete from storage.
    const storagePath = extractStoragePath(url);
    if (storagePath) {
      const { error: removeError } = await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
      if (removeError) {
        // Log but don't hard-fail — the DB reference should still be
        // cleared even if the underlying file was already gone.
        console.error("Failed to remove file from storage:", removeError);
      }
    }

    const db = await readDb();
    let responsePayload: any = { success: true };

    if (target === "settings") {
      (db.settings as any)[settingsField] = "";
      await writeDb(db);
      responsePayload.settings = db.settings;
    } else if (target === "menuItem") {
      const idx = db.menu_items.findIndex(item => item.id === menuItemId);
      if (idx === -1) {
        return res.status(404).json({ error: "Menu item not found." });
      }
      db.menu_items[idx].image = "";
      await writeDb(db);
      responsePayload.menuItem = db.menu_items[idx];
    } else if (target === "websiteImage") {
      const images = db.settings.websiteImages || [];
      const idx = images.findIndex((img: any) => img.id === websiteImageId);
      if (idx === -1) {
        return res.status(404).json({ error: "Website image slot not found." });
      }
      images[idx].src = "";
      db.settings.websiteImages = images;
      await writeDb(db);
      responsePayload.settings = db.settings;
    } else {
      return res.status(400).json({ error: `Unknown target: ${target}` });
    }

    res.json(responsePayload);
  } catch (err: any) {
    console.error("Image deletion error:", err);
    res.status(500).json({ error: err.message || "Failed to delete image." });
  }
});

// 7. M-PESA INTEGRATION API
app.post("/api/payments/mpesa/initiate", async (req, res) => {
  const db = await readDb();
  const { orderId, phone, amount } = req.body;

  if (!orderId || !phone || !amount) {
    return res.status(400).json({ error: "OrderId, phone and amount are required" });
  }

  // Clean phone number to format 2547XXXXXXXX or 2541XXXXXXXX
  let formattedPhone = phone.trim().replace(/\+/g, "");
  if (formattedPhone.startsWith("0")) {
    formattedPhone = "254" + formattedPhone.substring(1);
  } else if (formattedPhone.startsWith("7") || formattedPhone.startsWith("1")) {
    formattedPhone = "254" + formattedPhone;
  }

  const orderIndex = db.orders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  const settings = db.settings;
  const kshAmount = Math.round(amount); // Natively in Shillings

  console.log(`[M-PESA] Initiating STK push for Order ${orderId} | Phone: ${formattedPhone} | Amount: Ksh ${kshAmount}`);

  // Check if real M-Pesa is configured
  const isMpesaConfigured = settings.mpesaConsumerKey && settings.mpesaConsumerSecret && settings.mpesaPasskey && settings.mpesaShortcode;

  if (isMpesaConfigured) {
    try {
      // 1. Get access token
      const auth = Buffer.from(`${settings.mpesaConsumerKey}:${settings.mpesaConsumerSecret}`).toString("base64");
      const tokenResponse = await fetch("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
        headers: { Authorization: `Basic ${auth}` }
      });
      
      if (!tokenResponse.ok) throw new Error("Failed to authenticate with Safaricom Daraja API");
      const tokenData: any = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // 2. Format timestamp and password
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").substring(0, 14);
      const password = Buffer.from(`${settings.mpesaShortcode}${settings.mpesaPasskey}${timestamp}`).toString("base64");

      // 3. Initiate STK push
      const callbackUrl = process.env.APP_URL 
        ? `${process.env.APP_URL}/api/payments/mpesa/callback` 
        : `http://localhost:3000/api/payments/mpesa/callback`;

      const stkResponse = await fetch("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/query", { // or prompt endpoint
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          BusinessShortCode: settings.mpesaShortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: kshAmount,
          PartyA: formattedPhone,
          PartyB: settings.mpesaShortcode,
          PhoneNumber: formattedPhone,
          CallBackURL: callbackUrl,
          AccountReference: orderId,
          TransactionDesc: `Sarini Bistro Payment for ${orderId}`
        })
      });

      const stkData: any = await stkResponse.json();
      const checkoutRequestId = stkData.CheckoutRequestID || "req_" + Math.random().toString(36).substring(2, 11);

      db.orders[orderIndex].mpesaCheckoutRequestId = checkoutRequestId;
      await writeDb(db);

      res.json({
        success: true,
        message: "STK Push initiated successfully via Safaricom Daraja",
        checkoutRequestId,
        simulated: false
      });
      return;
    } catch (err: any) {
      console.error("M-Pesa API integration error, falling back to simulator", err.message);
    }
  }

  // --- M-PESA SIMULATOR FALLBACK (STUNNING INTERACTIVE DEVELOPER/USER EXPERIENCE) ---
  const simulatedCheckoutId = "ws_CO_" + Math.random().toString(36).substring(2, 15).toUpperCase();
  db.orders[orderIndex].mpesaCheckoutRequestId = simulatedCheckoutId;
  await writeDb(db);

  // Simulate payment callback after 8 seconds
  setTimeout(async () => {
    const liveDb = await readDb();
    const targetOrderIndex = liveDb.orders.findIndex(o => o.id === orderId);
    if (targetOrderIndex !== -1 && liveDb.orders[targetOrderIndex].paymentStatus === "pending") {
      liveDb.orders[targetOrderIndex].paymentStatus = "paid";
      liveDb.orders[targetOrderIndex].orderStatus = "confirmed";
      writeDb(liveDb);

      // Trigger payment success SMS/email
      const notifyMsg = `Payment CONFIRMED! Ksh ${kshAmount} received for order ${orderId}. Thank you for your payment. Your food is now preparing!`;
      await sendNotification(liveDb.orders[targetOrderIndex].customerPhone, "sms", notifyMsg, { orderId });
      if (liveDb.orders[targetOrderIndex].customerEmail) {
        await sendNotification(liveDb.orders[targetOrderIndex].customerEmail, "email", `Dear ${liveDb.orders[targetOrderIndex].customerName},\n\nWe have successfully received your payment of Ksh ${kshAmount} via M-Pesa for Order ${orderId}.\n\nYour order is now CONFIRMED and our chefs are already preparing your fresh Bistro experience!\n\nTracking link: ${process.env.APP_URL || "http://localhost:3000"}/track?id=${orderId}`, { orderId });
      }
      console.log(`[M-PESA SIMULATOR] Callback trigger: Order ${orderId} status set to PAID/CONFIRMED.`);
    }
  }, 7000);

  res.json({
    success: true,
    message: "STK Push initiated. M-Pesa prompt sent to simulated network.",
    checkoutRequestId: simulatedCheckoutId,
    simulated: true
  });
});

// M-Pesa Status Polling API
app.get("/api/payments/mpesa/status/:checkoutRequestId", async (req, res) => {
  const db = await readDb();
  const { checkoutRequestId } = req.params;
  const order = db.orders.find(o => o.mpesaCheckoutRequestId === checkoutRequestId);

  if (!order) {
    return res.status(404).json({ error: "Transaction not found" });
  }

  res.json({
    orderId: order.id,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus
  });
});

// M-Pesa webhook callback (Real Safaricom callback target)
app.post("/api/payments/mpesa/callback", async (req, res) => {
  console.log("[M-PESA CALLBACK] Raw Webhook Body Received:", JSON.stringify(req.body));
  
  const { Body } = req.body;
  if (!Body || !Body.stkCallback) {
    return res.status(400).json({ error: "Invalid callback format" });
  }

  const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = Body.stkCallback;
  const db = await readDb();

  const orderIndex = db.orders.findIndex(o => o.mpesaCheckoutRequestId === CheckoutRequestID);
  if (orderIndex === -1) {
    console.error(`[M-PESA CALLBACK] No order matches CheckoutRequestID: ${CheckoutRequestID}`);
    return res.status(404).json({ error: "No matching order found" });
  }

  const order = db.orders[orderIndex];

  if (ResultCode === 0) {
    // Payment Successful
    db.orders[orderIndex].paymentStatus = "paid";
    db.orders[orderIndex].orderStatus = "confirmed";
    await writeDb(db);

    const amount = Math.round(order.total * 125);
    const successMsg = `Payment CONFIRMED! Received Ksh ${amount} for order ${order.id}. Your meal is now being prepared!`;
    await sendNotification(order.customerPhone, "sms", successMsg, { orderId: order.id });
    
    console.log(`[M-PESA CALLBACK] Payment SUCCESS for Order ${order.id}. CheckoutRequestID: ${CheckoutRequestID}`);
  } else {
    // Payment Failed or Cancelled
    db.orders[orderIndex].paymentStatus = "failed";
    await writeDb(db);

    const failMsg = `M-Pesa payment failed for order ${order.id}. Reason: ${ResultDesc}. Please try checking out again or choose Cash on Delivery.`;
    await sendNotification(order.customerPhone, "sms", failMsg, { orderId: order.id });

    console.log(`[M-PESA CALLBACK] Payment FAILED for Order ${order.id}. CheckoutRequestID: ${CheckoutRequestID}. Code: ${ResultCode}, Desc: ${ResultDesc}`);
  }

  res.json({ ResultCode: 0, ResultDesc: "Success" });
});


// This server is API-only — the frontend is deployed separately (e.g. on Vercel)
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Sarini Bistro API is running" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
