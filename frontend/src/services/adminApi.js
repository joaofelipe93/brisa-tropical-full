// src/services/adminApi.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';

const adminApi = axios.create({ baseURL: `${BASE_URL}/api` });

// Injetar token em todas as requisições
adminApi.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirecionar para login se token expirar
adminApi.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ───────────────────────────────────────────────────
export const login = (password) =>
  adminApi.post('/auth/login', { password }).then(r => r.data);

export const verifyToken = () =>
  adminApi.get('/auth/verify').then(r => r.data);

// ── Produtos ───────────────────────────────────────────────
export const adminGetProducts   = ()     => adminApi.get('/admin/products').then(r => r.data);
export const adminGetProduct    = (id)   => adminApi.get(`/admin/products/${id}`).then(r => r.data);
export const adminCreateProduct = (data) => adminApi.post('/admin/products', data).then(r => r.data);
export const adminUpdateProduct = (id, data) => adminApi.put(`/admin/products/${id}`, data).then(r => r.data);
export const adminToggleProduct = (id)   => adminApi.patch(`/admin/products/${id}/toggle`).then(r => r.data);
export const adminDeleteProduct = (id)   => adminApi.delete(`/admin/products/${id}`).then(r => r.data);

// ── Categorias ─────────────────────────────────────────────
export const adminGetCategories   = ()     => adminApi.get('/admin/categories').then(r => r.data);
export const adminCreateCategory  = (data) => adminApi.post('/admin/categories', data).then(r => r.data);
export const adminUpdateCategory  = (id, data) => adminApi.put(`/admin/categories/${id}`, data).then(r => r.data);
export const adminDeleteCategory  = (id)   => adminApi.delete(`/admin/categories/${id}`).then(r => r.data);
