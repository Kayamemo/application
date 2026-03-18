import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { servicesAPI, nichesAPI } from '../../services/api';
import BackButton from '../../components/ui/BackButton';
import toast from 'react-hot-toast';

async function geocode(query) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (!data[0]) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export default function CreateService() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    nicheId: '',
    basePrice: '',
    deliveryDays: '3',
    location: '',
    isRemote: false,
    tags: '',
  });

  const { data: niches = [] } = useQuery({
    queryKey: ['niches'],
    queryFn: () => nichesAPI.list().then((r) => r.data),
  });

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nicheId) { toast.error('Please select a category'); return; }

    setSubmitting(true);
    try {
      const locationStr = form.location.trim();
      let coords = {};
      if (locationStr) {
        const geo = await geocode(locationStr);
        if (geo) coords = { lat: geo.lat, lng: geo.lng };
        else toast('Could not geocode location — service will not appear in map searches.', { icon: '⚠️' });
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        nicheId: form.nicheId,
        basePrice: parseFloat(form.basePrice),
        deliveryDays: parseInt(form.deliveryDays, 10),
        location: locationStr || undefined,
        ...coords,
        isRemote: form.isRemote,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
      };
      const res = await servicesAPI.create(payload);
      toast.success('Service created!');
      navigate(`/services/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not create service');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <BackButton />
        <div>
          <h1 className="text-2xl font-black text-gray-900">Create a new service</h1>
          <p className="text-sm text-gray-500 mt-0.5">Fill in the details below to list your service.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
          <input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Professional Lawn Care & Garden Maintenance"
            className="input w-full"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Describe what you offer, your experience, and what buyers can expect…"
            rows={5}
            className="input w-full resize-none"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
          <select
            value={form.nicheId}
            onChange={(e) => set('nicheId', e.target.value)}
            className="input w-full"
            required
          >
            <option value="">Select a category…</option>
            {niches.map((n) => (
              <option key={n.id} value={n.id}>{n.icon} {n.name}</option>
            ))}
          </select>
        </div>

        {/* Price + Delivery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Starting price ($) *</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={form.basePrice}
              onChange={(e) => set('basePrice', e.target.value)}
              placeholder="50"
              className="input w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery (days) *</label>
            <input
              type="number"
              min="1"
              value={form.deliveryDays}
              onChange={(e) => set('deliveryDays', e.target.value)}
              className="input w-full"
              required
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
          <input
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="e.g. Austin, TX"
            className="input w-full"
          />
        </div>

        {/* Remote */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isRemote"
            checked={form.isRemote}
            onChange={(e) => set('isRemote', e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="isRemote" className="text-sm text-gray-700">This service can be done remotely</label>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Tags <span className="font-normal text-gray-400">(optional, comma-separated)</span></label>
          <input
            value={form.tags}
            onChange={(e) => set('tags', e.target.value)}
            placeholder="e.g. lawn, mowing, garden"
            className="input w-full"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Creating…' : 'Create service'}
          </button>
          <button type="button" onClick={() => navigate('/dashboard/seller')} className="btn-secondary px-5">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
