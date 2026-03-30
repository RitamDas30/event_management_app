import { Link } from "react-router-dom";
import { Calendar, Mail, MapPin, ExternalLink } from "lucide-react";

const footerLinks = {
  platform: [
    { name: "Browse Events", path: "/explore" },
    { name: "Create Event", path: "/login" },
    { name: "About Us", path: "/about" },
    { name: "Contact", path: "/contact" },
  ],
  categories: [
    { name: "Technical", path: "/explore?category=Technical" },
    { name: "Cultural", path: "/explore?category=Cultural" },
    { name: "Sports", path: "/explore?category=Sports" },
    { name: "Academic", path: "/explore?category=Academic" },
    { name: "Social", path: "/explore?category=Social" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-white text-xl font-bold">
              <Calendar className="w-6 h-6 text-blue-400" />
              Evently
            </Link>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
              Discover, create, and manage events effortlessly. Your all-in-one platform for campus and community events.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Platform</h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Categories</h3>
            <ul className="space-y-2">
              {footerLinks.categories.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Get in Touch</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>support@evently.app</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>Built for Campus Communities</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <ExternalLink className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Evently. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/about" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/about" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
