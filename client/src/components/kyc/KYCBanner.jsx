import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function KYCBanner() {
  const { user } = useAuth();
  if (!user || user.kyc_status === 'approved') return null;

  const messages = {
    not_submitted: { text: 'Complete KYC verification to start transacting.', color: 'bg-yellow-50 border-yellow-400 text-yellow-800' },
    pending: { text: 'Your KYC is under review.', color: 'bg-blue-50 border-blue-400 text-blue-800' },
    rejected: { text: 'Your KYC was rejected. Please resubmit.', color: 'bg-red-50 border-red-400 text-red-800' },
  };
  const m = messages[user.kyc_status];
  return (
    <div className={`border-l-4 p-3 mb-4 text-sm ${m.color}`}>
      {m.text}{' '}
      {user.kyc_status !== 'pending' && <Link to="/kyc" className="underline font-medium">Go to KYC</Link>}
    </div>
  );
}
