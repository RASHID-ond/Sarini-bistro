import React from "react";
import { Clock, Search, Truck, MapPin, Phone, CreditCard, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Order } from "../types";

interface TrackingSectionProps {
  activeOrder: Order | null;
  onSearchOrder: (id: string) => Promise<Order | null>;
  restaurantPhone: string;
}

export default function TrackingSection({ activeOrder, onSearchOrder, restaurantPhone }: TrackingSectionProps) {
  const [searchId, setSearchId] = React.useState("");
  const [searchedOrder, setSearchedOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Auto-set searched order if activeOrder updates
  React.useEffect(() => {
    if (activeOrder) {
      setSearchedOrder(activeOrder);
    }
  }, [activeOrder]);

  // Poll status of the order if it's currently pending/preparing and being viewed
  React.useEffect(() => {
    let interval: any;
    if (searchedOrder && searchedOrder.orderStatus !== "completed" && searchedOrder.orderStatus !== "failed") {
      interval = setInterval(async () => {
        try {
          const res = await onSearchOrder(searchedOrder.id);
          if (res) {
            setSearchedOrder(res);
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 5000); // Check every 5 seconds
    }
    return () => clearInterval(interval);
  }, [searchedOrder, onSearchOrder]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await onSearchOrder(searchId.trim().toUpperCase());
      if (res) {
        setSearchedOrder(res);
      } else {
        setError("No order found with that ID. Please check and try again.");
        setSearchedOrder(null);
      }
    } catch (err) {
      setError("An error occurred while fetching order. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { key: "pending", title: "Order Placed", desc: "We received your order and are reviewing details." },
    { key: "confirmed", title: "Confirmed", desc: "Our staff confirmed your order and scheduled kitchen prep." },
    { key: "preparing", title: "Kitchen Prep", desc: "Our chefs are preparing your delicious meals." },
    { key: "ready", title: "Ready", desc: searchedOrder?.orderType === "delivery" ? "Out with our courier for delivery." : "Ready for you to collect at the counter." },
    { key: "completed", title: "Delivered", desc: "Order successfully completed. Enjoy your meal!" }
  ];

  const getStepIndex = (status: string) => {
    return steps.findIndex(s => s.key === status);
  };

  const currentStepIdx = searchedOrder ? getStepIndex(searchedOrder.orderStatus) : -1;

  return (
    <section className="py-12 bg-zinc-950 min-h-[500px]" id="order-tracking-section">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Title */}
        <div className="text-center space-y-3 max-w-xl mx-auto mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Track Your Fresh Feast
          </h2>
          <p className="text-zinc-400 text-sm">
            Enter your order number (e.g., SRN1234) below to view its preparation and dispatch progression in real time.
          </p>
          <div className="w-12 h-0.5 bg-brand-coral mx-auto rounded-full shadow-[0_0_10px_rgba(242,140,140,0.4)]" />
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-3 max-w-lg mx-auto mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
            <input
              type="text"
              required
              placeholder="Enter Order ID (e.g. SRN1234)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-850 py-3 pl-11 pr-4 text-sm text-white font-mono font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-coral/35 focus:border-brand-coral shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-brand-coral hover:bg-brand-coral-hover text-zinc-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-brand-coral/10 flex items-center gap-1.5 cursor-pointer"
          >
            {loading ? "Searching..." : "Track Status"}
          </button>
        </form>

        {error && (
          <div className="max-w-lg mx-auto bg-red-950/30 border border-red-900/40 text-red-400 p-4 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-2 mb-8 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {searchedOrder ? (
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header with ID and Order Type */}
            <div className="bg-zinc-950 text-white p-5 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900">
              <div>
                <span className="block text-xs font-semibold tracking-wider text-brand-coral uppercase font-mono">
                  Order Reference
                </span>
                <span className="text-2xl font-bold tracking-tight font-mono">
                  #{searchedOrder.id}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  searchedOrder.orderType === "delivery" 
                    ? "bg-brand-coral/10 text-brand-coral border border-brand-coral/25" 
                    : "bg-teal-500/10 text-teal-400 border border-teal-500/25"
                }`}>
                  {searchedOrder.orderType}
                </span>
                <span className="text-zinc-500 text-xs font-mono">
                  {new Date(searchedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* M-Pesa Interactive STK listening banner */}
            {searchedOrder.paymentMethod === "mpesa" && searchedOrder.paymentStatus === "pending" && (
              <div className="bg-amber-950/15 border-b border-amber-900/25 p-4 sm:px-8 flex items-center gap-3 text-brand-coral text-xs leading-normal">
                <div className="w-2 h-2 rounded-full bg-brand-coral animate-ping shrink-0" />
                <span className="w-4 h-4 border-2 border-brand-coral border-t-transparent rounded-full animate-spin shrink-0" />
                <span>
                  <strong>Awaiting M-Pesa payment confirmation:</strong> An STK Push was sent to <strong className="font-mono text-white">{searchedOrder.paymentPhone}</strong> for Ksh {searchedOrder.total.toLocaleString()}. Please input your PIN on your phone to complete. This panel will update automatically.
                </span>
              </div>
            )}

            {/* Stepper Progress bar */}
            <div className="p-6 sm:p-8 border-b border-zinc-900 bg-zinc-950/40">
              <div className="relative flex flex-col md:flex-row justify-between gap-6 md:gap-4">
                
                {/* Connecting line (Desktop) */}
                <div className="absolute top-4.5 left-6 right-6 h-0.5 bg-zinc-800 -z-0 hidden md:block" />
                <div 
                  className="absolute top-4.5 left-6 h-0.5 bg-emerald-500 -z-0 hidden md:block transition-all duration-500" 
                  style={{ width: `${Math.max(0, (currentStepIdx / (steps.length - 1)) * 90)}%` }}
                />

                {steps.map((step, idx) => {
                  const isCompleted = idx < currentStepIdx;
                  const isActive = idx === currentStepIdx;
                  const isFuture = idx > currentStepIdx;

                  return (
                    <div key={step.key} className="flex md:flex-col items-start md:items-center gap-3 md:text-center relative z-10 md:flex-1">
                      
                      {/* Step Bubble */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 font-bold text-xs ${
                        isCompleted 
                          ? "bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/15" 
                          : isActive 
                            ? "bg-brand-coral text-zinc-950 border-brand-coral shadow-lg shadow-brand-coral/20 scale-110 font-extrabold" 
                            : "bg-zinc-900 text-zinc-500 border-zinc-800"
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                      </div>

                      {/* Step Labels */}
                      <div className="space-y-0.5">
                        <p className={`font-bold text-sm ${isActive ? "text-brand-coral" : isCompleted ? "text-zinc-100" : "text-zinc-500"}`}>
                          {step.title}
                        </p>
                        <p className="text-zinc-400 text-[11px] leading-normal max-w-xs md:max-w-[150px] mx-auto">
                          {step.desc}
                        </p>
                      </div>

                    </div>
                  );
                })}

              </div>
            </div>

            {/* Order breakdown details */}
            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              
              {/* Left: items list */}
              <div className="space-y-4">
                <h4 className="font-bold text-white text-sm border-b border-zinc-850 pb-2">
                  Items Ordered
                </h4>
                <div className="divide-y divide-zinc-850/60">
                  {searchedOrder.items.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex justify-between text-sm">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-zinc-100">{item.name}</p>
                        <p className="text-zinc-400 text-xs">Qty: {item.quantity} × Ksh {item.price.toLocaleString()}</p>
                      </div>
                      <span className="font-bold text-zinc-100 text-sm">
                        Ksh {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pricing Summary block */}
                <div className="bg-zinc-950/40 p-4 rounded-xl space-y-2 text-xs border border-zinc-850">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal:</span>
                    <span>Ksh {searchedOrder.subtotal.toLocaleString()}</span>
                  </div>
                  {searchedOrder.orderType === "delivery" && (
                    <div className="flex justify-between text-zinc-400">
                      <span>Delivery Fee:</span>
                      <span>Ksh {searchedOrder.deliveryFee.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white font-bold border-t border-zinc-850 pt-2 text-sm">
                    <span>Total Cost:</span>
                    <span className="text-brand-coral">Ksh {searchedOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Right: Customer & Delivery Info */}
              <div className="space-y-6">
                
                {/* Contact & delivery Card */}
                <div className="space-y-3.5 bg-zinc-950/40 p-5 rounded-xl border border-zinc-850">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                    Customer Information
                  </h4>
                  <div className="space-y-2.5 text-xs text-zinc-300">
                    <div>
                      <span className="block text-zinc-500">Recipient Name</span>
                      <span className="font-semibold text-white text-sm">{searchedOrder.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="font-mono">{searchedOrder.customerPhone}</span>
                    </div>
                    {searchedOrder.orderType === "delivery" && (
                      <div className="flex items-start gap-2 pt-1.5 border-t border-zinc-850 mt-2">
                        <MapPin className="w-4 h-4 text-brand-coral shrink-0 mt-0.5" />
                        <div>
                          <span className="block text-zinc-500">Delivery Address</span>
                          <span className="text-zinc-200 leading-normal">{searchedOrder.deliveryAddress}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment summary block */}
                <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-950/40 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-900 text-zinc-100 rounded-lg">
                      <CreditCard className="w-4.5 h-4.5 text-brand-coral" />
                    </div>
                    <div>
                      <span className="block text-zinc-500">Payment Option</span>
                      <span className="font-semibold text-white uppercase font-mono">
                        {searchedOrder.paymentMethod === "mpesa" ? "M-Pesa Mobile Money" : "Cash on Delivery"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase border ${
                      searchedOrder.paymentStatus === "paid" 
                        ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/30" 
                        : searchedOrder.paymentStatus === "failed" 
                          ? "bg-red-950/40 text-red-400 border-red-900/30" 
                          : "bg-brand-coral/25 text-brand-coral border-brand-coral/25"
                    }`}>
                      {searchedOrder.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-[11px] text-zinc-500">
                    Need help or want to cancel? Call us at <strong className="text-zinc-300 font-mono">{restaurantPhone}</strong>
                  </p>
                </div>

              </div>

            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center py-12 bg-[#111] border border-zinc-900 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="bg-zinc-950 text-brand-coral w-12 h-12 rounded-full flex items-center justify-center mx-auto border border-zinc-900">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-white text-base">No Active Order Selected</p>
              <p className="text-zinc-400 text-xs leading-relaxed max-w-xs mx-auto">
                Once you place an order, it will appear here automatically. You can also look up previous orders by reference.
              </p>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
