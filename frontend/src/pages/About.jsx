import { Calendar, Users, Zap, Shield, BarChart3, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const highlights = [
  {
    icon: Calendar,
    title: "Event Management",
    description: "Create, manage, and track events with an intuitive dashboard for organizers.",
  },
  {
    icon: Users,
    title: "Community Focused",
    description: "Built for campus communities — students, organizers, and administrators.",
  },
  {
    icon: Zap,
    title: "Real-time Updates",
    description: "Live seat availability, instant notifications, and Socket.io powered updates.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "JWT authentication, role-based access, and QR-coded tickets for verification.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Comprehensive analytics dashboard for organizers to track event performance.",
  },
  {
    icon: MapPin,
    title: "Location Aware",
    description: "Integrated maps and venue information to help attendees find events.",
  },
];

export default function About() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">About Evently</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Evently is a full-featured event management platform designed to help campus
          communities discover, create, and manage events with ease.
        </p>
      </div>

      {/* Mission */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 sm:p-12 mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
        <p className="text-gray-700 leading-relaxed max-w-3xl">
          We believe every student deserves easy access to campus events. Whether it's a
          tech workshop, cultural festival, sports tournament, or academic seminar — Evently
          brings everything together in one place. Our goal is to make event discovery and
          management seamless for everyone involved.
        </p>
      </div>

      {/* Features Grid */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">What We Offer</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all"
              >
                <Icon className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Built With</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            "React 19", "Express 5", "MongoDB", "Tailwind CSS",
            "Socket.io", "Vite", "Framer Motion", "Recharts"
          ].map((tech) => (
            <div
              key={tech}
              className="text-center py-3 px-4 bg-gray-50 rounded-lg text-sm font-medium text-gray-700"
            >
              {tech}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
        <div className="flex gap-4 justify-center">
          <Link
            to="/explore"
            className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Explore Events
          </Link>
          <Link
            to="/register"
            className="bg-gray-100 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
