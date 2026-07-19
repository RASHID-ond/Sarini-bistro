import React from "react";
import { 
  ClipboardList, Calendar, Plus, Edit3, Trash2, TrendingUp, Settings, Bell, RefreshCw, CheckCircle2, XCircle, Clock, Truck, Play, CreditCard, DollarSign, Users, Sparkles, LogIn, Upload, Loader2
} from "lucide-react";
import { Order, Reservation, MenuItem, NotificationLog, RestaurantSettings, AnalyticsStats } from "../types";

interface AdminSectionProps {
  orders: Order[];
  reservations: Reservation[];
  menuItems: MenuItem[];
  categories: string[];
  notificationLogs: NotificationLog[];
  settings: RestaurantSettings;
  analytics: AnalyticsStats | null;
  onUpdateOrderStatus: (orderId: string, status: string, payStatus?: string) => void;
  onUpdateReservationStatus: (resId: string, status: string) => void;
  onAddMenuItem: (data: any) => Promise<boolean>;
  onEditMenuItem: (id: string, data: any) => Promise<boolean>;
  onDeleteMenuItem: (id: string) => Promise<boolean>;
  onAddCategory: (name: string) => Promise<boolean>;
  onUpdateSettings: (data: any) => Promise<boolean>;
  onRefreshData: () => void;
}

export default function AdminSection({
  orders,
  reservations,
  menuItems,
  categories,
  notificationLogs,
  settings,
  analytics,
  onUpdateOrderStatus,
  onUpdateReservationStatus,
  onAddMenuItem,
  onEditMenuItem,
  onDeleteMenuItem,
  onAddCategory,
  onUpdateSettings,
  onRefreshData,
}: AdminSectionProps) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = React.useState(false);
  const [adminPassword, setAdminPassword] = React.useState("");
  const [authError, setAuthError] = React.useState("");

  const [activeSubTab, setActiveSubTab] = React.useState<"orders" | "reservations" | "menu" | "analytics" | "notifications" | "settings" | "content">("orders");
  const [orderFilter, setOrderFilter] = React.useState<"all" | "pending" | "preparing" | "ready" | "completed">("all");

  // Menu Form States
  const [editingItem, setEditingItem] = React.useState<MenuItem | null>(null);
  const [showMenuForm, setShowMenuForm] = React.useState(false);
  const [menuFormData, setMenuFormData] = React.useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
    available: true,
  });

  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [showCategoryForm, setShowCategoryForm] = React.useState(false);

  // Settings Credentials States (Local for form editing)
  const [settingsForm, setSettingsForm] = React.useState<any>({ ...settings });
  const [uploadingId, setUploadingId] = React.useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, targetKey: string, websiteImageIndex?: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Set uploading state identifier
    const uploadId = websiteImageIndex !== undefined ? `website-${websiteImageIndex}` : targetKey;
    setUploadingId(uploadId);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        
        const response = await fetch("/api/admin/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: file.name,
            base64Data: base64Data,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to upload image");
        }

        const result = await response.json();
        if (result.success && result.url) {
          if (websiteImageIndex !== undefined) {
            const updated = [...(settingsForm.websiteImages || [])];
            updated[websiteImageIndex] = { ...updated[websiteImageIndex], src: result.url };
            setSettingsForm({ ...settingsForm, websiteImages: updated });
          } else if (targetKey.startsWith("gallery-")) {
            const idx = parseInt(targetKey.split("-")[1]);
            const updatedGallery = [...(settingsForm.galleryImages || [])];
            updatedGallery[idx] = result.url;
            setSettingsForm({ ...settingsForm, galleryImages: updatedGallery });
          } else if (targetKey === "menu-item") {
            setMenuFormData(prev => ({ ...prev, image: result.url }));
          } else {
            setSettingsForm(prev => ({ ...prev, [targetKey]: result.url }));
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingId(null);
    }
  };

  // Update local settings form state when prop settings changes
  React.useEffect(() => {
    if (settings) {
      setSettingsForm({ ...settings });
    }
  }, [settings]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === "sarini2026") {
      setIsAdminAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect system password. Access denied.");
    }
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setMenuFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      image: item.image,
      available: item.available,
    });
    setShowMenuForm(true);
  };

  const handleSaveMenuForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuFormData.name || !menuFormData.price || !menuFormData.category) return;

    const priceNum = parseFloat(menuFormData.price);
    if (isNaN(priceNum)) return;

    let success = false;
    if (editingItem) {
      success = await onEditMenuItem(editingItem.id, {
        ...menuFormData,
        price: priceNum,
      });
    } else {
      success = await onAddMenuItem({
        ...menuFormData,
        price: priceNum,
      });
    }

    if (success) {
      setShowMenuForm(false);
      setEditingItem(null);
      setMenuFormData({
        name: "",
        description: "",
        price: "",
        category: categories[0] || "",
        image: "",
        available: true,
      });
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const success = await onAddCategory(newCategoryName.trim());
    if (success) {
      setNewCategoryName("");
      setShowCategoryForm(false);
    }
  };

  const handleAddGalleryImage = () => {
    const currentImages = settingsForm.galleryImages || [];
    setSettingsForm({
      ...settingsForm,
      galleryImages: [...currentImages, ""]
    });
  };

  const handleEditGalleryImage = (idx: number, val: string) => {
    const currentImages = [...(settingsForm.galleryImages || [])];
    currentImages[idx] = val;
    setSettingsForm({
      ...settingsForm,
      galleryImages: currentImages
    });
  };

  const handleRemoveGalleryImage = (idx: number) => {
    const currentImages = (settingsForm.galleryImages || []).filter((_: any, i: number) => i !== idx);
    setSettingsForm({
      ...settingsForm,
      galleryImages: currentImages
    });
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onUpdateSettings(settingsForm);
    if (success) {
      alert("Website content configurations saved successfully!");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onUpdateSettings(settingsForm);
    if (success) {
      alert("Settings credentials updated successfully!");
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "all") return true;
    return o.orderStatus === orderFilter;
  });

  if (!isAdminAuthenticated) {
    return (
      <section className="py-20 bg-zinc-950 flex items-center justify-center min-h-[500px]" id="admin-auth-panel">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-850 p-8 rounded-3xl shadow-2xl space-y-6 text-center">
          <div className="bg-brand-coral text-zinc-950 w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-brand-coral/20">
            <LogIn className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-white tracking-tight font-sans">Admin System Access</h2>
            <p className="text-zinc-400 text-xs leading-normal">
              Sarini Bistro Internal Management Portal. Please provide your secure authorization key to proceed.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">System Password</label>
              <input
                type="password"
                required
                placeholder="Enter password (demo: sarini2026)"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 py-3 px-4 rounded-xl text-sm text-white text-center tracking-widest focus:outline-none focus:border-brand-coral focus:ring-1 focus:ring-brand-coral/25 animate-none"
              />
            </div>

            {authError && (
              <p className="text-red-500 text-xs font-semibold">{authError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-brand-coral hover:bg-brand-coral-hover text-zinc-950 font-bold rounded-xl text-sm transition-all hover:scale-102 active:scale-95 shadow-lg shadow-brand-coral/20 cursor-pointer"
            >
              Authorize Login
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-zinc-950 min-h-screen" id="admin-main-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Admin Header Banner */}
        <div className="bg-zinc-900 text-white rounded-3xl p-6 sm:px-8 shadow-xl border border-zinc-850 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-coral/10 border border-brand-coral/20 text-brand-coral text-[10px] font-mono tracking-widest uppercase font-bold">
              <Sparkles className="w-3 h-3" /> Live Administrator Portal
            </div>
            <h2 className="text-2xl font-bold tracking-tight font-sans">
              {settings.restaurantName} Control Center
            </h2>
            <p className="text-zinc-400 text-xs font-medium">
              Real-time synchronization active. Refresh interval: 5 seconds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRefreshData}
              className="p-3 bg-zinc-950 hover:bg-zinc-850 text-white border border-zinc-850 rounded-xl transition-all flex items-center gap-2 text-xs font-semibold shadow-inner cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-brand-coral" />
              Update website contents
            </button>
            <button
              onClick={() => setIsAdminAuthenticated(false)}
              className="px-4.5 py-2.5 bg-red-650/15 border border-red-500/20 text-red-400 hover:bg-red-650/25 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Dashboard SubTabs menu */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-850 p-1.5 rounded-2xl shadow-lg overflow-x-auto">
          {[
            { id: "orders", label: "Active Orders", icon: ClipboardList },
            { id: "reservations", label: "Table Bookings", icon: Calendar },
            { id: "menu", label: "Menu Editor", icon: Edit3 },
            { id: "content", label: "Website Content", icon: Sparkles },
            { id: "analytics", label: "Sales Analytics", icon: TrendingUp },
            { id: "notifications", label: "Notif Logs", icon: Bell },
            { id: "settings", label: "Credentials Settings", icon: Settings },
          ].map((sub) => {
            const Icon = sub.icon;
            const isActive = activeSubTab === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setActiveSubTab(sub.id as any)}
                className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-brand-coral text-zinc-950 shadow-lg shadow-brand-coral/20"
                    : "text-zinc-400 hover:bg-zinc-850 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {sub.label}
              </button>
            );
          })}
        </div>

        {/* Content sub-panels */}

        {/* 1. ORDERS LIST VIEW */}
        {activeSubTab === "orders" && (
          <div className="space-y-6">
            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900 border border-zinc-850 p-4 rounded-xl shadow-lg">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {["all", "pending", "ready", "completed"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderFilter(st as any)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                      orderFilter === st
                        ? "bg-brand-coral text-zinc-950 font-extrabold"
                        : "bg-zinc-950 text-zinc-400 hover:bg-zinc-850 border border-zinc-850"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <span className="text-zinc-400 text-xs font-semibold shrink-0">
                Displaying {filteredOrders.length} orders
              </span>
            </div>

            {/* Orders Grid */}
            {filteredOrders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredOrders.map((o) => (
                  <div
                    key={o.id}
                    className="bg-zinc-900 border border-zinc-850 rounded-2xl shadow-lg overflow-hidden flex flex-col justify-between animate-none"
                  >
                    {/* Card Head */}
                    <div className="bg-zinc-900/60 p-4 border-b border-zinc-850 flex items-center justify-between flex-wrap gap-2">
                      <div className="space-y-0.5">
                        <span className="block text-[10px] font-bold text-zinc-500 font-mono">Order Ref</span>
                        <span className="text-base font-bold font-mono text-white">#{o.id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                          o.orderStatus === "pending"
                            ? "bg-brand-coral/10 text-brand-coral border-brand-coral/20"
                            : o.orderStatus === "confirmed"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : o.orderStatus === "preparing"
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                : o.orderStatus === "ready"
                                  ? "bg-teal-500/10 text-teal-400 border-teal-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}>
                          {o.orderStatus}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                          o.paymentStatus === "paid"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold"
                            : o.paymentStatus === "failed"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-brand-coral/10 text-brand-coral border-brand-coral/20"
                        }`}>
                          {o.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-4 flex-1">
                      {/* Customer Summary */}
                      <div className="text-xs text-zinc-400 space-y-1.5">
                        <p><strong className="text-zinc-300">Customer:</strong> {o.customerName} ({o.customerPhone})</p>
                        <p><strong className="text-zinc-300">Type:</strong> <span className="uppercase font-mono font-bold text-white text-[11px]">{o.orderType}</span></p>
                        {o.deliveryAddress && (
                          <p><strong className="text-zinc-300">Address:</strong> {o.deliveryAddress}</p>
                        )}
                        <p className="font-mono text-[10px] text-zinc-500">Placed: {new Date(o.createdAt).toLocaleString()}</p>
                      </div>

                      {/* Items */}
                      <div className="bg-zinc-950/80 rounded-xl p-3 text-xs border border-zinc-850">
                        <p className="font-bold text-zinc-500 mb-1">Dishes</p>
                        <ul className="divide-y divide-zinc-850">
                          {o.items.map((it, i) => (
                             <li key={i} className="py-1.5 flex justify-between">
                               <span className="text-zinc-300">{it.quantity}x {it.name}</span>
                               <span className="font-semibold text-white">Ksh {(it.price * it.quantity).toLocaleString()}</span>
                             </li>
                          ))}
                        </ul>
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-zinc-850 text-sm font-bold text-white">
                          <span>Total Collected:</span>
                          <span className="text-brand-coral font-mono">Ksh {o.total.toLocaleString()}</span>
                        </div>
                      </div>

                      {o.paymentMethod === "mpesa" && o.paymentPhone && (
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 p-2 rounded-lg border border-emerald-900/40">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>M-Pesa STK target: <strong className="font-mono text-emerald-300">{o.paymentPhone}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="p-4 border-t border-zinc-850 bg-zinc-950/40 flex flex-wrap gap-2">
                      {o.orderStatus === "pending" && (
                        <button
                          onClick={() => onUpdateOrderStatus(o.id, "confirmed", o.paymentMethod === "cash" ? "pending" : undefined)}
                          className="flex-1 py-2 px-3 bg-brand-coral hover:bg-brand-coral-hover text-zinc-950 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Confirm & Kitchen Start
                        </button>
                      )}
                      {o.orderStatus === "confirmed" && (
                        <button
                          onClick={() => onUpdateOrderStatus(o.id, "preparing")}
                          className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Mark: Cooking
                        </button>
                      )}
                      {o.orderStatus === "preparing" && (
                        <button
                          onClick={() => onUpdateOrderStatus(o.id, "ready")}
                          className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Mark: Out for Delivery/Ready
                        </button>
                      )}
                      {o.orderStatus === "ready" && (
                        <button
                          onClick={() => onUpdateOrderStatus(o.id, "completed", "paid")}
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Complete Order
                        </button>
                      )}

                      {o.paymentStatus === "pending" && (
                        <button
                          onClick={() => onUpdateOrderStatus(o.id, o.orderStatus, "paid")}
                          className="py-2 px-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Mark: PAID
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-850 rounded-2xl py-16 text-center space-y-4 shadow-lg">
                <ClipboardList className="w-12 h-12 text-zinc-600 mx-auto animate-pulse" />
                <p className="font-bold text-white">No Orders in this Status</p>
                <p className="text-zinc-500 text-xs">All caught up! Excellent work.</p>
              </div>
            )}
          </div>
        )}

        {/* 2. RESERVATIONS LIST VIEW */}
        {activeSubTab === "reservations" && (
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl shadow-lg overflow-hidden text-white animate-none">
            <div className="p-5 border-b border-zinc-850 flex justify-between items-center flex-wrap gap-4">
              <h3 className="font-bold text-white text-base">Advanced Table Bookings</h3>
              <span className="text-zinc-400 text-xs font-semibold">Total Reserv: {reservations.length}</span>
            </div>

            {reservations.length > 0 ? (
              <div className="overflow-x-auto text-white">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-mono border-b border-zinc-850">
                      <th className="p-4">Guest Name</th>
                      <th className="p-4">Contact Phone</th>
                      <th className="p-4">Guests</th>
                      <th className="p-4">Date & Time</th>
                      <th className="p-4">Area</th>
                      <th className="p-4">Special Requests</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {reservations.map((res) => (
                      <tr key={res.id} className="hover:bg-zinc-950/40 transition-colors">
                        <td className="p-4 font-bold text-white">
                          {res.customerName}
                          <span className="block text-[10px] font-mono text-zinc-500 font-semibold uppercase mt-0.5">#{res.id}</span>
                        </td>
                        <td className="p-4 text-zinc-300 font-mono text-xs">{res.customerPhone}</td>
                        <td className="p-4 font-bold text-white">{res.guests} pax</td>
                        <td className="p-4">
                          <span className="block text-zinc-200 font-medium">{res.date}</span>
                          <span className="block text-zinc-500 text-xs font-bold font-mono">{res.time}</span>
                        </td>
                        <td className="p-4">
                          <span className="bg-zinc-950 text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                            {res.seatingArea}
                          </span>
                        </td>
                        <td className="p-4 text-zinc-400 text-xs max-w-xs truncate" title={res.specialRequests}>
                          {res.specialRequests || "None"}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {res.status === "confirmed" ? (
                              <>
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase">Confirmed</span>
                                <button
                                  onClick={() => onUpdateReservationStatus(res.id, "cancelled")}
                                  className="p-1 text-zinc-500 hover:text-red-500 hover:bg-zinc-850 rounded transition-colors cursor-pointer"
                                  title="Cancel Reservation"
                                >
                                  <XCircle className="w-4.5 h-4.5" />
                                </button>
                              </>
                            ) : (
                              <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase">Cancelled</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center text-zinc-400">
                <Calendar className="w-12 h-12 text-zinc-600 mx-auto animate-pulse" />
                <p className="font-bold text-white mt-2">No Reservations Registered</p>
                <p className="text-zinc-500 text-xs">When customers book tables, they appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* 3. MENU CATALOG MANAGER */}
        {activeSubTab === "menu" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4 bg-zinc-900 border border-zinc-850 p-4 rounded-xl shadow-lg">
              <div>
                <h3 className="font-bold text-white text-base">Food Menu Catalog ({menuItems.length} items)</h3>
                <p className="text-zinc-400 text-xs">Add new dishes, manage pricing, and toggle immediate availability.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCategoryForm(!showCategoryForm)}
                  className="px-4 py-2.5 bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-850 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Create Category
                </button>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setMenuFormData({
                      name: "",
                      description: "",
                      price: "",
                      category: categories[0] || "",
                      image: "",
                      available: true,
                    });
                    setShowMenuForm(!showMenuForm);
                  }}
                  className="px-4.5 py-2.5 bg-brand-coral hover:bg-brand-coral-hover text-zinc-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-brand-coral/15 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Dish
                </button>
              </div>
            </div>

            {/* Forms section */}
            {showCategoryForm && (
              <form onSubmit={handleCreateCategory} className="bg-zinc-900 border border-zinc-850 p-5 rounded-xl space-y-3 max-w-sm animate-none">
                <h4 className="font-bold text-sm text-white">Add New Category</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Soups"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-850 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-brand-coral"
                  />
                  <button type="submit" className="bg-brand-coral text-zinc-950 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-brand-coral-hover transition-colors cursor-pointer">Add</button>
                </div>
              </form>
            )}

            {showMenuForm && (
              <form onSubmit={handleSaveMenuForm} className="bg-zinc-900 border border-zinc-850 p-6 rounded-2xl shadow-lg space-y-4 max-w-2xl animate-none">
                <h4 className="font-bold text-white border-b border-zinc-850 pb-2 flex items-center gap-2">
                  <Edit3 className="w-4.5 h-4.5 text-brand-coral" />
                  {editingItem ? "Edit Menu Item" : "Create Menu Item"}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider">Dish Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Tuscan Garlic Mash"
                      value={menuFormData.name}
                      onChange={(e) => setMenuFormData({ ...menuFormData, name: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-coral"
                    />
                  </div>

                  {/* Price */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider">Price (Ksh Shillings) *</label>
                    <input
                      type="number"
                      step="1"
                      required
                      placeholder="1500"
                      value={menuFormData.price}
                      onChange={(e) => setMenuFormData({ ...menuFormData, price: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-coral"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider">Category *</label>
                    <select
                      value={menuFormData.category}
                      onChange={(e) => setMenuFormData({ ...menuFormData, category: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-coral"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Image URL */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider flex items-center justify-between">
                      <span>Image Link URL</span>
                      <span className="text-[9px] text-zinc-500 font-normal normal-case">or upload file</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/photo..."
                        value={menuFormData.image}
                        onChange={(e) => setMenuFormData({ ...menuFormData, image: e.target.value })}
                        className="flex-1 bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-coral"
                      />
                      <label className="flex items-center gap-1.5 px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold rounded-lg cursor-pointer transition-all active:scale-95 whitespace-nowrap">
                        {uploadingId === "menu-item" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{uploadingId === "menu-item" ? "..." : "Upload"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, "menu-item")}
                          className="hidden"
                          disabled={uploadingId !== null}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Short summary of ingredients, preparation, allergen warnings..."
                    value={menuFormData.description}
                    onChange={(e) => setMenuFormData({ ...menuFormData, description: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none resize-none focus:border-brand-coral"
                  />
                </div>

                {/* Availability Toggle */}
                <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-lg border border-zinc-850">
                  <input
                    type="checkbox"
                    id="available-item-checkbox"
                    checked={menuFormData.available}
                    onChange={(e) => setMenuFormData({ ...menuFormData, available: e.target.checked })}
                    className="w-4.5 h-4.5 accent-brand-coral rounded border-zinc-800 bg-zinc-900"
                  />
                  <label htmlFor="available-item-checkbox" className="text-xs text-zinc-300 font-bold cursor-pointer">
                    Mark as Available / In Stock
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-brand-coral text-zinc-950 rounded-xl text-xs font-bold hover:bg-brand-coral-hover transition-all cursor-pointer"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenuForm(false);
                      setEditingItem(null);
                    }}
                    className="px-5 py-2 bg-zinc-950 border border-zinc-800 text-zinc-400 rounded-xl text-xs font-semibold hover:text-white hover:bg-zinc-850 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Items Grid for Catalog */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <div key={item.id} className="bg-zinc-900 border border-zinc-850 rounded-xl p-4 flex gap-4 items-center relative shadow-lg animate-none">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg border border-zinc-850 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="text-[10px] bg-zinc-950 text-zinc-400 border border-zinc-800 font-bold uppercase px-1.5 py-0.5 rounded">
                      {item.category}
                    </span>
                    <h4 className="font-bold text-white text-sm truncate">{item.name}</h4>
                    <p className="font-mono text-brand-coral font-bold text-xs">Ksh {item.price.toLocaleString()}</p>
                    <span className={`inline-block text-[10px] font-bold uppercase rounded px-1.5 py-0.25 border ${
                      item.available 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      {item.available ? "Available" : "Sold Out"}
                    </span>
                  </div>

                  <div className="absolute right-3.5 top-3.5 flex gap-1 bg-zinc-950 border border-zinc-800 rounded p-1 shadow-sm">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1 text-zinc-400 hover:text-brand-coral hover:bg-zinc-900 rounded transition-all cursor-pointer"
                      title="Edit Item"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                          await onDeleteMenuItem(item.id);
                        }
                      }}
                      className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-900 rounded transition-all cursor-pointer"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. SALES ANALYTICS VIEW (WITH LUXURIOUS CUSTOM ANIMATED SVG CHARTS) */}
        {activeSubTab === "analytics" && (
          <div className="space-y-8 animate-none">
            {/* Key Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Total Revenue */}
              <div className="bg-zinc-900 text-white p-5 rounded-2xl border border-zinc-850 shadow-lg flex items-center justify-between">
                <div className="space-y-1">
                  <span className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Gross revenue</span>
                  <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-coral to-brand-coral-hover">
                    Ksh {(analytics?.revenue || 0).toLocaleString()}
                  </span>
                  <span className="block text-[10px] text-zinc-500 font-mono font-bold">Natively in Shillings</span>
                </div>
                <div className="bg-brand-coral/10 p-3 rounded-xl border border-brand-coral/20 text-brand-coral">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              {/* Total Orders */}
              <div className="bg-zinc-900 text-white p-5 rounded-2xl border border-zinc-850 shadow-lg flex items-center justify-between">
                <div className="space-y-1">
                  <span className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Total orders placed</span>
                  <span className="text-3xl font-extrabold text-white">
                    {analytics?.totalOrders || 0}
                  </span>
                  <span className="block text-[10px] text-zinc-400">Orders lifetime register</span>
                </div>
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 text-white">
                  <ClipboardList className="w-6 h-6" />
                </div>
              </div>

              {/* Average Order Value */}
              <div className="bg-zinc-900 text-white p-5 rounded-2xl border border-zinc-850 shadow-lg flex items-center justify-between">
                <div className="space-y-1">
                  <span className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Average Basket Size</span>
                  <span className="text-3xl font-extrabold text-white">
                    Ksh {(analytics?.averageOrderValue || 0).toLocaleString()}
                  </span>
                  <span className="block text-[10px] text-zinc-400">Average ticket size</span>
                </div>
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 text-white">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              {/* Pending Orders Counter */}
              <div className="bg-zinc-900 text-white p-5 rounded-2xl border border-zinc-850 shadow-lg flex items-center justify-between">
                <div className="space-y-1">
                  <span className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Live pending orders</span>
                  <span className="text-3xl font-extrabold text-brand-coral">
                    {analytics?.pendingOrdersCount || 0}
                  </span>
                  <span className="block text-[10px] text-zinc-400">Awaiting kitchen action</span>
                </div>
                <div className="bg-brand-coral/10 p-3 rounded-xl border border-brand-coral/20 text-brand-coral">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

            </div>

            {/* Custom SVG Charts Block */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Daily Sales Bar Chart */}
              <div className="lg:col-span-8 bg-zinc-900 border border-zinc-850 rounded-2xl p-6 shadow-lg space-y-6">
                <div>
                  <h4 className="font-bold text-white text-sm">7-Day Sales Volume Trends</h4>
                  <p className="text-zinc-400 text-xs">Real-time daily calculated gross receipts.</p>
                </div>

                {/* SVG Visualizer */}
                <div className="relative w-full h-64 bg-zinc-950 rounded-xl p-4 flex items-end justify-between border border-zinc-850">
                  {analytics && analytics.dailyStats.length > 0 ? (
                    (() => {
                      const maxSales = Math.max(...analytics.dailyStats.map(d => d.sales), 50);
                      return analytics.dailyStats.map((stat, i) => {
                        const pct = (stat.sales / maxSales) * 100;
                        return (
                          <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group cursor-pointer px-1">
                            {/* Hover tooltip */}
                            <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-zinc-950 text-white text-[10px] px-2 py-1 rounded shadow-lg transition-opacity duration-200 pointer-events-none whitespace-nowrap z-30 border border-zinc-850">
                              Sales: Ksh {stat.sales.toLocaleString()} ({stat.orders} orders)
                            </div>
                            
                            {/* Bar segment */}
                            <div 
                              className="w-full bg-gradient-to-t from-brand-coral-hover to-brand-coral rounded-t-md hover:from-brand-coral hover:to-brand-coral-hover transition-all duration-500"
                              style={{ height: `${Math.max(4, pct)}%` }}
                            />

                            {/* Label */}
                            <span className="block text-[9px] text-zinc-500 mt-2 font-mono font-semibold uppercase truncate max-w-full">
                              {stat.date.substring(5)}
                            </span>
                          </div>
                        );
                      });
                    })()
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-xs">No enough daily sales data.</div>
                  )}
                </div>
              </div>

              {/* Popular Items horizontal Bar Chart */}
              <div className="lg:col-span-4 bg-zinc-900 border border-zinc-850 rounded-2xl p-6 shadow-lg space-y-6">
                <div>
                  <h4 className="font-bold text-white text-sm">Top 5 Popular Dishes</h4>
                  <p className="text-zinc-400 text-xs">Based on raw unit sales volume counts.</p>
                </div>

                <div className="space-y-4">
                  {analytics && analytics.popularItems.length > 0 ? (
                    (() => {
                      const maxQty = Math.max(...analytics.popularItems.map(p => p.quantity), 1);
                      return analytics.popularItems.map((item, idx) => {
                        const pct = (item.quantity / maxQty) * 100;
                        return (
                          <div key={idx} className="space-y-1.5 text-xs text-zinc-400">
                            <div className="flex justify-between items-center text-[11px] font-semibold text-zinc-200">
                              <span className="truncate max-w-[150px]" title={item.name}>{idx + 1}. {item.name}</span>
                              <span className="font-mono text-zinc-400 shrink-0 font-bold">{item.quantity} orders</span>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
                              <div 
                                className="bg-gradient-to-r from-brand-coral to-brand-coral-hover h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()
                  ) : (
                    <p className="text-zinc-500 text-xs text-center py-10">No popular items computed yet.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 5. NOTIFICATION LOGS VIEW */}
        {activeSubTab === "notifications" && (
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl shadow-lg overflow-hidden text-white animate-none">
            <div className="p-5 border-b border-zinc-850 flex justify-between items-center flex-wrap gap-4 bg-zinc-900/60">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-500" />
                  SMS & Email Transmission Logs
                </h3>
                <p className="text-zinc-400 text-xs mt-0.5">Audit log of system alerts sent to customers and operators.</p>
              </div>
              <span className="text-zinc-500 text-xs font-semibold">Logged events: {notificationLogs.length}</span>
            </div>

            {notificationLogs.length > 0 ? (
              <div className="overflow-x-auto text-white">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-zinc-950 text-zinc-400 uppercase text-[9px] tracking-wider font-mono border-b border-zinc-850">
                      <th className="p-4">Recipient</th>
                      <th className="p-4">Alert Type</th>
                      <th className="p-4">Gateway</th>
                      <th className="p-4">Message Text Content</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {notificationLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-950/40 text-xs text-zinc-300">
                        <td className="p-4 font-semibold text-white font-mono">{log.recipient}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            log.type === "email" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          }`}>
                            {log.type}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-zinc-300">{log.channel}</td>
                        <td className="p-4 text-zinc-400 max-w-sm whitespace-normal leading-relaxed font-mono text-[11px]" title={log.message}>
                          {log.message}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                            log.status === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-4 text-zinc-500 font-mono font-medium text-[10px]">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-20 text-center text-zinc-500 space-y-4">
                <Bell className="w-12 h-12 text-zinc-600 mx-auto animate-pulse" />
                <p className="font-bold text-white">No Alerts Logged Yet</p>
                <p className="text-zinc-500 text-xs">All notifications dispatched will be audited here.</p>
              </div>
            )}
          </div>
        )}

        {/* 6. CREDENTIALS AND SETTINGS PANEL */}
        {activeSubTab === "settings" && (
          <form onSubmit={handleSaveSettings} className="bg-zinc-900 border border-zinc-850 rounded-2xl shadow-lg overflow-hidden p-6 sm:p-8 space-y-8 animate-none text-white">
            
            <div className="border-b border-zinc-850 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-500" />
                Credentials Configuration Panel
              </h3>
              <p className="text-zinc-400 text-xs mt-1">
                Configure real payment pathways (Safaricom Daraja) and email/SMS transmission keys. Leaving keys empty will engage simulator sandboxes automatically.
              </p>
            </div>

            {/* Restaurant Info */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-orange-400 text-[10px] uppercase tracking-widest border-b border-zinc-850 pb-1.5 font-mono">
                Restaurant General Info
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Restaurant Name</label>
                  <input
                    type="text"
                    value={settingsForm.restaurantName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, restaurantName: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Contact Phone Number</label>
                  <input
                    type="text"
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Restaurant Email</label>
                  <input
                    type="email"
                    value={settingsForm.email}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Delivery Fee (Ksh Shillings)</label>
                  <input
                    type="number"
                    step="1"
                    value={settingsForm.deliveryFee}
                    onChange={(e) => setSettingsForm({ ...settingsForm, deliveryFee: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Physical Address</label>
                <input
                  type="text"
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* M-Pesa Safaricom Daraja Keys */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-1.5">
                <h4 className="font-extrabold text-orange-400 text-[10px] uppercase tracking-widest font-mono">
                  Safaricom M-Pesa Payment Credentials
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <input
                    type="checkbox"
                    id="mpesa-enable-checkbox"
                    checked={settingsForm.mpesaEnabled}
                    onChange={(e) => setSettingsForm({ ...settingsForm, mpesaEnabled: e.target.checked })}
                    className="w-3.5 h-3.5 accent-orange-500 rounded border-zinc-800 bg-zinc-950"
                  />
                  <label htmlFor="mpesa-enable-checkbox" className="font-bold cursor-pointer text-zinc-300">Enable M-Pesa Checkout</label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Consumer Key</label>
                  <input
                    type="password"
                    placeholder="Enter M-Pesa Consumer Key"
                    value={settingsForm.mpesaConsumerKey || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, mpesaConsumerKey: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Consumer Secret</label>
                  <input
                    type="password"
                    placeholder="Enter M-Pesa Consumer Secret"
                    value={settingsForm.mpesaConsumerSecret || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, mpesaConsumerSecret: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400 font-mono">Business Shortcode (LNM Paybill)</label>
                  <input
                    type="text"
                    placeholder="174379"
                    value={settingsForm.mpesaShortcode || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, mpesaShortcode: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400 font-mono">LNM Passkey</label>
                  <input
                    type="password"
                    placeholder="Enter M-Pesa Online Passkey"
                    value={settingsForm.mpesaPasskey || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, mpesaPasskey: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* SMTP Mail Configuration */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-orange-400 text-[10px] uppercase tracking-widest border-b border-zinc-850 pb-1.5 font-mono">
                Email (SMTP) Alert Configurations
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-1 col-span-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-400 font-mono">SMTP Host server</label>
                  <input
                    type="text"
                    placeholder="smtp.gmail.com"
                    value={settingsForm.smtpHost || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, smtpHost: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400 font-mono">Port</label>
                  <input
                    type="number"
                    placeholder="587"
                    value={settingsForm.smtpPort || 587}
                    onChange={(e) => setSettingsForm({ ...settingsForm, smtpPort: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400 font-mono">SMTP Username / Email</label>
                  <input
                    type="text"
                    placeholder="e.g. business@gmail.com"
                    value={settingsForm.smtpUser || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, smtpUser: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400 font-mono">App Password / Secret</label>
                  <input
                    type="password"
                    placeholder="App Password (not your Gmail password)"
                    value={settingsForm.smtpPass || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, smtpPass: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Africa's Talking SMS */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-orange-400 text-[10px] uppercase tracking-widest border-b border-zinc-850 pb-1.5 font-mono">
                SMS (Africa's Talking) Configurations
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">API Key</label>
                  <input
                    type="password"
                    placeholder="Enter Africa's Talking API Key"
                    value={settingsForm.atApiKey || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, atApiKey: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400 font-mono">Username</label>
                  <input
                    type="text"
                    placeholder="sandbox"
                    value={settingsForm.atUsername || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, atUsername: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit settings bar */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:scale-102 active:scale-95 cursor-pointer"
              >
                Save Credentials Update
              </button>
            </div>

          </form>
        )}

        {/* 7. WEBSITE CONTENT PANEL */}
        {activeSubTab === "content" && (
          <form onSubmit={handleSaveContent} className="bg-zinc-900 border border-zinc-850 rounded-2xl shadow-lg overflow-hidden p-6 sm:p-8 space-y-8 animate-none text-white">
            
            <div className="border-b border-zinc-850 pb-4 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  Website Content Management
                </h3>
                <p className="text-zinc-400 text-xs mt-1">
                  Add and edit all public-facing text, imagery, logos, narratives, operational hours, and your website carousel/gallery photos.
                </p>
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:scale-102 active:scale-95 cursor-pointer"
              >
                Save All Changes
              </button>
            </div>

            {/* Logo & Brand Identity */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-orange-400 text-[10px] uppercase tracking-widest border-b border-zinc-850 pb-1.5 font-mono">
                1. Brand Identity & Logo
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2 space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Brand / Restaurant Name</label>
                    <input
                      type="text"
                      value={settingsForm.restaurantName || ""}
                      onChange={(e) => setSettingsForm({ ...settingsForm, restaurantName: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
                      <span>Logo URL (Image Link)</span>
                      <span className="text-[10px] text-zinc-500">or upload from device</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paste your logo image link (PNG/SVG/JPG)"
                        value={settingsForm.logoUrl || ""}
                        onChange={(e) => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })}
                        className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                      <label className="flex items-center gap-1.5 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold rounded-xl cursor-pointer transition-all active:scale-95 whitespace-nowrap">
                        {uploadingId === "logoUrl" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{uploadingId === "logoUrl" ? "Uploading..." : "Upload logo"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, "logoUrl")}
                          className="hidden"
                          disabled={uploadingId !== null}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Logo Preview box */}
                <div className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-4 flex flex-col items-center justify-center gap-3 text-center min-h-[140px]">
                  <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Logo Preview</span>
                  {settingsForm.logoUrl ? (
                    <img
                      src={settingsForm.logoUrl}
                      alt="Logo preview"
                      className="h-16 w-16 object-contain rounded-full border border-brand-coral/20 p-1 bg-zinc-900 shadow-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800";
                      }}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 font-black text-xl">
                      {settingsForm.restaurantName?.substring(0, 2).toUpperCase() || "SB"}
                    </div>
                  )}
                  <p className="text-[10px] text-zinc-500">
                    {settingsForm.logoUrl ? "Custom Logo Active" : "Using Text-based Branding"}
                  </p>
                </div>
              </div>
            </div>

            {/* Hero Section Config */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-orange-400 text-[10px] uppercase tracking-widest border-b border-zinc-850 pb-1.5 font-mono">
                2. Hero Presentation (Front Page Banner)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8 space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Hero Main Headline</label>
                    <input
                      type="text"
                      placeholder="e.g. Authentic Kenyan Flavors on the A1 Highway"
                      value={settingsForm.heroHeadline || ""}
                      onChange={(e) => setSettingsForm({ ...settingsForm, heroHeadline: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Hero Description Sub-headline</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Savor the finest slow-roasted Mbuzi Choma, spicy Chips Masala, and hot flame-grilled meats..."
                      value={settingsForm.heroSubtitle || ""}
                      onChange={(e) => setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500 resize-none"
                    />
                  </div>
                   <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
                      <span>Featured Hero Image URL (Central Food Plate)</span>
                      <span className="text-[10px] text-zinc-500 font-normal">or upload from device</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. https://images.unsplash.com/..."
                        value={settingsForm.heroImage || ""}
                        onChange={(e) => setSettingsForm({ ...settingsForm, heroImage: e.target.value })}
                        className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                      <label className="flex items-center gap-1.5 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold rounded-xl cursor-pointer transition-all active:scale-95 whitespace-nowrap">
                        {uploadingId === "heroImage" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{uploadingId === "heroImage" ? "Uploading..." : "Upload photo"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, "heroImage")}
                          className="hidden"
                          disabled={uploadingId !== null}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Hero Image preview */}
                <div className="md:col-span-4 bg-zinc-950/60 border border-zinc-850 rounded-xl p-4 flex flex-col items-center justify-center gap-3">
                  <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Hero Plate Preview</span>
                  <div className="relative h-28 w-28 rounded-full overflow-hidden border border-zinc-800 p-1 bg-zinc-900 shadow-lg">
                    <img
                      src={settingsForm.heroImage || "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800"}
                      alt="Hero preview"
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800";
                      }}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 text-center leading-tight">
                    This image sits inside the prominent concave arch in the hero banner.
                  </p>
                </div>
              </div>
            </div>

            {/* About us narrative / Our Journey */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-orange-400 text-[10px] uppercase tracking-widest border-b border-zinc-850 pb-1.5 font-mono">
                3. About Section & Narrative Story
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">About Title</label>
                  <input
                    type="text"
                    placeholder="Our Journey"
                    value={settingsForm.aboutTitle || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, aboutTitle: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">About Subtitle</label>
                  <input
                    type="text"
                    placeholder="From roadside grill to Kitale's favorite culinary destination"
                    value={settingsForm.aboutSubtitle || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, aboutSubtitle: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Introductory Story Paragraph</label>
                <textarea
                  rows={4}
                  placeholder="Enter a captivating narrative of your restaurant's story to display to guests."
                  value={settingsForm.aboutStory || ""}
                  onChange={(e) => setSettingsForm({ ...settingsForm, aboutStory: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>
            </div>

            {/* Operating Schedules */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-orange-400 text-[10px] uppercase tracking-widest border-b border-zinc-850 pb-1.5 font-mono">
                4. Operating Hours & Schedule
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Daily Operating Hours</label>
                  <input
                    type="text"
                    placeholder="e.g. 6:30 AM – 8:30 PM"
                    value={settingsForm.operatingHours || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, operatingHours: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Operating Days</label>
                  <input
                    type="text"
                    placeholder="e.g. Open 7 Days a Week"
                    value={settingsForm.operatingDays || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, operatingDays: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Media Gallery Images Manager */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-1.5">
                <h4 className="font-extrabold text-orange-400 text-[10px] uppercase tracking-widest font-mono">
                  5. Restaurant Media & Image Gallery
                </h4>
                <button
                  type="button"
                  onClick={handleAddGalleryImage}
                  className="flex items-center gap-1 text-[10px] bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Gallery Image URL
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(settingsForm.galleryImages || []).map((imgUrl: string, idx: number) => (
                  <div key={idx} className="bg-zinc-950/60 border border-zinc-850 p-3.5 rounded-xl space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-zinc-500">Image #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(idx)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-all cursor-pointer"
                          title="Delete Image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Paste image URL (from Unsplash, Imgur, etc.)"
                          value={imgUrl}
                          onChange={(e) => handleEditGalleryImage(idx, e.target.value)}
                          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                        />
                        <label className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold rounded-lg cursor-pointer transition-all active:scale-95 whitespace-nowrap">
                          {uploadingId === `gallery-${idx}` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>{uploadingId === `gallery-${idx}` ? "..." : "Upload"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, `gallery-${idx}`)}
                            className="hidden"
                            disabled={uploadingId !== null}
                          />
                        </label>
                      </div>
                    </div>

                    {imgUrl && (
                      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 mt-2">
                        <img
                          src={imgUrl}
                          alt={`Gallery image ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800";
                          }}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                ))}
                
                {(settingsForm.galleryImages || []).length === 0 && (
                  <div className="col-span-1 md:col-span-2 py-10 text-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl space-y-2">
                    <Sparkles className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p className="font-bold text-xs text-zinc-400">No Gallery Photos Configured</p>
                    <p className="text-[10px] text-zinc-600">Click "Add Gallery Image URL" to populate your website's catalog.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Website Decorative & Experience Images */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-orange-400 text-[10px] uppercase tracking-widest border-b border-zinc-850 pb-1.5 font-mono">
                6. Decorative & Section Assets (Tomato Slices, Basil Leaves, Plates)
              </h4>
              <p className="text-zinc-400 text-xs leading-normal">
                Customize the decorative images used as floating background accents and interactive plates across your pages. You can change both their visual links and their display labels.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(settingsForm.websiteImages || []).map((imgObj: any, idx: number) => (
                  <div key={imgObj.id} className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-orange-400">ID: {imgObj.id}</span>
                        <span className="text-[10px] font-mono font-bold text-zinc-500">Asset #{idx + 1}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-400">Asset Label / Name</label>
                        <input
                          type="text"
                          value={imgObj.name}
                          onChange={(e) => {
                            const updated = [...(settingsForm.websiteImages || [])];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            setSettingsForm({ ...settingsForm, websiteImages: updated });
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 font-sans"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-400">Image Source URL</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={imgObj.src}
                            onChange={(e) => {
                              const updated = [...(settingsForm.websiteImages || [])];
                              updated[idx] = { ...updated[idx], src: e.target.value };
                              setSettingsForm({ ...settingsForm, websiteImages: updated });
                            }}
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 font-sans"
                          />
                          <label className="flex items-center gap-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all active:scale-95 whitespace-nowrap">
                            {uploadingId === `website-${idx}` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            <span>{uploadingId === `website-${idx}` ? "..." : "Upload"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, "", idx)}
                              className="hidden"
                              disabled={uploadingId !== null}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {imgObj.src && (
                      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 mt-2 flex items-center justify-center">
                        <img
                          src={imgObj.src}
                          alt={imgObj.name}
                          className="max-h-24 max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800";
                          }}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Submit bar */}
            <div className="pt-4 flex justify-end border-t border-zinc-850">
              <button
                type="submit"
                className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                Publish All Website Contents
              </button>
            </div>

          </form>
        )}

      </div>
    </section>
  );
}
