import { useEffect, useState } from 'react';
import api from '../utils/api';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ action: '', user_id: '' });
  const [loading, setLoading] = useState(true);

  function load() {
    const params = new URLSearchParams();
    if (filters.action) params.set('action', filters.action);
    if (filters.user_id) params.set('user_id', filters.user_id);
    params.set('limit', '50');
    setLoading(true);
    api.get(`/api/admin/audit?${params}`).then((r) => setLogs(r.data.logs)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Audit Log</h1>
      <div className="flex gap-3 mb-6">
        <input className="input max-w-xs" placeholder="Filter by action…" value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })} />
        <input className="input max-w-xs" placeholder="Filter by user ID…" value={filters.user_id}
          onChange={(e) => setFilters({ ...filters, user_id: e.target.value })} />
        <button className="btn-primary" onClick={load}>Search</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-400 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                <td className="px-4 py-2 font-mono text-xs font-medium text-gray-700">{l.action}</td>
                <td className="px-4 py-2 text-gray-500">{l.user_email || '—'}</td>
                <td className="px-4 py-2 text-gray-400 font-mono text-xs">{l.target_id ? l.target_id.slice(0, 8) + '…' : '—'}</td>
                <td className="px-4 py-2 text-gray-400">{l.ip_address || '—'}</td>
                <td className="px-4 py-2 text-gray-400 text-xs">{l.metadata ? JSON.stringify(l.metadata) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && logs.length === 0 && <p className="text-center text-gray-400 py-8">No logs found.</p>}
      </div>
    </div>
  );
}
