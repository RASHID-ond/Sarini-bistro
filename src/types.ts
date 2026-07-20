export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  vegetarian?: boolean;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
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

export interface Reservation {
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

export interface NotificationLog {
  id: string;
  orderId?: string;
  reservationId?: string;
  recipient: string;
  type: "email" | "sms";
  channel: string;
  message: string;
  status: "success" | "failed";
  timestamp: string;
}

export interface RestaurantSettings {
  restaurantName: string;
  phone: string;
  email: string;
  address: string;
  deliveryFee: number;
  mpesaEnabled: boolean;
  mpesaConsumerKey?: string;
  mpesaConsumerSecret?: string;
  mpesaShortcode: string;
  mpesaPasskey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  atApiKey?: string;
  atUsername?: string;
  // Dynamic website content
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
  websiteImages?: WebsiteImage[];
}

export interface WebsiteImage {
  id: string;
  name: string;
  src: string;
}

export interface AnalyticsStats {
  totalOrders: number;
  revenue: number;
  averageOrderValue: number;
  pendingOrdersCount: number;
  activeReservationsCount: number;
  dailyStats: {
    date: string;
    orders: number;
    sales: number;
  }[];
  popularItems: {
    id: string;
    name: string;
    quantity: number;
    sales: number;
  }[];
}
