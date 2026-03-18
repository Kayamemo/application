import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import Badge from '../../components/ui/Badge';
import { format } from 'date-fns';

export default function AdminOrders() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status, page],
    queryFn: () => adminAPI.orders({ status, page, limit: 20 }).then((r) => r.data),
    keepPreviousData: true,
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Orders</h1>

      <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input w-40 text-sm mb-4">
        <option value="">All statuses</option>
        {['PENDING','ACTIVE','DELIVERED','COMPLETED','DISPUTED','CANCELLED','REFUNDED'].map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Service</th>
              <th className="px-4 py-3 text-left">Buyer</th>
              <th className="px-4 py-3 text-left">Seller</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6}><div className="h-4 bg-gray-200 rounded animate-pulse m-3" /></td></tr>
                ))
              : data?.orders?.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium max-w-xs truncate">{o.service?.title}</td>
                    <td className="px-4 py-3 text-gray-600">{o.buyer?.name}</td>
                    <td className="px-4 py-3 text-gray-600">{o.seller?.name}</td>
                    <td className="px-4 py-3 font-medium">${parseFloat(o.amount).toFixed(2)}</td>
                    <td className="px-4 py-3"><Badge label={o.status} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{format(new Date(o.createdAt), 'MMM d, yyyy')}</td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-1 disabled:opacity-40">← Prev</button>
        <button onClick={() => setPage((p) => p + 1)} disabled={!data?.orders?.length || data.orders.length < 20} className="btn-secondary text-sm py-1 disabled:opacity-40">Next →</button>
      </div>
    </div>
  );
}
