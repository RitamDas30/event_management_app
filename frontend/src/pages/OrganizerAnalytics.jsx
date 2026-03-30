import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, CartesianGrid, AreaChart, Area,
} from "recharts";
import {
  CalendarDays, Users, TrendingUp, Ticket, BarChart3, DollarSign,
  Lightbulb, ChevronDown, ArrowUpRight, ArrowDownRight, Minus, Filter,
} from "lucide-react";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

const chartOptions = [
  { id: "registrations", label: "Registrations" },
  { id: "category", label: "Category Breakdown" },
  { id: "fillrate", label: "Fill Rate" },
  { id: "revenue", label: "Revenue" },
  { id: "table", label: "Performance Table" },
];

export default function OrganizerAnalytics() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState("all");
  const [activeChart, setActiveChart] = useState("registrations");

  // Read event from URL param on load
  useEffect(() => {
    const eventParam = searchParams.get("event");
    if (eventParam) setSelectedEventId(eventParam);
  }, [searchParams]);

  // Sync selector back to URL
  const handleEventChange = (val) => {
    setSelectedEventId(val);
    if (val === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ event: val });
    }
  };

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

  const data = useMemo(() => {
    if (selectedEventId === "all") return events;
    return events.filter((e) => e._id === selectedEventId);
  }, [events, selectedEventId]);

  const selectedEvent = selectedEventId !== "all" ? events.find((e) => e._id === selectedEventId) : null;

  // === METRICS ===
  const metrics = useMemo(() => {
    const totalEvents = data.length;
    const totalCapacity = data.reduce((s, e) => s + e.capacity, 0);
    const totalBooked = data.reduce((s, e) => s + (e.capacity - e.seatsAvailable), 0);
    const upcomingCount = data.filter((e) => new Date(e.startTime) > new Date()).length;
    const fillRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;
    const totalRevenue = data.filter((e) => e.price > 0).reduce((s, e) => s + (e.capacity - e.seatsAvailable) * e.price, 0);
    return { totalEvents, totalCapacity, totalBooked, upcomingCount, fillRate, totalRevenue };
  }, [data]);

  // === CHART DATA ===
  const barData = data.map((e) => ({
    name: e.title.length > 12 ? e.title.slice(0, 12) + "…" : e.title,
    registered: e.capacity - e.seatsAvailable,
    available: e.seatsAvailable,
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
  }));

  // === SMART INSIGHTS ===
  const insights = useMemo(() => {
    if (events.length === 0) return [];
    const src = selectedEventId === "all" ? events : data;
    const list = [];

    const bestEvent = [...src].sort((a, b) => {
      const af = a.capacity > 0 ? (a.capacity - a.seatsAvailable) / a.capacity : 0;
      const bf = b.capacity > 0 ? (b.capacity - b.seatsAvailable) / b.capacity : 0;
      return bf - af;
    })[0];
    if (bestEvent) {
      const fill = bestEvent.capacity > 0 ? Math.round(((bestEvent.capacity - bestEvent.seatsAvailable) / bestEvent.capacity) * 100) : 0;
      list.push({ type: "positive", text: selectedEvent ? `${fill}% of capacity filled (${bestEvent.capacity - bestEvent.seatsAvailable}/${bestEvent.capacity})` : `Top performer: "${bestEvent.title}" at ${fill}% fill` });
    }

    if (metrics.totalRevenue > 0) {
      list.push({ type: "positive", text: selectedEvent ? `Revenue: ₹${metrics.totalRevenue.toLocaleString()} from ${metrics.totalBooked} registrations` : `Total revenue: ₹${metrics.totalRevenue.toLocaleString()} across ${data.filter(e => e.price > 0).length} paid events` });
    }

    if (metrics.fillRate >= 70) {
      list.push({ type: "positive", text: `Strong demand — ${metrics.fillRate}% fill rate` });
    } else if (metrics.fillRate < 30 && src.length > 0) {
      list.push({ type: "negative", text: `Low fill rate (${metrics.fillRate}%) — consider promoting or adjusting capacity` });
    }

    if (selectedEventId === "all") {
      const catCounts = events.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + 1; return acc; }, {});
      const topCat = Object.entries(catCounts).sort(([, a], [, b]) => b - a)[0];
      if (topCat) list.push({ type: "neutral", text: `Most active category: ${topCat[0]} (${topCat[1]} events)` });
    } else if (selectedEvent) {
      const daysUntil = Math.ceil((new Date(selectedEvent.startTime) - new Date()) / 86400000);
      if (daysUntil > 0) list.push({ type: "neutral", text: `Event starts in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}` });
      else if (daysUntil === 0) list.push({ type: "positive", text: "Event is today!" });
      if (selectedEvent.eventMode !== "in-person") list.push({ type: "neutral", text: `${selectedEvent.eventMode} event — streaming enabled` });
    }

    return list.slice(0, 4);
  }, [events, data, selectedEventId, selectedEvent, metrics]);

  const insightIcons = { positive: ArrowUpRight, negative: ArrowDownRight, neutral: Minus };
  const insightColors = { positive: "text-green-600 bg-green-50", negative: "text-red-600 bg-red-50", neutral: "text-blue-600 bg-blue-50" };

  const statCards = [
    { title: selectedEvent ? "Capacity" : "Total Events", value: selectedEvent ? selectedEvent.capacity : metrics.totalEvents, icon: CalendarDays, color: "bg-blue-50 text-blue-600" },
    { title: "Registrations", value: metrics.totalBooked, icon: Users, color: "bg-purple-50 text-purple-600" },
    { title: selectedEvent ? "Available" : "Upcoming", value: selectedEvent ? selectedEvent.seatsAvailable : metrics.upcomingCount, icon: Ticket, color: "bg-amber-50 text-amber-600" },
    { title: "Fill Rate", value: `${metrics.fillRate}%`, icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
    { title: "Revenue", value: `₹${metrics.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-green-50 text-green-600" },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-xl border p-5 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
            <div className="h-7 bg-gray-200 rounded w-14"></div>
          </div>
        ))}
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

  // === RENDER SELECTED CHART ===
  const renderChart = () => {
    switch (activeChart) {
      case "registrations":
        return barData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
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
        ) : <Empty />;

      case "category":
        return selectedEvent ? (
          <div className="flex flex-col items-center justify-center h-[320px]">
            <div className="relative w-44 h-44">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#4F46E5" strokeWidth="12"
                  strokeDasharray={`${metrics.fillRate * 2.64} ${264 - metrics.fillRate * 2.64}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{metrics.fillRate}%</span>
                <span className="text-xs text-gray-500">filled</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">{metrics.totalBooked} of {metrics.totalCapacity} seats</p>
            <p className="text-xs text-gray-400 mt-1">{selectedEvent.category} · {selectedEvent.eventMode || "in-person"}</p>
          </div>
        ) : categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value"
                label={({ name, value }) => `${name}: ${value}`} labelLine={{ stroke: "#9ca3af", strokeWidth: 1 }}>
                {categoryData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        ) : <Empty />;

      case "fillrate":
        return fillData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={fillData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" fontSize={11} tick={{ fill: "#6b7280" }} />
              <YAxis domain={[0, 100]} fontSize={11} tick={{ fill: "#6b7280" }} />
              <Tooltip formatter={(val) => `${val}%`} contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
              <Area type="monotone" dataKey="fillRate" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <Empty />;

      case "revenue":
        return revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" fontSize={11} tick={{ fill: "#6b7280" }} />
              <YAxis fontSize={11} tick={{ fill: "#6b7280" }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} formatter={(v) => `₹${v.toLocaleString()}`} />
              <Bar dataKey="revenue" fill="#10B981" name="Revenue" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[320px] text-gray-400 text-sm">
            No paid events — all events are free
          </div>
        );

      case "table":
        return (
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
                      <td className="py-3 px-3 font-medium">{booked}/{event.capacity}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-14 bg-gray-200 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${rate >= 80 ? "bg-green-500" : rate >= 50 ? "bg-blue-500" : "bg-amber-500"}`} style={{ width: `${rate}%` }} />
                          </div>
                          <span className="text-xs font-medium">{rate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium">{rev > 0 ? `₹${rev.toLocaleString()}` : <span className="text-gray-400">Free</span>}</td>
                      <td className="py-3 px-3"><span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${event.eventMode === "online" ? "bg-purple-50 text-purple-600" : event.eventMode === "hybrid" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600"}`}>{event.eventMode || "in-person"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
              {data.length > 1 && (
                <tfoot className="bg-gray-50 border-t font-semibold">
                  <tr>
                    <td className="py-3 px-3">Total</td><td></td><td></td>
                    <td className="py-3 px-3">{metrics.totalBooked}/{metrics.totalCapacity}</td>
                    <td className="py-3 px-3">{metrics.fillRate}%</td>
                    <td className="py-3 px-3 text-green-600">₹{metrics.totalRevenue.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  const Empty = () => <div className="flex items-center justify-center h-[320px] text-gray-400 text-sm">No data available</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Revenue</h1>
          <p className="text-sm text-gray-600 mt-1">
            {selectedEvent ? selectedEvent.title : `Across ${events.length} events`}
          </p>
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select value={selectedEventId} onChange={(e) => handleEventChange(e.target.value)}
            className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-white focus:border-blue-400 focus:outline-none appearance-none cursor-pointer min-w-[220px]">
            <option value="all">All Events (Aggregate)</option>
            {events.map((ev) => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{card.title}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.color}`}><Icon className="w-3.5 h-3.5" /></div>
              </div>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Smart Insights */}
      {insights.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Insights
          </h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {insights.map((insight, idx) => {
              const Icon = insightIcons[insight.type];
              return (
                <div key={idx} className={`flex items-start gap-2 px-3 py-2 rounded-lg ${insightColors[insight.type]}`}>
                  <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <p className="text-xs font-medium">{insight.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chart Section — single chart with dropdown selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">
            {chartOptions.find((c) => c.id === activeChart)?.label}
          </h3>
          <div className="relative">
            <select value={activeChart} onChange={(e) => setActiveChart(e.target.value)}
              className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white focus:border-blue-400 focus:outline-none appearance-none cursor-pointer">
              {chartOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
        {renderChart()}
      </div>
    </div>
  );
}
