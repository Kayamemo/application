import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, role, page],
    queryFn: () => adminAPI.users({ search, role, page, limit: 20 }).then((r) => r.data),
    keepPreviousData: true,
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminAPI.stats().then((r) => r.data),
  });

  const banMutation = useMutation({
    mutationFn: ({ id, reason }) => adminAPI.banUser(id, reason),
    onSuccess: () => {
      toast.success('User banned');
      queryClient.invalidateQueries(['admin-users']);
    },
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Users</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.totalUsers },
            { label: 'Sellers', value: stats.totalSellers },
            { label: 'Buyers', value: stats.totalBuyers },
            { label: 'Active Subs', value: stats.activeSubscriptions },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name or email…"
          className="input max-w-xs text-sm"
        />
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="input w-32 text-sm">
          <option value="">All roles</option>
          <option value="BUYER">Buyers</option>
          <option value="SELLER">Sellers</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-left">Orders</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td></tr>
              ))
            ) : data?.users?.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar src={u.avatar} name={u.name} size="sm" />
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge label={u.role} variant={u.role === 'ADMIN' ? 'blue' : u.role === 'SELLER' ? 'green' : 'gray'} />
                  {u.sellerProfile && <Badge label={u.sellerProfile.subscriptionStatus} />}
                </td>
                <td className="px-4 py-3 text-gray-500">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                <td className="px-4 py-3 text-gray-600">{u._count?.buyerOrders + u._count?.sellerOrders}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => {
                      const reason = prompt(`Ban reason for ${u.name}:`);
                      if (reason) banMutation.mutate({ id: u.id, reason });
                    }}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Ban
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data?.total > 20 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-1 disabled:opacity-40">← Prev</button>
          <button onClick={() => setPage((p) => p + 1)} disabled={data?.users?.length < 20} className="btn-secondary text-sm py-1 disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}
