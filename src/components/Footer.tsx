import { MapPin, Phone, Mail, Clock, ShieldAlert } from "lucide-react";

interface FooterProps {
  restaurantName: string;
  phone: string;
  email: string;
  address: string;
}

export default function Footer({ restaurantName, phone, email, address }: FooterProps) {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 text-zinc-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-10">
        
        {/* About Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white tracking-tight">{restaurantName}</span>
          </div>
          <p className="text-sm leading-relaxed text-zinc-500">
            A refined culinary experience blending traditional flavors with a modern twist. Enjoy hand-crafted steaks, artisanal wood-fired pizzas, and vibrant drinks right in the heart of Nairobi.
          </p>
          <div className="flex items-center gap-2 text-zinc-600 text-xs mt-4">
            <ShieldAlert className="w-4 h-4 text-brand-coral/60" />
            <span>Secured Checkout with instant M-Pesa tracking.</span>
          </div>
        </div>

        {/* Contact Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Contact & Location</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-brand-coral shrink-0 mt-0.5" />
              <span>{address}</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-brand-coral shrink-0" />
              <a href={`tel:${phone}`} className="hover:text-brand-coral transition-colors">{phone}</a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-brand-coral shrink-0" />
              <a href={`mailto:${email}`} className="hover:text-brand-coral transition-colors">{email}</a>
            </li>
          </ul>
        </div>

        {/* Hours of Operation */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Hours of Operation</h3>
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80 space-y-2.5">
            <div className="flex items-center gap-2.5 text-brand-coral text-sm font-medium">
              <Clock className="w-4 h-4" />
              <span>Open 7 Days a Week</span>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Monday - Sunday:</span>
                <span className="text-zinc-300 font-medium">6:30 AM - 8:30 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Kitchen Closes:</span>
                <span className="text-zinc-300 font-medium">8:15 PM</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-zinc-900/80 text-center text-xs text-zinc-600 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} {restaurantName}. All rights reserved.</p>
        <p className="font-mono hover:text-zinc-500 transition-colors cursor-pointer">
          Built for Sarini Bistro • Nairobi, Kenya
        </p>
      </div>
    </footer>
  );
}
