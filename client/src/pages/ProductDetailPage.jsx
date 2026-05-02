import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    api.get(`/api/products/${id}`).then((r) => setProduct(r.data.product)).catch(() => navigate('/products'));
  }, [id]);

  async function handleBuy() {
    if (!user) return navigate('/login');
    setBuying(true); setError(''); setResult(null);
    try {
      const { data } = await api.post('/api/transactions', { product_id: id });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Purchase failed');
    } finally {
      setBuying(false);
    }
  }

  if (!product) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline mb-4">← Back</button>
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
        <p className="text-gray-600 mt-2">{product.description}</p>
        <p className="text-3xl font-bold text-blue-700 mt-4">${parseFloat(product.price).toLocaleString()}</p>
        <p className="text-sm text-gray-400 mt-1">{product.stock} in stock · by {product.seller_email}</p>

        {result && (
          <div className={`mt-4 p-4 rounded ${result.transaction.status === 'flagged' ? 'bg-yellow-50 border border-yellow-300' : 'bg-green-50 border border-green-300'}`}>
            {result.transaction.status === 'completed' ? (
              <p className="text-green-700 font-medium">Purchase complete!</p>
            ) : (
              <>
                <p className="text-yellow-700 font-medium">Purchase flagged for review</p>
                <p className="text-yellow-600 text-sm mt-1">Flags: {result.flags.join(', ')}</p>
              </>
            )}
          </div>
        )}

        {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}

        {user?.role === 'buyer' && !result && (
          <button className="btn-primary mt-6 w-full" onClick={handleBuy} disabled={buying}>
            {buying ? 'Processing…' : 'Buy Now'}
          </button>
        )}
      </div>
    </div>
  );
}
