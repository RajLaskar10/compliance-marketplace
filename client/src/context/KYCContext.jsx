import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const KYCContext = createContext(null);

export function KYCProvider({ children }) {
  const { user } = useAuth();
  const [kycRecord, setKycRecord] = useState(null);

  useEffect(() => {
    if (user) {
      api.get('/api/kyc/me').then((r) => setKycRecord(r.data.kyc)).catch(() => {});
    } else {
      setKycRecord(null);
    }
  }, [user]);

  function refresh() {
    api.get('/api/kyc/me').then((r) => setKycRecord(r.data.kyc)).catch(() => {});
  }

  return (
    <KYCContext.Provider value={{ kycRecord, refresh }}>
      {children}
    </KYCContext.Provider>
  );
}

export function useKYC() {
  return useContext(KYCContext);
}
