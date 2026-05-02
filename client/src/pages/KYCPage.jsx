import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useKYC } from '../context/KYCContext';

export default function KYCPage() {
  const { user, setUser } = useAuth();
  const { kycRecord, refresh } = useKYC();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', date_of_birth: '' });
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  if (user?.kyc_status === 'approved') {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <p className="text-green-600 font-semibold text-lg">KYC Verified ✓</p>
        <button className="btn-primary mt-4" onClick={() => navigate('/products')}>Browse Products</button>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setStatus('Uploading document…');
    try {
      const { data: presignData } = await api.post('/api/kyc/presign', {
        filename: file.name, contentType: file.type,
      });
      await fetch(presignData.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });

      setStatus('Submitting KYC…');
      const { data } = await api.post('/api/kyc/submit', {
        full_name: form.full_name,
        date_of_birth: form.date_of_birth,
        document_s3_key: presignData.key,
      });

      setStatus('');
      setUser((u) => ({ ...u, kyc_status: data.status }));
      refresh();
      if (data.status === 'approved') navigate('/products');
    } catch (err) {
      setStatus('');
      setError(err.response?.data?.error || 'Submission failed');
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-2 text-gray-900">KYC Verification</h1>
      {kycRecord?.status === 'rejected' && (
        <div className="bg-red-50 border border-red-300 rounded p-3 mb-4 text-sm text-red-700">
          Previous submission rejected: {kycRecord.rejection_reason}
        </div>
      )}
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {status && <p className="text-blue-600 text-sm mb-4">{status}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input className="input" placeholder="First Last" value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        </div>
        <div>
          <label className="label">Date of Birth</label>
          <input className="input" type="date" value={form.date_of_birth}
            onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} required />
        </div>
        <div>
          <label className="label">Identity Document (PDF or image)</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" required
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>
        <button className="btn-primary w-full" type="submit" disabled={!!status}>
          {status || 'Submit KYC'}
        </button>
      </form>
    </div>
  );
}
