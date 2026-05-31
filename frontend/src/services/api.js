import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 12000,
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const payload = error.response?.data;
    const message = payload?.message || error.message || 'Something went wrong';
    return Promise.reject({ message, errors: payload?.errors || [], status: error.response?.status });
  },
);

export const productsApi = {
  list: (params) => api.get('/products', { params }),
  create: (payload) => api.post('/products', payload),
  update: (id, payload) => api.put(`/products/${id}`, payload),
  remove: (id) => api.delete(`/products/${id}`),
};

export const customersApi = {
  list: () => api.get('/customers'),
  create: (payload) => api.post('/customers', payload),
  remove: (id) => api.delete(`/customers/${id}`),
};

export const ordersApi = {
  list: () => api.get('/orders'),
  create: (payload) => api.post('/orders', payload),
  remove: (id) => api.delete(`/orders/${id}`),
};

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
};

export default api;

