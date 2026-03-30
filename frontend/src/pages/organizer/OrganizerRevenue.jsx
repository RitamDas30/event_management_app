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
    { title: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-green-50 text-green-600" },
    { title: "Paid Events", value: paidEvents.length, icon: CreditCard, color: "bg-blue-50 text-blue-600" },
    { title: "Paid Registrations", value: totalPaidRegistrations, icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
    { title: "Free Events", value: events.length - paidEvents.length, icon: Calendar, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Revenue Dashboard</h1>

      {/* Stats */}
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
              <p className="text-2xl font-bold text-gray-900">{loading ? "..." : card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Event</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>)}
          </div>
        ) : paidEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Event</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Registrations</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Revenue</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {paidEvents.map((event) => {
                  const booked = event.capacity - event.seatsAvailable;
                  const revenue = booked * event.price;
                  return (
                    <tr key={event._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{event.title}</td>
                      <td className="py-3 px-4 text-gray-600">₹{event.price}</td>
                      <td className="py-3 px-4 text-gray-600">{booked}/{event.capacity}</td>
                      <td className="py-3 px-4 font-bold text-green-600">₹{revenue.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          new Date(event.startTime) > new Date() ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-600"
                        }`}>
                          {new Date(event.startTime) > new Date() ? "Active" : "Completed"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td className="py-3 px-4 font-bold text-gray-900">Total</td>
                  <td></td>
                  <td className="py-3 px-4 font-medium text-gray-700">{totalPaidRegistrations}</td>
                  <td className="py-3 px-4 font-bold text-green-600">₹{totalRevenue.toLocaleString()}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No paid events yet</p>
            <p className="text-sm text-gray-400 mt-1">Create events with a ticket price to see revenue</p>
          </div>
        )}
      </div>
    </div>
  );
}
