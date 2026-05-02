import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import KYCBanner from '../components/kyc/KYCBanner';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/products').then((r) => setProducts(r.data.products)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center mt-20 text-gray-400">Loading products…</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <KYCBanner />
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Marketplace</h1>
      {products.length === 0 && <p className="text-gray-500">No products listed yet.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <Link to={`/products/${p.id}`} key={p.id}
            className="bg-white rounded-lg shadow hover:shadow-md transition p-5 flex flex-col">
            <h2 className="font-semibold text-gray-800 text-lg">{p.title}</h2>
            <p className="text-gray-500 text-sm mt-1 flex-1">{p.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-blue-700 font-bold text-xl">${parseFloat(p.price).toLocaleString()}</span>
              <span className="text-xs text-gray-400">{p.stock} in stock</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">by {p.seller_email}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
