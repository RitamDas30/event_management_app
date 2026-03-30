import { useState } from "react";
import toast from "react-hot-toast";
import { Tags, Plus, X, Edit2, Check } from "lucide-react";

// Categories are currently hardcoded in the Event model enum.
// This page manages them locally for now — in a future phase,
// these would be stored in a database collection.
const defaultCategories = [
  { id: 1, name: "Technical", color: "#10B981", icon: "💻", active: true },
  { id: 2, name: "Cultural", color: "#F59E0B", icon: "🎭", active: true },
  { id: 3, name: "Sports", color: "#EF4444", icon: "🏆", active: true },
  { id: 4, name: "Academic", color: "#6366F1", icon: "📚", active: true },
  { id: 5, name: "Social", color: "#EC4899", icon: "🎉", active: true },
];

export default function AdminCategories() {
  const [categories, setCategories] = useState(defaultCategories);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const addCategory = () => {
    if (!newName.trim()) return toast.error("Category name required");
    if (categories.find((c) => c.name.toLowerCase() === newName.trim().toLowerCase())) {
      return toast.error("Category already exists");
    }
    setCategories([
      ...categories,
      { id: Date.now(), name: newName.trim(), color: "#6B7280", icon: newIcon || "📌", active: true },
    ]);
    setNewName("");
    setNewIcon("");
    toast.success("Category added (local only — add to Event model enum for backend)");
  };

  const toggleActive = (id) => {
    setCategories(categories.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
  };

  const saveEdit = (id) => {
    if (!editName.trim()) return;
    setCategories(categories.map((c) => (c.id === id ? { ...c, name: editName.trim() } : c)));
    setEditingId(null);
    toast.success("Updated (local only)");
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Category Management</h1>

      {/* Add New */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" /> Add Category
        </h2>
        <div className="flex gap-2">
          <input type="text" value={newIcon} onChange={(e) => setNewIcon(e.target.value)} placeholder="Icon" className="w-16 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-center" />
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Category name" className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none" onKeyDown={(e) => e.key === "Enter" && addCategory()} />
          <button onClick={addCategory} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Add</button>
        </div>
        <p className="text-xs text-amber-600 mt-2">Note: To use new categories in events, also update the enum in Event model backend.</p>
      </div>

      {/* Category List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-3 bg-gray-50 border-b">
          <h2 className="text-sm font-semibold text-gray-600">Active Categories ({categories.filter((c) => c.active).length})</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {categories.map((cat) => (
            <div key={cat.id} className={`flex items-center justify-between px-6 py-3 ${!cat.active ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{cat.icon}</span>
                {editingId === cat.id ? (
                  <div className="flex items-center gap-2">
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="px-2 py-1 border rounded text-sm" autoFocus onKeyDown={(e) => e.key === "Enter" && saveEdit(cat.id)} />
                    <button onClick={() => saveEdit(cat.id)} className="text-green-600"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <span className="font-medium text-gray-900">{cat.name}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditingId(cat.id); setEditName(cat.name); }} className="p-1.5 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => toggleActive(cat.id)} className={`px-3 py-1 rounded-full text-xs font-medium ${cat.active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                  {cat.active ? "Active" : "Inactive"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
