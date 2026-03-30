import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area,
} from "recharts";
import {
  CalendarDays, Users, TrendingUp, Ticket, BarChart3, DollarSign,
  Lightbulb, ChevronDown, ArrowUpRight, ArrowDownRight, Minus, Filter,
} from "lucide-react";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function OrganizerAnalytics() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/events");
        const mine = res.data.filter(
          (e) => e.organizer?._id === user?.id || e.organizer === user?.id || e.organizer?._id === user?._id
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

  // Filtered data based on selection
  const data = useMemo(() => {
    if (selectedEventId === "all") return events;
    return events.filter((e) => e._id === selectedEventId);
  }, [events, selectedEventId]);

  const selectedEvent = selectedEventId !== "all" ? events.find((e) => e._id === selectedEventId) : null;

  // === COMPUTED METRICS ===
  const metrics = useMemo(() => {
    const totalEvents = data.length;
    const totalCapacity = data.reduce((s, e) => s + e.capacity, 0);
    const totalBooked = data.reduce((s, e) => s + (e.capacity - e.seatsAvailable), 0);
    const totalAvailable = data.reduce((s, e) => s + e.seatsAvailable, 0);
    const upcomingCount = data.filter((e) => new Date(e.startTime) > new Date()).length;
    const pastCount = data.filter((e) => new Date(e.endTime) < new Date()).length;
    const fillRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;
    const paidEvents = data.filter((e) => e.price > 0);
    const totalRevenue = paidEvents.reduce((s, e) => s + (e.capacity - e.seatsAvailable) * e.price, 0);
    const avgPrice = paidEvents.length > 0 ? Math.round(paidEvents.reduce((s, e) => s + e.price, 0) / paidEvents.length) : 0;

    return { totalEvents, totalCapacity, totalBooked, totalAvailable, upcomingCount, pastCount, fillRate, totalRevenue, paidEvents, avgPrice };
  }, [data]);

  // === CHART DATA ===
  const barData = data.map((e) => ({
    name: e.title.length > 12 ? e.title.slice(0, 12) + "…" : e.title,
    registered: e.capacity - e.seatsAvailable,
    available: e.seatsAvailable,
    capacity: e.capacity,
  }));

  const categoryData = Object.entries(
    data.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const fillData = data.map((e) => ({
    name: e.title.length > 10 ? e.title.slice(0, 10) + "…" : e.title,
    fillRate: e.capacity > 0 ? Math.round(((e.capacity - e.seatsAvailable) / e.capacity) * 100) : 0,
  }));

  const revenueData = data.filter((e) => e.price > 0).map((e) => ({
    name: e.title.length > 12 ? e.title.slice(0, 12) + "…" : e.title,
    revenue: (e.capacity - e.seatsAvailable) * e.price,
    registrations: e.capacity - e.seatsAvailable,
    price: e.price,
  }));

  // === SMART INSIGHTS ===
  const insights = useMemo(() => {
    if (events.length === 0) return [];
    const list = [];

    // Best performing event
    const bestEvent = [...events].sort((a, b) => {
      const aFill = a.capacity > 0 ? (a.capacity - a.seatsAvailable) / a.capacity : 0;
      const bFill = b.capacity > 0 ? (b.capacity - b.seatsAvailable) / b.capacity : 0;
      return bFill - aFill;
    })[0];
    if (bestEvent) {
      const fill = bestEvent.capacity > 0 ? Math.round(((bestEvent.capacity - bestEvent.seatsAvailable) / bestEvent.capacity) * 100) : 0;
      list.push({ type: "positive", text: `Top performer: "${bestEvent.title}" with ${fill}% fill rate` });
    }

    // Revenue insight
    if (metrics.totalRevenue > 0) {
      const topRevenue = [...events].filter((e) => e.price > 0).sort((a, b) => ((b.capacity - b.seatsAvailable) * b.price) - ((a.capacity - a.seatsAvailable) * a.price))[0];
      if (topRevenue) {
        list.push({ type: "positive", text: `Highest revenue: "${topRevenue.title}" at ₹${((topRevenue.capacity - topRevenue.seatsAvailable) * topRevenue.price).toLocaleString()}` });
      }
    }

    // Fill rate insight
    if (metrics.fillRate >= 70) {
      list.push({ type: "positive", text: `Strong demand — ${metrics.fillRate}% average fill rate across all events` });
    } else if (metrics.fillRate < 30 && events.length > 1) {
      list.push({ type: "negative", text: `Low fill rate (${metrics.fillRate}%) — consider promoting events or adjusting capacity` });
    }

    // Category insight
    const catCounts = events.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + 1; return acc; }, {});
    const topCat = Object.entries(catCounts).sort(([, a], [, b]) => b - a)[0];
    if (topCat) {
      list.push({ type: "neutral", text: `Most active category: ${topCat[0]} (${topCat[1]} events)` });
    }

    // Free vs paid
    const freeCount = events.filter((e) => e.price === 0).length;
    const paidCount = events.filter((e) => e.price > 0).length;
    if (freeCount > 0 && paidCount > 0) {
      list.push({ type: "neutral", text: `Event mix: ${paidCount} paid, ${freeCount} free — ${Math.round((paidCount / events.length) * 100)}% monetized` });
    }

    // Upcoming events
    if (metrics.upcomingCount > 0) {
      const nextEvent = events.filter((e) => new Date(e.startTime) > new Date()).sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0];
      if (nextEvent) {
        const daysUntil = Math.ceil((new Date(nextEvent.startTime) - new Date()) / 86400000);
        const fill = nextEvent.capacity > 0 ? Math.round(((nextEvent.capacity - nextEvent.seatsAvailable) / nextEvent.capacity) * 100) : 0;
        list.push({ type: fill < 50 ? "negative" : "neutral", text: `Next event "${nextEvent.title}" in ${daysUntil} day${daysUntil !== 1 ? "s" : ""} — ${fill}% filled` });
      }
    }

    return list.slice(0, 4);
  }, [events, metrics]);

  const insightIcons = { positive: ArrowUpRight, negative: ArrowDownRight, neutral: Minus };
  const insightColors = { positive: "text-green-600 bg-green-50", negative: "text-red-600 bg-red-50", neutral: "text-blue-600 bg-blue-50" };

  // === STAT CARDS ===
  const statCards = [
    { title: selectedEvent ? "Capacity" : "Total Events", value: selectedEvent ? selectedEvent.capacity : metrics.totalEvents, icon: CalendarDays, color: "bg-blue-50 text-blue-600" },
    { title: "Registrations", value: metrics.totalBooked, icon: Users, color: "bg-purple-50 text-purple-600" },
    { title: selectedEvent ? "Available" : "Upcoming", value: selectedEvent ? selectedEvent.seatsAvailable : metrics.upcomingCount, icon: Ticket, color: "bg-amber-50 text-amber-600" },
    { title: "Fill Rate", value: `${metrics.fillRate}%`, icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
    { title: "Revenue", value: `₹${metrics.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-green-50 text-green-600" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
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

  return (
    <div>
      {/* Header + Event Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Revenue</h1>
          <p className="text-sm text-gray-600 mt-1">
            {selectedEvent ? `Viewing: ${selectedEvent.title}` : `Across ${events.length} events`}
          </p>
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-white focus:border-blue-400 focus:outline-none appearance-none cursor-pointer min-w-[220px]"
          >
            <option value="all">All Events (Aggregate)</option>
            {events.map((ev) => (
              <option key={ev._id} value={ev._id}>{ev.title}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.title}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Smart Insights */}
      {selectedEventId === "all" && insights.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" /> Key Insights
          </h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {insights.map((insight, idx) => {
              const Icon = insightIcons[insight.type];
              return (
                <div key={idx} className={`flex items-start gap-2 px-3 py-2 rounded-lg ${insightColors[insight.type]}`}>
                  <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="text-xs font-medium">{insight.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Registrations Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            {selectedEvent ? "Capacity Breakdown" : "Registrations by Event"}
          </h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={11} tick={{ fill: "#6b7280" }} />
                <YAxis allowDecimals={false} fontSize={11} tick={{ fill: "#6b7280" }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="registered" fill="#4F46E5" name="Registered" radius={[4, 4, 0, 0]} />
                <Bar dataKey="available" fill="#10B981" name="Available" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-gray-400 py-12 text-sm">No data</p>}
        </div>

        {/* Category / Fill Rate */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            {selectedEvent ? "Fill Rate" : "Events by Category"}
          </h3>
          {selectedEvent ? (
            <div className="flex flex-col items-center justify-center h-[260px]">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#4F46E5" strokeWidth="12"
                    strokeDasharray={`${metrics.fillRate * 2.64} ${264 - metrics.fillRate * 2.64}`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">{metrics.fillRate}%</span>
                  <span className="text-xs text-gray-500">filled</span>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600">{metrics.totalBooked} of {metrics.totalCapacity} seats</p>
            </div>
          ) : categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`} labelLine={{ stroke: "#9ca3af", strokeWidth: 1 }}>
                  {categoryData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-gray-400 py-12 text-sm">No data</p>}
        </div>
      </div>

      {/* Fill Rate Trend + Revenue */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Fill Rate Trend */}
        {!selectedEvent && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Fill Rate by Event (%)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={fillData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={11} tick={{ fill: "#6b7280" }} />
                <YAxis domain={[0, 100]} fontSize={11} tick={{ fill: "#6b7280" }} />
                <Tooltip formatter={(val) => `${val}%`} contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                <Area type="monotone" dataKey="fillRate" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Revenue Chart */}
        {revenueData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue by Event</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={11} tick={{ fill: "#6b7280" }} />
                <YAxis fontSize={11} tick={{ fill: "#6b7280" }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} formatter={(v, name) => name === "revenue" ? `₹${v.toLocaleString()}` : v} />
                <Bar dataKey="revenue" fill="#10B981" name="Revenue" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Event Performance Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          {selectedEvent ? "Event Details" : "Event Performance"}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Event</th>
                <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Category</th>
                <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Date</th>
                <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Registered</th>
                <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Fill Rate</th>
                <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Revenue</th>
                <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Mode</th>
              </tr>
            </thead>
            <tbody>
              {data.map((event) => {
                const booked = event.capacity - event.seatsAvailable;
                const rate = event.capacity > 0 ? Math.round((booked / event.capacity) * 100) : 0;
                const rev = event.price > 0 ? booked * event.price : 0;
                return (
                  <tr key={event._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium text-gray-900">{event.title}</td>
                    <td className="py-3 px-3"><span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{event.category}</span></td>
                    <td className="py-3 px-3 text-gray-600 text-xs">{new Date(event.startTime).toLocaleDateString()}</td>
                    <td className="py-3 px-3 text-gray-900 font-medium">{booked}/{event.capacity}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-14 bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${rate >= 80 ? "bg-green-500" : rate >= 50 ? "bg-blue-500" : "bg-amber-500"}`} style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-700">{rate}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-gray-900">{rev > 0 ? `₹${rev.toLocaleString()}` : <span className="text-gray-400">Free</span>}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        event.eventMode === "online" ? "bg-purple-50 text-purple-600" : event.eventMode === "hybrid" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600"
                      }`}>{event.eventMode || "in-person"}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {data.length > 1 && (
              <tfoot className="bg-gray-50 border-t font-semibold">
                <tr>
                  <td className="py-3 px-3 text-gray-900">Total</td>
                  <td></td>
                  <td></td>
                  <td className="py-3 px-3 text-gray-900">{metrics.totalBooked}/{metrics.totalCapacity}</td>
                  <td className="py-3 px-3 text-gray-700">{metrics.fillRate}%</td>
                  <td className="py-3 px-3 text-green-600">₹{metrics.totalRevenue.toLocaleString()}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
