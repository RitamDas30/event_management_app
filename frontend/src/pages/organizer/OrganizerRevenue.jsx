import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { DollarSign, TrendingUp, CreditCard, RefreshCw, Calendar } from "lucide-react";

export default function OrganizerRevenue() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/events");
        const mine = res.data.filter(
          (e) => e.organizer === user?._id || e.organizer?._id === user?._id || e.organizer?.toString() === user?.id
        );
        setEvents(mine);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [user]);

  const paidEvents = events.filter((e) => e.price > 0);
  const totalRevenue = paidEvents.reduce((sum, e) => sum + (e.capacity - e.seatsAvailable) * e.price, 0);
  const totalPaidRegistrations = paidEvents.reduce((sum, e) => sum + (e.capacity - e.seatsAvailable), 0);

  const statCards = [
    { title: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    { title: "Paid Events", value: paidEvents.length, icon: CreditCard, color: "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400" },
    { title: "Paid Registrations", value: totalPaidRegistrations, icon: TrendingUp, color: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400" },
    { title: "Free Events", value: events.length - paidEvents.length, icon: Calendar, color: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-surface-950 dark:text-surface-50 mb-6">Revenue Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-surface-50 dark:bg-surface-900 rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-surface-600 dark:text-surface-400">{card.title}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-surface-950 dark:text-surface-50">{loading ? "..." : card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue Table */}
      <div className="bg-surface-50 dark:bg-surface-900 rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-surface-950 dark:text-surface-50 mb-4">Revenue by Event</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-surface-100 dark:bg-surface-800 rounded animate-pulse"></div>)}
          </div>
        ) : paidEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-100 dark:bg-surface-900/50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-surface-600 dark:text-surface-400">Event</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600 dark:text-surface-400">Price</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600 dark:text-surface-400">Registrations</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600 dark:text-surface-400">Revenue</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600 dark:text-surface-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {paidEvents.map((event) => {
                  const booked = event.capacity - event.seatsAvailable;
                  const revenue = booked * event.price;
                  return (
                    <tr key={event._id} className="border-b border-border hover:bg-surface-100 dark:bg-surface-900/50">
                      <td className="py-3 px-4 font-medium text-surface-950 dark:text-surface-50">{event.title}</td>
                      <td className="py-3 px-4 text-surface-600 dark:text-surface-400">₹{event.price}</td>
                      <td className="py-3 px-4 text-surface-600 dark:text-surface-400">{booked}/{event.capacity}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">₹{revenue.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          new Date(event.startTime) > new Date() ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400"
                        }`}>
                          {new Date(event.startTime) > new Date() ? "Active" : "Completed"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-surface-100 dark:bg-surface-900/50 border-t">
                <tr>
                  <td className="py-3 px-4 font-bold text-surface-950 dark:text-surface-50">Total</td>
                  <td></td>
                  <td className="py-3 px-4 font-medium text-surface-700 dark:text-surface-300">{totalPaidRegistrations}</td>
                  <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">₹{totalRevenue.toLocaleString()}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-surface-300 dark:text-surface-700 mx-auto mb-3" />
            <p className="text-surface-500">No paid events yet</p>
            <p className="text-sm text-surface-400 dark:text-surface-500 mt-1">Create events with a ticket price to see revenue</p>
          </div>
        )}
      </div>
    </div>
  );
}
