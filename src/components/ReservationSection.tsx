import React from "react";
import { Calendar, Users, Map, MessageSquare, Phone, Mail, User, CheckCircle2 } from "lucide-react";
import { Reservation } from "../types";

interface ReservationSectionProps {
  onAddReservation: (data: any) => Promise<Reservation | null>;
  restaurantPhone: string;
}

export default function ReservationSection({ onAddReservation, restaurantPhone }: ReservationSectionProps) {
  const [formData, setFormData] = React.useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    date: "",
    time: "",
    guests: 2,
    seatingArea: "indoor" as "indoor" | "terrace" | "vip",
    specialRequests: ""
  });

  const [loading, setLoading] = React.useState(false);
  const [successReservation, setSuccessReservation] = React.useState<Reservation | null>(null);

  // Initialize dates: minimum date is today, maximum date is 30 days out
  const todayStr = new Date().toISOString().split("T")[0];
  const maxDateStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerPhone || !formData.date || !formData.time) {
      return;
    }
    setLoading(true);
    try {
      const res = await onAddReservation(formData);
      if (res) {
        setSuccessReservation(res);
        // Clear form
        setFormData({
          customerName: "",
          customerPhone: "",
          customerEmail: "",
          date: "",
          time: "",
          guests: 2,
          seatingArea: "indoor",
          specialRequests: ""
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const seatingOptions = [
    {
      id: "indoor",
      title: "Cozy Main Room",
      description: "Warm candle-lit interior with acoustic vibes, perfect for dates and family dinners.",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: "terrace",
      title: "Garden Terrace",
      description: "Lush outdoor patio under string lights with cool breezes and views of the beautiful A1 Highway.",
      image: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: "vip",
      title: "VIP Lounge",
      description: "Plush private booths, custom acoustic dampening, and dedicated host service.",
      image: "https://images.unsplash.com/photo-1485686531765-ba63b07845a7?auto=format&fit=crop&q=80&w=800",
    }
  ];

  return (
    <section className="py-16 bg-zinc-950 text-white" id="reservation-booking-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center space-y-3 max-w-xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Book Your Table in Advance
          </h2>
          <p className="text-zinc-400 text-sm">
            Reserve your preferred dining setting. All bookings are instantly confirmed via SMS and email with no pre-payment required.
          </p>
          <div className="w-12 h-0.5 bg-brand-coral mx-auto rounded-full shadow-[0_0_10px_rgba(242,140,140,0.4)]" />
        </div>

        {successReservation ? (
          <div className="max-w-2xl mx-auto bg-zinc-900 border border-emerald-500/35 p-8 rounded-2xl text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-emerald-500 text-zinc-950 w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Table Confirmed!</h3>
              <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider font-mono">
                Booking ID: #{successReservation.id}
              </p>
              <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
                Thank you, <strong className="text-white">{successReservation.customerName}</strong>! Your table has been reserved for <strong className="text-white">{successReservation.guests} guests</strong> on <strong className="text-brand-coral">{successReservation.date}</strong> at <strong className="text-brand-coral">{successReservation.time}</strong> in the <span className="uppercase text-brand-coral font-bold">{successReservation.seatingArea}</span> zone.
              </p>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl max-w-sm mx-auto text-xs text-zinc-500">
              An instant SMS confirmation has been sent to <span className="text-zinc-300 font-mono font-bold">{successReservation.customerPhone}</span>. Keep this booking ID handy upon arrival.
            </div>

            <button
              onClick={() => setSuccessReservation(null)}
              className="px-6 py-3 bg-brand-coral hover:bg-brand-coral-hover text-zinc-950 text-xs uppercase tracking-wider font-bold rounded-xl transition-all shadow-lg"
            >
              Book Another Table
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Seating Preference Selector Column */}
            <div className="lg:col-span-5 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Map className="w-5 h-5 text-brand-coral" />
                Select Seating Preference
              </h3>

              <div className="space-y-4">
                {seatingOptions.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setFormData({ ...formData, seatingArea: opt.id as any })}
                    className={`relative p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 ${
                      formData.seatingArea === opt.id
                        ? "bg-zinc-900 border-brand-coral shadow-[0_0_15px_rgba(242,140,140,0.15)]"
                        : "bg-zinc-900/40 border-zinc-850 hover:border-zinc-800 hover:bg-zinc-900"
                    }`}
                  >
                    <img
                      src={opt.image}
                      alt={opt.title}
                      className="w-20 h-20 object-cover rounded-xl border border-zinc-800"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                        {opt.title}
                        {formData.seatingArea === opt.id && (
                          <span className="w-2 h-2 rounded-full bg-brand-coral inline-block shadow-[0_0_5px_rgba(242,140,140,0.6)]" />
                        )}
                      </h4>
                      <p className="text-zinc-500 text-xs leading-normal">
                        {opt.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-zinc-900/50 p-5 rounded-2xl border border-zinc-855 space-y-2 text-xs text-zinc-500">
                <p className="font-semibold text-zinc-400">Important Note:</p>
                <p>We hold reserved tables for up to 20 minutes past booking time. If you are running late, please contact our host at <strong className="text-zinc-300 font-mono">{restaurantPhone}</strong>.</p>
              </div>
            </div>

            {/* Booking Form Column */}
            <div className="lg:col-span-7">
              <div className="bg-zinc-900/40 border border-zinc-850 p-6 sm:p-8 rounded-2xl shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-coral" />
                  Your Dining Reservation Details
                </h3>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Customer Name */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          required
                          placeholder="Jane Doe"
                          value={formData.customerName}
                          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-coral focus:ring-2 focus:ring-brand-coral/20"
                        />
                      </div>
                    </div>

                    {/* Customer Phone */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider">Phone Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 0708374149"
                          value={formData.customerPhone}
                          onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-coral focus:ring-2 focus:ring-brand-coral/20"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Date Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider font-mono">Date *</label>
                      <input
                        type="date"
                        required
                        min={todayStr}
                        max={maxDateStr}
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        onClick={(e) => {
                          try {
                            e.currentTarget.showPicker();
                          } catch (err) {
                            // fallback for old browsers
                          }
                        }}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-coral focus:ring-2 focus:ring-brand-coral/20 cursor-pointer"
                        style={{ colorScheme: "dark" }}
                      />
                    </div>

                    {/* Time Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider font-mono">Time *</label>
                      <select
                        required
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-brand-coral focus:ring-2 focus:ring-brand-coral/20"
                      >
                        <option value="">Select Time</option>
                        <option value="07:00">07:00 AM</option>
                        <option value="08:35">08:35 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="12:00">12:00 PM (Lunch)</option>
                        <option value="13:30">01:30 PM</option>
                        <option value="15:00">03:00 PM</option>
                        <option value="17:00">05:00 PM</option>
                        <option value="18:30">06:30 PM (Dinner)</option>
                        <option value="19:30">07:30 PM (Dinner)</option>
                        <option value="20:00">08:00 PM</option>
                      </select>
                    </div>

                    {/* Guests count */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider">Party Size *</label>
                      <div className="relative">
                        <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <select
                          required
                          value={formData.guests}
                          onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-brand-coral focus:ring-2 focus:ring-brand-coral/20"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15].map((g) => (
                            <option key={g} value={g}>{g} {g === 1 ? "Guest" : "Guests"}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider">Email Address (Optional)</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="email"
                        placeholder="jane.doe@gmail.com"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-coral focus:ring-2 focus:ring-brand-coral/20"
                      />
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider">Special Requests / Notes</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                      <textarea
                        rows={3}
                        placeholder="e.g. Birthday dinner, wheelchair access, high-chair, allergies..."
                        value={formData.specialRequests}
                        onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-coral focus:ring-2 focus:ring-brand-coral/20 resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-brand-coral hover:bg-brand-coral-hover text-zinc-950 font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Confirm Table Reservation
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
}
