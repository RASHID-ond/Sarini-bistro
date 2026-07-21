import React from "react";
import { motion } from "motion/react";
import { API_URL } from "./config";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import MenuSection from "./components/MenuSection";
import ReservationSection from "./components/ReservationSection";
import TrackingSection from "./components/TrackingSection";
import CartDrawer from "./components/CartDrawer";
import CheckoutModal from "./components/CheckoutModal";
import AdminSection from "./components/AdminSection";
import { MenuItem, CartItem, Order, Reservation, NotificationLog, RestaurantSettings, AnalyticsStats } from "./types";
import { Clock, MapPin, Phone, Star } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = React.useState<string>(() => {
    try {
      const hash = window.location.hash.replace("#", "");
      const params = new URLSearchParams(window.location.search);
      if (hash === "admin" || params.get("admin") === "true" || window.location.pathname.endsWith("/admin")) {
        return "admin";
      }
      if (["home", "menu", "reserve", "track"].includes(hash)) {
        return hash;
      }
    } catch (e) {
      console.error(e);
    }
    return "home";
  });

  // Synchronize activeTab with URL hash/query-params for browser-based navigation
  React.useEffect(() => {
    const handleNavigationSync = () => {
      const hash = window.location.hash.replace("#", "");
      const params = new URLSearchParams(window.location.search);
      
      if (hash === "admin" || params.get("admin") === "true" || window.location.pathname.endsWith("/admin")) {
        setActiveTab("admin");
      } else if (["home", "menu", "reserve", "track"].includes(hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener("hashchange", handleNavigationSync);
    window.addEventListener("popstate", handleNavigationSync);
    return () => {
      window.removeEventListener("hashchange", handleNavigationSync);
      window.removeEventListener("popstate", handleNavigationSync);
    };
  }, []);

  // Update window hash on activeTab changes to allow deep-linking & back/forward navigation
  React.useEffect(() => {
    const currentHash = window.location.hash.replace("#", "");
    if (activeTab && activeTab !== currentHash) {
      if (activeTab === "home") {
        window.history.pushState(null, "", window.location.pathname + window.location.search);
      } else {
        window.location.hash = activeTab;
      }
    }
  }, [activeTab]);

  const [activePlateIndex, setActivePlateIndex] = React.useState(0);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  // Set once the admin successfully logs in (from AdminSection). Sent as the
  // "x-admin-password" header on every admin-mutating request so the backend
  // can actually enforce that only an authenticated admin can perform them.
  const [adminToken, setAdminToken] = React.useState("");
  
  // App General Settings
  const [settings, setSettings] = React.useState<RestaurantSettings>({
    restaurantName: "Sarini Bistro",
    phone: "+254 113 342887",
    email: "admin@sarinibistro.com",
    address: "A1 Highway, Kitale, Kenya",
    deliveryFee: 350,
    mpesaEnabled: true,
    mpesaShortcode: "174379",
    mpesaEnabledCheckbox: true, // internal helper
  } as any);

  const experiencePlates = React.useMemo(() => {
    if (settings && settings.websiteImages) {
      const plates = settings.websiteImages.filter((img: any) => img.id.startsWith("plate-"));
      if (plates.length > 0) {
        return plates.map((p: any) => ({ id: p.id, src: p.src }));
      }
    }
    return [];
  }, [settings]);

  const getWebsiteImage = React.useCallback((id: string, defaultSrc: string) => {
    if (settings && settings.websiteImages) {
      const img = settings.websiteImages.find((item: any) => item.id === id);
      if (img && img.src) return img.src;
    }
    return defaultSrc;
  }, [settings]);

  const getWebsiteImageName = React.useCallback((id: string, defaultName: string) => {
    if (settings && settings.websiteImages) {
      const img = settings.websiteImages.find((item: any) => item.id === id);
      if (img && img.name) return img.name;
    }
    return defaultName;
  }, [settings]);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    if (experiencePlates.length === 0) return;
    const timer = setInterval(() => {
      setActivePlateIndex((prev) => (prev + 1) % experiencePlates.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [experiencePlates.length]);
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [categories, setCategories] = React.useState<string[]>([]);

  // Admin and Data Logs (Synced from server)
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [reservations, setReservations] = React.useState<Reservation[]>([]);
  const [notificationLogs, setNotificationLogs] = React.useState<NotificationLog[]>([]);
  const [analytics, setAnalytics] = React.useState<AnalyticsStats | null>(null);

  // Cart & Tracking Local State
  const [cart, setCart] = React.useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("sarini_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeOrder, setActiveOrder] = React.useState<Order | null>(() => {
    try {
      const saved = localStorage.getItem("sarini_active_order");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);

  const [theme, setTheme] = React.useState<string>(() => {
    try {
      const saved = localStorage.getItem("sarini_theme");
      return saved === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  React.useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    localStorage.setItem("sarini_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Auto-persist Cart and Active Order
  React.useEffect(() => {
    localStorage.setItem("sarini_cart", JSON.stringify(cart));
  }, [cart]);

  React.useEffect(() => {
    if (activeOrder) {
      localStorage.setItem("sarini_active_order", JSON.stringify(activeOrder));
    } else {
      localStorage.removeItem("sarini_active_order");
    }
  }, [activeOrder]);

  // Load General data from Server on Mount
  const fetchAllData = React.useCallback(async () => {
    try {
      // 1. Menu Items
      const menuRes = await fetch(`${API_URL}/api/menu`);
      if (menuRes.ok) {
        const menuData = await menuRes.json();
        setMenuItems(menuData.menu_items || []);
        setCategories(menuData.categories || []);
      }

      // 2. Public Settings
      const settingsRes = await fetch(`${API_URL}/api/settings`);
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(prev => ({ ...prev, ...settingsData }));
      }

      // 3. Admin Data (if authenticated/available, we fetch all in background)
      const ordersRes = await fetch(`${API_URL}/api/orders`);
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }

      const resRes = await fetch(`${API_URL}/api/reservations`);
      if (resRes.ok) {
        const resData = await resRes.json();
        setReservations(resData);
      }

      const logsRes = await fetch(`${API_URL}/api/notifications/logs`);
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setNotificationLogs(logsData);
      }

      const analyticsRes = await fetch(`${API_URL}/api/analytics`);
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }
    } catch (err) {
      console.error("Failed to synchronize with server", err);
    } finally {
      setIsInitialLoad(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAllData();
    // Set up polling for admin updates
    const timer = setInterval(fetchAllData, 10000);
    return () => clearInterval(timer);
  }, [fetchAllData]);

  // Handle Cart Operations
  const handleAddToCart = (item: MenuItem) => {
    setCart((prevCart) => {
      const existing = prevCart.find((i) => i.menuItem.id === item.id);
      if (existing) {
        return prevCart.map((i) =>
          i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevCart, { menuItem: item, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (itemId: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((i) => (i.menuItem.id === itemId ? { ...i, quantity: qty } : i))
    );
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((i) => i.menuItem.id !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Checkout API interactions
  const handlePlaceOrder = async (orderData: any): Promise<Order | null> => {
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      if (res.ok) {
        const order: Order = await res.json();
        fetchAllData();
        return order;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  const handleInitiateMpesa = async (orderId: string, phone: string, amount: number) => {
    try {
      const res = await fetch(`${API_URL}/api/payments/mpesa/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, phone, amount }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  const handleSearchOrder = async (id: string): Promise<Order | null> => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${id}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  // Reservation booking
  const handleAddReservation = async (reservationData: any): Promise<Reservation | null> => {
    try {
      const res = await fetch(`${API_URL}/api/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservationData),
      });
      if (res.ok) {
        const r: Reservation = await res.json();
        fetchAllData();
        return r;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  // Admin status mutations
  const handleUpdateOrderStatus = async (orderId: string, status: string, payStatus?: string) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-password": adminToken },
        body: JSON.stringify({ orderStatus: status, paymentStatus: payStatus }),
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateReservationStatus = async (resId: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/api/reservations/${resId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-password": adminToken },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Menu alterations
  const handleAddMenuItem = async (data: any): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/menu/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminToken },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        fetchAllData();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const handleEditMenuItem = async (id: string, data: any): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/menu/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-password": adminToken },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        fetchAllData();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const handleDeleteMenuItem = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/menu/items/${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminToken },
      });
      if (res.ok) {
        fetchAllData();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const handleAddCategory = async (name: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/menu/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminToken },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        fetchAllData();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const handleUpdateSettings = async (data: any): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-password": adminToken },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        fetchAllData();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Cart Quantities map helper
  const cartQuantities = React.useMemo(() => {
    const map: { [itemId: string]: number } = {};
    cart.forEach((i) => {
      map[i.menuItem.id] = i.quantity;
    });
    return map;
  }, [cart]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (isInitialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B0D] text-[#F5F5F7]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-zinc-800 border-t-brand-coral animate-spin" />
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Loading Sarini Bistro…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-[#0B0B0D] bg-noise text-[#F5F5F7] ${theme}`}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        settings={settings}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="flex-grow">
        {activeTab === "home" && (
          <div className="space-y-16 bg-[#0B0B0D] pb-16">
            
            {/* Centered Content Frame representing the Eateria interface */}
            <div className="max-w-[1320px] mx-auto px-4 sm:px-8 py-8 lg:py-12">
              <div className="relative border border-white/5 bg-zinc-950/20 backdrop-blur-md rounded-[32px] p-6 sm:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden">
                
                {/* Background ambient atmospheric lighting inside the container */}
                <div className="absolute -top-40 -left-40 w-96 h-96 glow-pink-radial opacity-20 pointer-events-none" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 glow-peach-radial opacity-20 pointer-events-none" />
                
                {/* Two-Column Grid representing Eateria double-shot mockup */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-16 items-start relative z-10">
                  
                  {/* LEFT COLUMN: Hero & Specialties */}
                  <div className="lg:col-span-6 space-y-16">
                    <Hero
                      onOrderClick={() => setActiveTab("menu")}
                      onReserveClick={() => setActiveTab("reserve")}
                      settings={settings}
                    />
                    
                    {/* Featured Section inside Left Column */}
                    <div className="space-y-8">
                      <div className="text-left space-y-2">
                        <span className="text-brand-coral text-[10px] font-black uppercase tracking-widest font-mono">Curated Selections</span>
                        <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-none">Featured House Specialties</h3>
                        <div className="w-10 h-0.5 bg-brand-coral rounded-full shadow-[0_0_8px_rgba(243,169,181,0.5)]" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {menuItems.slice(3, 5).map((item) => (
                          <div key={item.id} className="bg-zinc-900/40 border border-white/5 rounded-[24px] overflow-hidden shadow-xl hover:border-brand-coral/25 transition-all duration-300 flex flex-col group">
                            <div className="relative aspect-video overflow-hidden bg-zinc-950">
                              <img src={item.image} alt={item.name} className="object-cover w-full h-full group-hover:scale-[1.03] transition-transform duration-500 opacity-90 group-hover:opacity-100" referrerPolicy="no-referrer" />
                              <span className="absolute top-2.5 left-2.5 bg-zinc-950/90 backdrop-blur-md text-brand-coral text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border border-white/5 font-mono">Featured</span>
                            </div>
                            <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                              <div className="space-y-1">
                                <h4 className="font-extrabold text-white text-sm group-hover:text-brand-coral transition-colors">{item.name}</h4>
                                <p className="text-zinc-400 text-[11px] leading-relaxed line-clamp-2">{item.description}</p>
                              </div>
                              <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                                <span className="font-black text-white text-xs">Ksh {item.price.toLocaleString()}</span>
                                <button
                                  onClick={() => {
                                    handleAddToCart(item);
                                    setIsCartOpen(true);
                                  }}
                                  className="px-3 py-1.5 bg-brand-coral hover:bg-brand-coral-hover text-zinc-950 rounded-[12px] text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                                >
                                  Order
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Experiences, Quote & Journey */}
                  <div className="lg:col-span-6 space-y-16">
                    
                    {/* One Kitchen, Two Experiences Section (Eateria Layout) */}
                    <div className="relative border border-white/5 bg-zinc-900/30 backdrop-blur-md rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-hidden">
                      {/* Ambient background glow */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 glow-pink-radial opacity-10 pointer-events-none" />
                      
                      <div className="text-center space-y-2">
                        <span className="text-brand-coral text-[10px] font-black uppercase tracking-widest font-mono">Signature Concept</span>
                        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                          One Kitchen <br />
                          <span className="text-brand-coral">Two Experiences</span>
                        </h3>
                        <p className="text-[#A8A8B3] text-xs max-w-sm mx-auto leading-relaxed">
                          Same kitchen. Same chef. Whether you're on the couch or in our booth.
                        </p>
                      </div>

                      {/* Elegant centered plate layout flanked by clipped side plates with automatic sliding animation */}
                      <div className="relative flex items-center justify-center h-44 sm:h-60 pt-4 overflow-hidden select-none">
                        {experiencePlates.map((plate, index) => {
                          const length = experiencePlates.length;
                          let offset = index - activePlateIndex;
                          if (offset < -Math.floor(length / 2)) offset += length;
                          if (offset > Math.floor(length / 2)) offset -= length;

                          const isCenter = offset === 0;
                          const isLeft = offset === -1;
                          const isRight = offset === 1;
                          const isVisible = isCenter || isLeft || isRight;

                          if (!isVisible) return null;

                          // Dynamic positioning
                          const xOffset = isMobile ? 105 : 160;

                          return (
                            <motion.div
                              key={plate.id}
                              className="absolute shrink-0 flex items-center justify-center"
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{
                                opacity: isCenter ? 1 : 0.15,
                                scale: isCenter ? 1 : 0.72,
                                x: isCenter ? 0 : isLeft ? -xOffset : xOffset,
                                zIndex: isCenter ? 30 : 10,
                              }}
                              transition={{
                                type: "spring",
                                stiffness: 90,
                                damping: 18,
                                mass: 1,
                              }}
                            >
                              {isCenter ? (
                                <div className="relative group p-2.5 rounded-[2.5rem] bg-zinc-950/60 border border-white/5 shadow-[0_15px_40px_rgba(0,0,0,0.8)] dark:bg-zinc-950/60 light:bg-white/80">
                                  <div className="overflow-hidden rounded-[2rem] aspect-[1.4/1] w-[200px] sm:w-[280px]">
                                    <img
                                      src={plate.src}
                                      alt="Two Experiences Main Dish"
                                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-16 h-16 sm:w-28 sm:h-28 rounded-full overflow-hidden border border-white/5 shrink-0 bg-zinc-950/40">
                                  <img
                                    src={plate.src}
                                    alt="Side Dish Plate"
                                    className="w-full h-full object-cover scale-110"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Compelling Minimal Quote Section */}
                    <div className="py-6 text-center relative overflow-hidden">
                      {/* Floating basil leaf decoration exactly like mockup */}
                      {getWebsiteImage("quote-leaf-left", "") && (
                        <div className="absolute top-1/2 left-2 w-14 h-14 sm:w-20 sm:h-20 opacity-60 -translate-y-1/2 rotate-[12deg] pointer-events-none animate-float-slow">
                          <img 
                            src={getWebsiteImage("quote-leaf-left", "")} 
                            alt={getWebsiteImageName("quote-leaf-left", "Basil Leaf")} 
                            className="w-full h-full object-contain select-none"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      {getWebsiteImage("quote-leaf-right", "") && (
                        <div className="absolute top-1/3 right-2 w-14 h-14 sm:w-20 sm:h-20 opacity-65 rotate-[-35deg] pointer-events-none animate-float-reverse">
                          <img 
                            src={getWebsiteImage("quote-leaf-right", "")} 
                            alt={getWebsiteImageName("quote-leaf-right", "Basil Leaf")} 
                            className="w-full h-full object-contain select-none"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      <blockquote className="space-y-4 px-6">
                        <p className="text-base sm:text-lg font-black tracking-tight text-zinc-300 leading-snug font-sans">
                          "We believe <span className="text-white">great food</span> shouldn't compromise on quality, no matter where you enjoy it."
                        </p>
                        <cite className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-extrabold">
                          — Sarini Bistro Commitment
                        </cite>
                      </blockquote>
                    </div>

                    {/* Our Journey Section (Eateria Layout) */}
                    <div className="space-y-8">
                      <div className="text-center space-y-2">
                        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                          {settings.aboutTitle || "Our Journey"}
                        </h3>
                        <p className="text-[#A8A8B3] text-xs">
                          {settings.aboutSubtitle || "From roadside grill to Kitale's favorite culinary destination"}
                        </p>
                        {settings.aboutStory && (
                          <p className="text-[#A8A8B3] text-[11px] leading-relaxed max-w-lg mx-auto pt-2 border-t border-white/5">
                            {settings.aboutStory}
                          </p>
                        )}
                      </div>

                      {/* Timeline Grid exactly matching UI layout and rounded shapes */}
                      <div className="relative pl-6 sm:pl-8 border-l-2 border-brand-coral/30 space-y-6 max-w-lg mx-auto">
                        
                        {/* Timeline Node 1 */}
                        <div className="relative group">
                          <span className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-3.5 h-3.5 rounded-full bg-brand-coral border-[3px] border-[#0B0B0D] shadow-[0_0_10px_rgba(243,169,181,0.6)] group-hover:scale-110 transition-transform" />
                          <div className="bg-zinc-900/40 hover:bg-zinc-900/70 border border-white/5 p-5 rounded-[24px] flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all duration-300">
                            <div className="space-y-1">
                              <h4 className="font-extrabold text-white text-xs sm:text-sm">The Beginning</h4>
                              <p className="text-[#A8A8B3] text-[11px] leading-relaxed max-w-md">
                                Started as a small premium grill, bringing rich, authentic local flavors to long-distance travelers and locals alike.
                              </p>
                            </div>
                            <span className="text-brand-coral font-mono font-black text-[10px] tracking-wider shrink-0 self-start sm:self-auto bg-brand-coral/10 border border-brand-coral/20 px-2.5 py-0.5 rounded-lg">2020</span>
                          </div>
                        </div>

                        {/* Timeline Node 2 */}
                        <div className="relative group">
                          <span className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-3.5 h-3.5 rounded-full bg-brand-coral border-[3px] border-[#0B0B0D] shadow-[0_0_10px_rgba(243,169,181,0.6)] group-hover:scale-110 transition-transform" />
                          <div className="bg-zinc-900/40 hover:bg-zinc-900/70 border border-white/5 p-5 rounded-[24px] flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all duration-300">
                            <div className="space-y-1">
                              <h4 className="font-extrabold text-white text-xs sm:text-sm">The A1 Highway Bistro</h4>
                              <p className="text-[#A8A8B3] text-[11px] leading-relaxed max-w-md">
                                Opened our landmark open-air terrace bistro on the A1 Highway in Kitale, offering a relaxing rest stop and fine dining.
                              </p>
                            </div>
                            <span className="text-brand-coral font-mono font-black text-[10px] tracking-wider shrink-0 self-start sm:self-auto bg-brand-coral/10 border border-brand-coral/20 px-2.5 py-0.5 rounded-lg">2022</span>
                          </div>
                        </div>

                        {/* Timeline Node 3 */}
                        <div className="relative group">
                          <span className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-3.5 h-3.5 rounded-full bg-brand-coral border-[3px] border-[#0B0B0D] shadow-[0_0_10px_rgba(243,169,181,0.6)] group-hover:scale-110 transition-transform" />
                          <div className="bg-zinc-900/40 hover:bg-zinc-900/70 border border-white/5 p-5 rounded-[24px] flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all duration-300">
                            <div className="space-y-1">
                              <h4 className="font-extrabold text-white text-xs sm:text-sm">Going Hybrid & M-Pesa</h4>
                              <p className="text-[#A8A8B3] text-[11px] leading-relaxed max-w-md">
                                Launched digital checkout, instant order tracking, and integrated secure Daraja pay paths to fulfill rapid deliveries.
                              </p>
                            </div>
                            <span className="text-brand-coral font-mono font-black text-[10px] tracking-wider shrink-0 self-start sm:self-auto bg-brand-coral/10 border border-brand-coral/20 px-2.5 py-0.5 rounded-lg">2024</span>
                          </div>
                        </div>

                        {/* Timeline Node 4 */}
                        <div className="relative group">
                          <span className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-3.5 h-3.5 rounded-full bg-brand-coral border-[3px] border-[#0B0B0D] shadow-[0_0_10px_rgba(243,169,181,0.6)] group-hover:scale-110 transition-transform" />
                          <div className="bg-zinc-900/40 hover:bg-zinc-900/70 border border-white/5 p-5 rounded-[24px] flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all duration-300">
                            <div className="space-y-1">
                              <h4 className="font-extrabold text-white text-xs sm:text-sm">Kitale's Culinary Jewel</h4>
                              <p className="text-[#A8A8B3] text-[11px] leading-relaxed max-w-md">
                                Now serving travelers and locals, recognized for our premium Mbuzi Choma, traditional sides, and warm hospitable atmosphere.
                              </p>
                            </div>
                            <span className="text-brand-coral font-mono font-black text-[10px] tracking-wider shrink-0 self-start sm:self-auto bg-brand-coral/10 border border-brand-coral/20 px-2.5 py-0.5 rounded-lg">2026</span>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>

                </div>

              </div>
            </div>

            {/* Interactive promo map review banner */}
            <section className="bg-zinc-950/20 py-20 text-white overflow-hidden relative border-t border-b border-zinc-900/40">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-zinc-950/80 to-zinc-950 opacity-90" />
              <div className="relative max-w-[1320px] mx-auto px-6 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
                  <span className="text-brand-coral text-xs font-bold uppercase tracking-widest font-mono">Operating 6:30 AM - 8:30 PM</span>
                  <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Visit Us in Kitale</h3>
                  <p className="text-[#A8A8B3] text-xs sm:text-sm leading-relaxed max-w-md mx-auto lg:mx-0">
                    Located along the scenic A1 Highway in Kitale, Sarini Bistro features a comfortable open-air garden terrace, warm indoor salons, and secure traveler parking. Join us for premium local dishes and refreshing drinks.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 text-xs font-bold text-zinc-300">
                    <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-brand-coral" /> A1 Highway, Kitale</span>
                    <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand-coral" /> +254 113 342887</span>
                  </div>
                </div>
                <div className="lg:col-span-6 relative flex justify-center">
                  <div className="bg-zinc-900/60 backdrop-blur-md border border-white/5 p-6 rounded-[24px] w-full max-w-md shadow-2xl relative">
                    <div className="absolute top-4 right-4 text-brand-coral flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-3.5 h-3.5 fill-current" />)}
                    </div>
                    <p className="font-extrabold text-white text-sm">"The Mbuzi Choma is unmatched!"</p>
                    <p className="text-[#A8A8B3] text-xs mt-2 italic leading-relaxed">
                      "I ordered the signature sizzling goat meat for delivery to my hotel in Kitale town. It arrived hot, packaged in premium eco-friendly boxes! The M-Pesa STK push prompt and tracking updates made checkout completely seamless."
                    </p>
                    <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/5">
                      <div className="w-8 h-8 rounded-full bg-brand-coral flex items-center justify-center text-zinc-950 font-black text-xs select-none">RM</div>
                      <div>
                        <span className="block text-xs font-extrabold text-white">Rashid M.</span>
                        <span className="block text-[10px] text-zinc-500">Google Verified Buyer</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "menu" && (
          <MenuSection
            menuItems={menuItems}
            categories={categories}
            onAddToCart={handleAddToCart}
            cartQuantities={cartQuantities}
          />
        )}

        {activeTab === "reserve" && (
          <ReservationSection
            onAddReservation={handleAddReservation}
            restaurantPhone={settings.phone}
          />
        )}

        {activeTab === "track" && (
          <TrackingSection
            activeOrder={activeOrder}
            onSearchOrder={handleSearchOrder}
            restaurantPhone={settings.phone}
          />
        )}

        {activeTab === "admin" && (
          <AdminSection
            orders={orders}
            reservations={reservations}
            menuItems={menuItems}
            categories={categories}
            notificationLogs={notificationLogs}
            settings={settings}
            analytics={analytics}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onUpdateReservationStatus={handleUpdateReservationStatus}
            onAddMenuItem={handleAddMenuItem}
            onEditMenuItem={handleEditMenuItem}
            onDeleteMenuItem={handleDeleteMenuItem}
            onAddCategory={handleAddCategory}
            onUpdateSettings={handleUpdateSettings}
            onRefreshData={fetchAllData}
            onAdminAuthenticated={setAdminToken}
          />
        )}
      </main>

      <Footer
        restaurantName={settings.restaurantName}
        phone={settings.phone}
        email={settings.email}
        address={settings.address}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        deliveryFee={settings.deliveryFee}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart}
        deliveryFee={settings.deliveryFee}
        onPlaceOrder={handlePlaceOrder}
        onInitiateMpesa={handleInitiateMpesa}
        onClearCart={handleClearCart}
        onSetActiveOrder={setActiveOrder}
        onSetTab={setActiveTab}
      />
    </div>
  );
}
