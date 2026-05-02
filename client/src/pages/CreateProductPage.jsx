import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function CreateProductPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', price: '', stock: '' });
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    try {
      await api.post('/api/products', { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) || 0 });
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create product');
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">List a Product</h1>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="label">Title</label>
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
        <div><label className="label">Description</label>
          <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div><label className="label">Price ($)</label>
          <input className="input" type="number" step="0.01" min="0.01" value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
        <div><label className="label">Stock</label>
          <input className="input" type="number" min="0" value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
        <button className="btn-primary w-full" type="submit">List Product</button>
      </form>
    </div>
  );
}
