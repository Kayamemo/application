import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminDisputes() {
  const [status, setStatus] = useState('OPEN');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-disputes', status],
    queryFn: () => adminAPI.disputes({ status }).then((r) => r.data),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolution, note }) => adminAPI.resolveDispute(id, { resolution, note }),
    onSuccess: () => {
      toast.success('Dispute resolved');
      queryClient.invalidateQueries(['admin-disputes']);
    },
    onError: () => toast.error('Failed to resolve dispute'),
  });

  const handleResolve = (id, resolution) => {
    const note = prompt(`Resolution note (in favor of ${resolution}):`);
    if (note !== null) resolveMutation.mutate({ id, resolution, note });
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Disputes</h1>

      <div className="flex gap-2 mb-4">
        {['OPEN','UNDER_REVIEW','RESOLVED_BUYER','RESOLVED_SELLER','CLOSED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${status === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading && <div className="text-center text-gray-400 py-8">Loading…</div>}
        {!isLoading && !data?.disputes?.length && (
          <div className="text-center text-gray-400 py-12">No {status.toLowerCase()} disputes</div>
        )}
        {data?.disputes?.map((d) => (
          <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm">{d.order?.service?.title}</h3>
                  <Badge label={d.status} />
                </div>
                <div className="text-xs text-gray-500 space-y-0.5">
                  <p>Buyer: {d.order?.buyer?.name} ({d.order?.buyer?.email})</p>
                  <p>Seller: {d.order?.seller?.name} ({d.order?.seller?.email})</p>
                  <p>Order amount: ${parseFloat(d.order?.amount || 0).toFixed(2)}</p>
                  <p>Opened: {format(new Date(d.createdAt), 'MMM d, yyyy HH:mm')}</p>
                </div>
                <div className="mt-2 bg-red-50 border border-red-100 rounded-lg p-2">
                  <p className="text-xs font-medium text-red-700 mb-1">Dispute reason:</p>
                  <p className="text-sm text-gray-700">{d.reason}</p>
                </div>
                {d.resolution && (
                  <div className="mt-2 bg-green-50 rounded-lg p-2">
                    <p className="text-xs font-medium text-green-700">Resolution:</p>
                    <p className="text-sm">{d.resolution}</p>
                  </div>
                )}
              </div>

              {d.status === 'OPEN' && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleResolve(d.id, 'buyer')}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Refund Buyer
                  </button>
                  <button
                    onClick={() => handleResolve(d.id, 'seller')}
                    className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Pay Seller
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
