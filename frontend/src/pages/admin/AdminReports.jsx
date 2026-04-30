import { useState, useEffect } from "react";
import api from "../../api/axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, CalendarDays, Ticket, Star, TrendingUp } from "lucide-react";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function AdminReports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/stats");
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface-50 dark:bg-surface-900 rounded-xl border p-5 animate-pulse">
              <div className="h-4 bg-surface-200 dark:bg-surface-800 rounded w-24 mb-3"></div>
              <div className="h-8 bg-surface-200 dark:bg-surface-800 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return <p className="text-center text-surface-500">Failed to load reports</p>;

  const categoryData = Object.entries(stats.eventsByCategory || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const roleData = Object.entries(stats.usersByRole || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count: value,
  }));

  const statCards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400" },
    { title: "Total Events", value: stats.totalEvents, icon: CalendarDays, color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    { title: "Total Registrations", value: stats.totalRegistrations, icon: Ticket, color: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400" },
    { title: "This Week", value: stats.recentRegistrations, icon: TrendingUp, color: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    { title: "Total Reviews", value: stats.totalReviews, icon: Star, color: "bg-pink-50 text-pink-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-surface-950 dark:text-surface-50 mb-6">Platform Reports</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
              <p className="text-2xl font-bold text-surface-950 dark:text-surface-50">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Users by Role */}
        <div className="bg-surface-50 dark:bg-surface-900 rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-surface-950 dark:text-surface-50 mb-4">Users by Role</h3>
          {roleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={roleData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-surface-500 py-8">No data</p>
          )}
        </div>

        {/* Events by Category */}
        <div className="bg-surface-50 dark:bg-surface-900 rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-surface-950 dark:text-surface-50 mb-4">Events by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
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
          ) : (
            <p className="text-center text-surface-500 py-8">No data</p>
          )}
        </div>
      </div>
    </div>
  );
}
