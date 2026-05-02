import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', role: 'buyer' });
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await register(form.email, form.password, form.role);
      navigate('/kyc');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Create Account</h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="input" type="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="input" type="password" placeholder="Password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <select className="input" value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
          </select>
          <button className="btn-primary w-full" type="submit">Create Account</button>
        </form>
        <p className="text-sm text-gray-500 mt-4">Have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link></p>
      </div>
    </div>
  );
}
