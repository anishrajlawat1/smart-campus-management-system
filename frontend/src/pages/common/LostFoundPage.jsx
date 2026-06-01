import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  MapPin,
  User,
  Phone,
  CalendarDays,
  ImagePlus,
  Trash2,
  CheckCircle2,
  PackageOpen,
  RefreshCw,
  Pencil,
  X,
  Building2,
  Hand,
} from 'lucide-react';
import api from '../../api';

import AdminLayout from '../admin/AdminLayout';
import FacultyLayout from '../faculty/FacultyLayout';
import StudentLayout from '../student/StudentLayout';

const BACKEND_URL = 'http://localhost:5000';

const LostFoundPage = ({ role = 'student' }) => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState('');

  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    item_type: 'lost',
    title: '',
    description: '',
    location: '',
    contact_info: '',
    category: '',
    collection_point: 'Student Services Desk / Reception',
    status: 'open',
    image: null,
  });

  const Layout =
    role === 'admin'
      ? AdminLayout
      : role === 'faculty'
        ? FacultyLayout
        : StudentLayout;

  const pageLabel =
    role === 'admin'
      ? 'Admin Module'
      : role === 'faculty'
        ? 'Faculty Module'
        : 'Student Module';

  const fetchItems = async () => {
    setLoading(true);

    try {
      const res = await api.get('/lost-found');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch lost/found items:', error);
      alert(
        error.response?.data?.message || 'Failed to fetch lost and found items'
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${BACKEND_URL}${path}`;
  };

  const canEditItem = (item) => {
    if (role === 'admin') return true;

    return (
      Number(item.reported_by) === Number(currentUser?.id) &&
      item.status !== 'resolved'
    );
  };

  const canDeleteItem = () => role === 'admin';

  const canMarkReturned = () => role === 'admin';

  const canRequestClaim = (item) => {
    return (
      role !== 'admin' &&
      item.item_type === 'found' &&
      item.status !== 'resolved' &&
      Number(item.reported_by) !== Number(currentUser?.id)
    );
  };

  const resetForm = () => {
    setForm({
      item_type: 'lost',
      title: '',
      description: '',
      location: '',
      contact_info: '',
      category: '',
      collection_point: 'Student Services Desk / Reception',
      status: 'open',
      image: null,
    });

    setPreview('');
    setEditing(null);
  };

  const resetFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setCategoryFilter('all');
    setSearchTerm('');
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'image') {
      const file = files?.[0] || null;

      setForm((prev) => ({
        ...prev,
        image: file,
      }));

      if (file) {
        setPreview(URL.createObjectURL(file));
      } else {
        setPreview('');
      }

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const buildFormData = () => {
    const formData = new FormData();

    formData.append('item_type', form.item_type);
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('location', form.location);
    formData.append('contact_info', form.contact_info);
    formData.append('category', form.category);
    formData.append('collection_point', form.collection_point);
    formData.append('status', form.status);

    if (form.image) {
      formData.append('image', form.image);
    }

    return formData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.location) {
      alert('Title and location are required');
      return;
    }

    try {
      const formData = buildFormData();

      if (editing) {
        await api.put(`/lost-found/${editing.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        await api.post('/lost-found', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      resetForm();
      fetchItems();
    } catch (error) {
      console.error('Failed to save item:', error);
      alert(error.response?.data?.message || 'Failed to save item');
    }
  };

  const handleEdit = (item) => {
    if (!canEditItem(item)) {
      alert('You can only edit your own open item report');
      return;
    }

    setEditing(item);

    setForm({
      item_type: item.item_type || 'lost',
      title: item.title || '',
      description: item.description || '',
      location: item.location || '',
      contact_info: item.contact_info || '',
      category: item.category || '',
      collection_point:
        item.collection_point || 'Student Services Desk / Reception',
      status: item.status === 'resolved' ? 'resolved' : 'open',
      image: null,
    });

    setPreview(getImageUrl(item.image_path || item.image_url));

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Delete this lost/found item?');
    if (!confirmed) return;

    try {
      await api.delete(`/lost-found/${id}`);
      fetchItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert(error.response?.data?.message || 'Failed to delete item');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/lost-found/${id}/status`, { status });
      fetchItems();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const requestClaim = async (item) => {
    const confirmed = window.confirm(
      `Request claim for "${item.title}"? Admin will verify before returning it.`
    );

    if (!confirmed) return;

    try {
      const res = await api.post(`/lost-found/${item.id}/request-claim`);
      alert(res.data?.message || 'Claim request sent to admin');
    } catch (error) {
      console.error('Failed to request claim:', error);
      alert(error.response?.data?.message || 'Failed to request claim');
    }
  };

  const categoryOptions = useMemo(() => {
    return [
      ...new Set(
        items
          .map((item) => String(item.category || '').trim())
          .filter(Boolean)
      ),
    ].sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesType =
        typeFilter === 'all' || String(item.item_type || '') === typeFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        String(item.status || 'open') === statusFilter;

      const matchesCategory =
        categoryFilter === 'all' ||
        String(item.category || '') === categoryFilter;

      const searchableText = `
        ${item.title || ''}
        ${item.description || ''}
        ${item.location || ''}
        ${item.category || ''}
        ${item.collection_point || ''}
        ${item.reported_by_name || ''}
        ${item.reported_by_email || ''}
        ${item.contact_info || ''}
        ${item.item_type || ''}
        ${item.status || ''}
      `.toLowerCase();

      const matchesSearch = searchableText.includes(
        searchTerm.toLowerCase().trim()
      );

      return matchesType && matchesStatus && matchesCategory && matchesSearch;
    });
  }, [items, typeFilter, statusFilter, categoryFilter, searchTerm]);

  const totalItems = items.length;
  const lostItems = items.filter((item) => item.item_type === 'lost').length;
  const foundItems = items.filter((item) => item.item_type === 'found').length;
  const openItems = items.filter((item) => item.status !== 'resolved').length;
  const returnedItems = items.filter(
    (item) => item.status === 'resolved'
  ).length;

  const stats = [
    {
      label: 'Total Items',
      value: totalItems,
      icon: PackageOpen,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
      onClick: () => {
        setTypeFilter('all');
        setStatusFilter('all');
      },
    },
    {
      label: 'Lost Items',
      value: lostItems,
      icon: Search,
      color: 'text-rose-600',
      bg: 'bg-rose-100',
      onClick: () => setTypeFilter('lost'),
    },
    {
      label: 'Found Items',
      value: foundItems,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      onClick: () => setTypeFilter('found'),
    },
    {
      label: 'Open Items',
      value: openItems,
      icon: PackageOpen,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      onClick: () => setStatusFilter('open'),
    },
    {
      label: 'Returned',
      value: returnedItems,
      icon: CheckCircle2,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
      onClick: () => setStatusFilter('resolved'),
    },
  ];

  const getStatusClass = (status) => {
    if (status === 'resolved') {
      return 'bg-emerald-100 text-emerald-600';
    }

    return 'bg-indigo-100 text-indigo-600';
  };

  const getStatusLabel = (status) => {
    if (status === 'resolved') return 'returned';
    return 'open';
  };

  const getTypeClass = (type) => {
    if (type === 'lost') {
      return 'bg-rose-100 text-rose-600';
    }

    return 'bg-emerald-100 text-emerald-600';
  };

  const hasActiveFilters =
    typeFilter !== 'all' ||
    statusFilter !== 'all' ||
    categoryFilter !== 'all' ||
    searchTerm;

  return (
    <Layout
      pageLabel={pageLabel}
      title="Lost & Found"
      subtitle="Report, browse, search, and request verified claims for campus items."
    >
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-10">
        {stats.map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={stat.onClick}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all text-left"
          >
            <div
              className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-5`}
            >
              <stat.icon size={24} />
            </div>

            <p className="text-slate-500 text-sm font-bold">{stat.label}</p>

            <h3 className="text-3xl font-black text-slate-800 mt-1">
              {stat.value}
            </h3>
          </button>
        ))}
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              {editing ? 'Edit Item' : 'Report Lost / Found Item'}
            </h2>

            <p className="text-sm text-slate-500 font-medium mt-1">
              Upload a photo directly from your device and mention where the
              item can be collected.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchItems}
            disabled={loading}
            className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={18} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 xl:grid-cols-3 gap-6"
        >
          <div className="xl:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                name="item_type"
                value={form.item_type}
                onChange={handleInputChange}
                className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="lost">Lost Item</option>
                <option value="found">Found Item</option>
              </select>

              <input
                name="title"
                type="text"
                placeholder="Item title e.g. Black Charger"
                value={form.title}
                onChange={handleInputChange}
                className="md:col-span-2 w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                required
              />
            </div>

            <textarea
              name="description"
              placeholder="Describe the item clearly..."
              rows="4"
              value={form.description}
              onChange={handleInputChange}
              className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium resize-none"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="location"
                type="text"
                placeholder="Lost/found location e.g. Library"
                value={form.location}
                onChange={handleInputChange}
                className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                required
              />

              <input
                name="collection_point"
                type="text"
                placeholder="Collect from e.g. Student Services Desk"
                value={form.collection_point}
                onChange={handleInputChange}
                className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />

              <input
                name="category"
                type="text"
                placeholder="Category e.g. Electronics"
                value={form.category}
                onChange={handleInputChange}
                className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />

              <input
                name="contact_info"
                type="text"
                placeholder="Contact email/phone (optional)"
                value={form.contact_info}
                onChange={handleInputChange}
                className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            {editing && role === 'admin' && (
              <select
                name="status"
                value={form.status}
                onChange={handleInputChange}
                className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="open">Open</option>
                <option value="resolved">Returned</option>
              </select>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
              >
                <Plus size={18} />
                {editing ? 'Update Item' : 'Report Item'}
              </button>

              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition flex items-center gap-2"
                >
                  <X size={18} />
                  Cancel Edit
                </button>
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-3xl border border-slate-100 p-5">
            <label className="block cursor-pointer">
              <input
                name="image"
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />

              <div className="h-64 rounded-3xl bg-white border border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden hover:border-indigo-400 transition">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                      <ImagePlus size={25} />
                    </div>

                    <p className="font-black text-slate-800">
                      Upload Item Photo
                    </p>

                    <p className="text-sm text-slate-500 font-medium mt-1 text-center px-4">
                      JPG, PNG, GIF or WEBP up to 5MB
                    </p>
                  </>
                )}
              </div>
            </label>

            {preview && (
              <button
                type="button"
                onClick={() => {
                  setPreview('');
                  setForm((prev) => ({
                    ...prev,
                    image: null,
                  }));
                }}
                className="w-full mt-3 px-4 py-3 rounded-2xl bg-white text-slate-600 font-bold hover:bg-slate-100 transition"
              >
                Remove Selected Image
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              Smart Item Filters
            </h2>

            <p className="text-sm text-slate-500 font-medium mt-1">
              {filteredItems.length} item
              {filteredItems.length !== 1 ? 's' : ''} shown
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 w-full xl:w-auto">
            <div className="relative xl:col-span-2">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search item, location, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 font-black"
                >
                  ×
                </button>
              )}
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">All Types</option>
              <option value="lost">Lost Only</option>
              <option value="found">Found Only</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">All Status</option>
              <option value="open">Open Only</option>
              <option value="resolved">Returned Only</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">All Categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 px-4 py-2 rounded-2xl bg-slate-100 text-slate-600 text-sm font-black hover:bg-slate-200 flex items-center gap-2"
          >
            <X size={15} />
            Clear Filters
          </button>
        )}
      </section>

      <section>
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const imageSrc = getImageUrl(item.image_path || item.image_url);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-indigo-50 hover:border-indigo-100 transition"
                >
                  <div className="h-52 bg-slate-100">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <PackageOpen size={36} />

                        <p className="font-bold mt-2">No image uploaded</p>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase ${getTypeClass(
                          item.item_type
                        )}`}
                      >
                        {item.item_type}
                      </span>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>

                      {item.category && (
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-black">
                          {item.category}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-slate-900">
                      {item.title}
                    </h3>

                    <p className="text-sm text-slate-500 font-medium mt-2 line-clamp-3">
                      {item.description || 'No description added.'}
                    </p>

                    <div className="space-y-2 mt-5 text-sm text-slate-500 font-medium">
                      <p className="flex items-center gap-2">
                        <MapPin size={16} />
                        Found/Lost at: {item.location}
                      </p>

                      <p className="flex items-center gap-2">
                        <Building2 size={16} />
                        Collect from:{' '}
                        {item.collection_point ||
                          'Student Services Desk / Reception'}
                      </p>

                      <p className="flex items-center gap-2">
                        <User size={16} />
                        {item.reported_by_name || 'Unknown reporter'}
                      </p>

                      {item.contact_info && (
                        <p className="flex items-center gap-2">
                          <Phone size={16} />
                          {item.contact_info}
                        </p>
                      )}

                      <p className="flex items-center gap-2">
                        <CalendarDays size={16} />
                        {item.date_reported
                          ? new Date(item.date_reported).toLocaleDateString()
                          : 'No date'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t border-slate-100">
                      <div className="flex gap-2">
                        {canEditItem(item) && (
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition flex items-center justify-center"
                          >
                            <Pencil size={16} />
                          </button>
                        )}

                        {canDeleteItem() && (
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition flex items-center justify-center"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {canRequestClaim(item) && (
                          <button
                            type="button"
                            onClick={() => requestClaim(item)}
                            className="px-3 py-2 rounded-2xl bg-indigo-50 text-indigo-600 text-xs font-black hover:bg-indigo-100 transition flex items-center gap-1"
                          >
                            <Hand size={14} />
                            This is Mine
                          </button>
                        )}

                        {canMarkReturned() && item.status !== 'resolved' && (
                          <button
                            type="button"
                            onClick={() => updateStatus(item.id, 'resolved')}
                            className="px-3 py-2 rounded-2xl bg-emerald-50 text-emerald-600 text-xs font-black hover:bg-emerald-100 transition"
                          >
                            Mark Returned
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
              <PackageOpen size={30} />
            </div>

            <h3 className="text-xl font-black text-slate-900">
              {hasActiveFilters
                ? 'No matching items found.'
                : 'No lost or found items yet.'}
            </h3>

            <p className="text-slate-500 font-medium mt-2">
              {hasActiveFilters
                ? 'Try changing the item type, status, category, or search term.'
                : 'Report an item using the form above.'}
            </p>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default LostFoundPage;