import { useEffect, useState } from 'react';
import api from '../utils/api';

export default function AdminFlagsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api.get('/api/admin/flags').then((r) => setTransactions(r.data.transactions)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function resolve(txnId, resolution) {
    try {
      await api.patch(`/api/admin/flags/${txnId}/resolve`, { resolution });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  }

  if (loading) return <div className="text-center mt-20 text-gray-400">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Flag Review Queue</h1>
      {transactions.length === 0 && <p className="text-gray-500">No flagged transactions.</p>}
      <div className="space-y-4">
        {transactions.map((t) => (
          <div key={t.id} className="bg-white rounded-lg shadow p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-800">{t.product_title}</p>
                <p className="text-sm text-gray-500">{t.buyer_email} → {t.seller_email}</p>
                <p className="text-xs text-gray-400 mt-1">IP: {t.buyer_ip || '—'} · {new Date(t.created_at).toLocaleString()}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {t.flags.map((f) => (
                    <span key={f.id} className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">{f.flag_rule}</span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-700 text-lg">${parseFloat(t.amount).toLocaleString()}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => resolve(t.id, 'approved')}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">Approve</button>
                  <button onClick={() => resolve(t.id, 'rejected')}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">Reject</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
