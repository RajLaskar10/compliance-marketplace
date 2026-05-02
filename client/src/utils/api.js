import axios from 'axios';

const api = axios.create({
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const is401 = err.response?.status === 401;
    const isAuthCheck = url.includes('/api/auth/me');
    const onAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';
    if (is401 && !isAuthCheck && !onAuthPage) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
