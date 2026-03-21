import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';
const api = axios.create({ baseURL: `${BASE_URL}/api` });

export const getStore = () => api.get('/store').then(r => r.data);
export const getCategories = () => api.get('/categories').then(r => r.data);
export const getProducts = (category) => api.get('/products', { params: { category } }).then(r => r.data);
export const getToppings = () => api.get('/toppings').then(r => r.data);
export const getNeighborhoods = () => api.get('/neighborhoods').then(r => r.data);
export const getCustomizationSteps = () => api.get('/customization-steps').then(r => r.data);
export const createOrder = (data) => api.post('/orders', data).then(r => r.data);
export const getOrders = (params) => api.get('/orders', { params }).then(r => r.data);
export const getOrder = (id) => api.get(`/orders/${id}`).then(r => r.data);
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/status`, { status }).then(r => r.data);
export const getTodayStats = () => api.get('/orders/stats/today').then(r => r.data);
export const getWhatsAppStatus = () => api.get('/whatsapp/status').then(r => r.data);
