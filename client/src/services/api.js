// ============================================================
// Axios API Service
// - Attaches JWT access token to every request
// - Automatically refreshes expired tokens using the refresh cookie
// - All API calls are exported as named functions
// ============================================================
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  withCredentials: true, // Send cookies (refresh token)
});

// ── Request interceptor: attach access token ──────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: auto-refresh on 401 ─────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        const newToken = data.accessToken;
        localStorage.setItem('accessToken', newToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// ─── Users ─────────────────────────────────────────────────────
export const usersAPI = {
  getProfile: (id) => api.get(`/users/${id}`),
  updateMe: (data) => api.patch('/users/me', data),
  becomeSeller: () => api.post('/users/become-seller'),
  getNotifications: () => api.get('/users/me/notifications'),
  markNotificationsRead: () => api.patch('/users/me/notifications/read'),
};

// ─── Niches ────────────────────────────────────────────────────
export const nichesAPI = {
  list: () => api.get('/niches'),
  get: (slug) => api.get(`/niches/${slug}`),
  create: (data) => api.post('/niches', data),
  update: (id, data) => api.patch(`/niches/${id}`, data),
  delete: (id) => api.delete(`/niches/${id}`),
};

// ─── Services ──────────────────────────────────────────────────
export const servicesAPI = {
  search: (params) => api.get('/services', { params }),
  get: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.patch(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
  myServices: () => api.get('/services/seller/me'),
};

// ─── Orders ────────────────────────────────────────────────────
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  list: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  deliver: (id) => api.patch(`/orders/${id}/deliver`),
  complete: (id) => api.patch(`/orders/${id}/complete`),
  dispute: (id, data) => api.patch(`/orders/${id}/dispute`, data),
  cancel: (id) => api.patch(`/orders/${id}/cancel`),
};

// ─── Messages ──────────────────────────────────────────────────
export const messagesAPI = {
  conversations: () => api.get('/messages/conversations'),
  getConversation: (id, params) => api.get(`/messages/conversations/${id}`, { params }),
  startConversation: (data) => api.post('/messages/conversations', data),
};

// ─── Payments ──────────────────────────────────────────────────
export const paymentsAPI = {
  subscribe: (paymentMethodId) => api.post('/payments/subscribe', { paymentMethodId }),
  cancelSubscription: () => api.post('/payments/cancel-subscription'),
  getSubscription: () => api.get('/payments/subscription'),
  getBillingPortal: () => api.post('/payments/portal'),
  getEarnings: () => api.get('/payments/earnings'),
};

// ─── Reviews ───────────────────────────────────────────────────
export const reviewsAPI = {
  create: (data) => api.post('/reviews', data),
  replyToReview: (id, reply) => api.patch(`/reviews/${id}/reply`, { reply }),
  getSellerReviews: (sellerId, params) => api.get(`/reviews/seller/${sellerId}`, { params }),
};

// ─── Uploads ───────────────────────────────────────────────────
export const uploadsAPI = {
  getSignature: (type) => api.get('/uploads/sign', { params: { type } }),
};

// ─── Referrals ─────────────────────────────────────────────────
export const referralsAPI = {
  getMyCode: () => api.get('/referrals/my-code'),
  getStats: () => api.get('/referrals/stats'),
  validate: (code) => api.get(`/referrals/validate/${code}`),
};

// ─── Admin ─────────────────────────────────────────────────────
export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  users: (params) => api.get('/admin/users', { params }),
  banUser: (id, reason) => api.patch(`/admin/users/${id}/ban`, { reason }),
  orders: (params) => api.get('/admin/orders', { params }),
  disputes: (params) => api.get('/admin/disputes', { params }),
  resolveDispute: (id, data) => api.patch(`/admin/disputes/${id}/resolve`, data),
  settings: () => api.get('/admin/settings'),
  updateSetting: (key, value) => api.patch('/admin/settings', { key, value }),
};

/**
 * Upload a file directly to Cloudinary.
 * 1. Get signed params from our server
 * 2. POST file to Cloudinary
 * Returns the secure_url of the uploaded asset.
 */
export async function uploadToCloudinary(file, type = 'service') {
  const { data: params } = await uploadsAPI.getSignature(type);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', params.api_key);
  formData.append('timestamp', params.timestamp);
  formData.append('signature', params.signature);
  formData.append('folder', params.folder);

  const res = await axios.post(
    `https://api.cloudinary.com/v1_1/${params.cloud_name}/auto/upload`,
    formData
  );

  return res.data.secure_url;
}

export default api;
