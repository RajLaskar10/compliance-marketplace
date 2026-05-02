import { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-700',
  flagged: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
  pending: 'bg-gray-100 text-gray-600',
};

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/transactions').then((r) => setTransactions(r.data.transactions)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center mt-20 text-gray-400">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">My Transactions</h1>
      {transactions.length === 0 && <p className="text-gray-500">No transactions yet.</p>}
      <div className="space-y-4">
        {transactions.map((t) => (
          <div key={t.id} className="bg-white rounded-lg shadow p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-800">{t.product_title}</p>
                <p className="text-sm text-gray-500">
                  {user.id === t.buyer_id ? `Sold by ${t.seller_email}` : `Bought by ${t.buyer_email}`}
                </p>
                {t.flags?.length > 0 && (
                  <p className="text-xs text-yellow-600 mt-1">Flags: {t.flags.join(', ')}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-700">${parseFloat(t.amount).toLocaleString()}</p>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${STATUS_COLORS[t.status]}`}>
                  {t.status}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{new Date(t.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
