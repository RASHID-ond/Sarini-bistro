import React from "react";
import { Mail, Phone, User, MessageSquare, Send, CheckCircle2, MapPin } from "lucide-react";
import { ContactMessage } from "../types";

interface ContactSectionProps {
  onSendMessage: (data: any) => Promise<ContactMessage | null>;
  restaurantPhone: string;
  restaurantEmail: string;
  restaurantAddress: string;
}

export default function ContactSection({
  onSendMessage,
  restaurantPhone,
  restaurantEmail,
  restaurantAddress,
}: ContactSectionProps) {
  const [formData, setFormData] = React.useState({
    fullName: "",
    email: "",
    phone: "",
    message: "",
  });

  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState<ContactMessage | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone || !formData.message) {
      return;
    }
    setLoading(true);
    try {
      const res = await onSendMessage(formData);
      if (res) {
        setSuccess(res);
        setFormData({ fullName: "", email: "", phone: "", message: "" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 bg-zinc-950 text-white" id="contact-us-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Title */}
        <div className="text-center space-y-3 max-w-xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Get in Touch
          </h2>
          <p className="text-zinc-400 text-sm">
            Questions, feedback, or a special request? Send us a message and our team will get back to you.
          </p>
          <div className="w-12 h-0.5 bg-brand-coral mx-auto rounded-full shadow-[0_0_10px_rgba(242,140,140,0.4)]" />
        </div>

        {success ? (
          <div className="max-w-2xl mx-auto bg-zinc-900 border border-emerald-500/35 p-8 rounded-2xl text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-emerald-500 text-zinc-950 w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Message Sent!</h3>
              <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider font-mono">
                Reference: #{success.id}
              </p>
              <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
                Thank you, <strong className="text-white">{success.fullName}</strong>! We've received your message and will respond to you shortly.
              </p>
            </div>

            <button
              onClick={() => setSuccess(null)}
              className="px-6 py-3 bg-brand-coral hover:bg-brand-coral-hover text-zinc-950 text-xs uppercase tracking-wider font-bold rounded-xl transition-all shadow-lg"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

            {/* Contact Info Column */}
            <div className="lg:col-span-5 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-coral" />
                Reach Us Directly
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-2xl border border-zinc-850 bg-zinc-900/40">
                  <div className="w-10 h-10 rounded-xl bg-brand-coral/10 border border-brand-coral/20 flex items-center justify-center shrink-0">
                    <Phone className="w-4.5 h-4.5 text-brand-coral" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Phone</p>
                    <p className="text-sm text-white font-semibold mt-0.5">{restaurantPhone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl border border-zinc-850 bg-zinc-900/40">
                  <div className="w-10 h-10 rounded-xl bg-brand-coral/10 border border-brand-coral/20 flex items-center justify-center shrink-0">
                    <Mail className="w-4.5 h-4.5 text-brand-coral" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email</p>
                    <p className="text-sm text-white font-semibold mt-0.5">{restaurantEmail}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl border border-zinc-850 bg-zinc-900/40">
                  <div className="w-10 h-10 rounded-xl bg-brand-coral/10 border border-brand-coral/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-4.5 h-4.5 text-brand-coral" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Address</p>
                    <p className="text-sm text-white font-semibold mt-0.5">{restaurantAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form Column */}
            <div className="lg:col-span-7">
              <div className="bg-zinc-900 border border-zinc-850 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-brand-coral" />
                  Send Us a Message
                </h3>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          required
                          placeholder="Jane Doe"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-coral focus:ring-2 focus:ring-brand-coral/20"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider">Phone Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 0708374149"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-coral focus:ring-2 focus:ring-brand-coral/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="email"
                        required
                        placeholder="jane.doe@gmail.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-coral focus:ring-2 focus:ring-brand-coral/20"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider">Message *</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                      <textarea
                        required
                        rows={5}
                        placeholder="Tell us how we can help..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
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
                        <Send className="w-5 h-5" />
                        Send Message
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
