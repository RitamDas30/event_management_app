import { useState, useEffect } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Search, Users, Shield, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

const roleBadge = {
  admin: "bg-red-100 text-red-700",
  organizer: "bg-purple-100 text-purple-700",
  student: "bg-blue-100 text-blue-700",
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 15 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await api.get("/admin/users", { params });
      setUsers(res.data.users);
      setTotalPages(res.data.pagination.pages);
      setTotal(res.data.pagination.total);
      setPage(p);
    } catch (err) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [search, roleFilter]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      fetchUsers(page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!confirm(`Delete user "${userName}" and all their data? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success("User deleted");
      fetchUsers(page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-600 mt-1">{total} total users</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="organizer">Organizers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Role</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Joined</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td colSpan={5} className="py-4 px-4"><div className="h-4 bg-gray-100 rounded animate-pulse"></div></td>
                  </tr>
                ))
              ) : users.length > 0 ? (
                users.map((u) => (
                  <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${roleBadge[u.role]}`}
                      >
                        <option value="student">Student</option>
                        <option value="organizer">Organizer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(u._id, u.name)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <button
              onClick={() => fetchUsers(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <button
              onClick={() => fetchUsers(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
