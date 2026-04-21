import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Package,
  MapPin,
  User,
  Phone,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import api from '../../api';

const LostFoundManagement = () => {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    item_type: 'lost',
    title: '',
    description: '',
    location: '',
    reported_by: '',
    contact_info: '',
    date_reported: '',
    status: 'open',
  });

  const fetchItems = async () => {
    try {
      const res = await api.get('/lost-found');
      setItems(res.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch items');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch users');
    }
  };

  useEffect(() => {
    fetchItems();
    fetchUsers();
  }, []);

  const resetForm = () => {
    setForm({
      item_type: 'lost',
      title: '',
      description: '',
      location: '',
      reported_by: '',
      contact_info: '',
      date_reported: '',
      status: 'open',
    });
    setEditing(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editing) {
        await api.put(`/lost-found/${editing.id}`, form);
      } else {
        await api.post('/lost-found', form);
      }

      resetForm();
      fetchItems();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (item) => {
    setEditing(item);
    setForm({
      item_type: item.item_type,
      title: item.title,
      description: item.description || '',
      location: item.location,
      reported_by: String(item.reported_by),
      contact_info: item.contact_info || '',
      date_reported: item.date_reported?.split('T')[0] || item.date_reported,
      status: item.status,
    });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Delete this item?');
    if (!confirmDelete) return;

    try {
      await api.delete(`/lost-found/${id}`);
      fetchItems();
    } catch (error) {
      alert(error.response?.data?.message || 'Delete failed');
    }
  };

  const totalItems = items.length;
  const lostItems = items.filter((i) => i.item_type === 'lost').length;
  const foundItems = items.filter((i) => i.item_type === 'found').length;
  const resolvedItems = items.filter((i) => i.status === 'resolved').length;

  const summaryCards = [
    {
      label: 'Total Items',
      value: totalItems,
      icon: Package,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      label: 'Lost Items',
      value: lostItems,
      icon: Search,
      color: 'text-rose-600',
      bg: 'bg-rose-100',
    },
    {
      label: 'Found Items',
      value: foundItems,
      icon: Package,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Resolved',
      value: resolvedItems,
      icon: User,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
    },
  ];

  return (
    <AdminLayout
      pageLabel="Admin Module"
      title="Lost & Found"
      subtitle="Manage reported lost and found items across the campus."
    >
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
          >
            <div className={`w-14 h-14 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-5`}>
              <card.icon size={24} />
            </div>
            <p className="text-slate-500 text-sm font-bold">{card.label}</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{card.value}</h3>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-800">
            {editing ? 'Edit Item' : 'Report Item'}
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Create and manage lost or found item reports.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              value={form.item_type}
              onChange={(e) => setForm({ ...form, item_type: e.target.value })}
            >
              <option value="lost">Lost Item</option>
              <option value="found">Found Item</option>
            </select>

            <input
              type="text"
              placeholder="Item Title"
              className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />

            <input
              type="text"
              placeholder="Location"
              className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
            />
          </div>

          <textarea
            placeholder="Description"
            rows="4"
            className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium resize-none"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              value={form.reported_by}
              onChange={(e) => setForm({ ...form, reported_by: e.target.value })}
              required
            >
              <option value="">Select Reporter</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Contact Info"
              className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              value={form.contact_info}
              onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
            />

            <input
              type="date"
              className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              value={form.date_reported}
              onChange={(e) => setForm({ ...form, date_reported: e.target.value })}
              required
            />

            <select
              className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="open">Open</option>
              <option value="claimed">Claimed</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
            >
              <Plus size={18} />
              {editing ? 'Update Item' : 'Create Item'}
            </button>

            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-all"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-800">Reported Items</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {items.length} item{items.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-300">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Item
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Type
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Location
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Reporter
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Date
                </th>
                <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  className={`border-t border-slate-100 hover:bg-slate-50 transition-all ${
                    index === 0 ? 'border-t-0' : ''
                  }`}
                >
                  <td className="px-6 py-5">
                    <div>
                      <p className="font-bold text-slate-800">{item.title}</p>
                      <p className="text-sm text-slate-500 font-medium mt-1 max-w-md truncate">
                        {item.description || 'No description'}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex px-3 py-2 rounded-2xl text-sm font-bold capitalize ${
                        item.item_type === 'lost'
                          ? 'bg-rose-100 text-rose-600'
                          : 'bg-emerald-100 text-emerald-600'
                      }`}
                    >
                      {item.item_type}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-slate-700 font-medium">{item.location}</td>

                  <td className="px-6 py-5">
                    <div>
                      <p className="font-bold text-slate-800">{item.reported_by_name}</p>
                      <p className="text-sm text-slate-500">{item.reported_by_email}</p>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex px-3 py-2 rounded-2xl text-sm font-bold capitalize ${
                        item.status === 'open'
                          ? 'bg-indigo-100 text-indigo-600'
                          : item.status === 'claimed'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-emerald-100 text-emerald-600'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-slate-500 font-medium">
                    {new Date(item.date_reported).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center text-slate-500 font-medium"
                  >
                    No items reported yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  );
};

export default LostFoundManagement;