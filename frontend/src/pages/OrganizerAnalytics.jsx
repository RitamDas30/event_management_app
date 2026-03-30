import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";
import { CalendarDays, Users, TrendingUp, Ticket, BarChart3 } from "lucide-react";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function OrganizerAnalytics() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/events");
        const mine = res.data.filter(
          (e) => e.organizer === user?._id || e.organizer?._id === user?._id || e.organizer?.toString() === user?.id
        );
        setEvents(mine);
      } catch (err) {
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-20">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">No analytics data</h3>
        <p className="text-gray-500 mt-2">Create events to see analytics</p>
      </div>
    );
  }

  const totalEvents = events.length;
  const totalCapacity = events.reduce((s, e) => s + e.capacity, 0);
  const totalBooked = events.reduce((s, e) => s + (e.capacity - e.seatsAvailable), 0);
  const upcomingCount = events.filter((e) => new Date(e.startTime) > new Date()).length;
  const fillRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

  const barData = events.map((e) => ({
    name: e.title.length > 15 ? e.title.slice(0, 15) + "..." : e.title,
    registered: e.capacity - e.seatsAvailable,
    available: e.seatsAvailable,
  }));

  const categoryData = Object.entries(
    events.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const fillData = events.map((e) => ({
    name: e.title.length > 12 ? e.title.slice(0, 12) + "..." : e.title,
    fillRate: e.capacity > 0 ? Math.round(((e.capacity - e.seatsAvailable) / e.capacity) * 100) : 0,
  }));

  const statCards = [
    { title: "Total Events", value: totalEvents, icon: CalendarDays, color: "bg-blue-50 text-blue-600" },
    { title: "Total Registrations", value: totalBooked, icon: Users, color: "bg-green-50 text-green-600" },
    { title: "Upcoming Events", value: upcomingCount, icon: Ticket, color: "bg-purple-50 text-purple-600" },
    { title: "Avg Fill Rate", value: `${fillRate}%`, icon: TrendingUp, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">{card.title}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Registration Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Registrations by Event</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="registered" fill="#4F46E5" name="Registered" radius={[4, 4, 0, 0]} />
              <Bar dataKey="available" fill="#10B981" name="Available" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Events by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {categoryData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fill Rate Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fill Rate by Event (%)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={fillData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(val) => `${val}%`} />
            <Line type="monotone" dataKey="fillRate" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: "#8B5CF6" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Event</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Registered</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Capacity</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Fill Rate</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const booked = event.capacity - event.seatsAvailable;
                const rate = event.capacity > 0 ? Math.round((booked / event.capacity) * 100) : 0;
                return (
                  <tr key={event._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{event.title}</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{event.category}</span></td>
                    <td className="py-3 px-4 text-gray-600">{new Date(event.startTime).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-gray-900 font-medium">{booked}</td>
                    <td className="py-3 px-4 text-gray-600">{event.capacity}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${rate >= 80 ? "bg-green-500" : rate >= 50 ? "bg-amber-500" : "bg-red-400"}`} style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-xs font-medium">{rate}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{event.price > 0 ? `₹${booked * event.price}` : "Free"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
