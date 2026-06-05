import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const warehouseApi = {
  getAll: () => api.get('/warehouses'),
  getById: (id: number) => api.get(`/warehouses/${id}`),
  create: (data: any) => api.post('/warehouses', data),
  update: (id: number, data: any) => api.put(`/warehouses/${id}`, data),
  delete: (id: number) => api.delete(`/warehouses/${id}`),
};

export const materialApi = {
  getAll: (params?: any) => api.get('/materials', { params }),
  getById: (id: number) => api.get(`/materials/${id}`),
  getByCode: (code: string) => api.get(`/materials/code/${code}`),
  create: (data: any) => api.post('/materials', data),
  update: (id: number, data: any) => api.put(`/materials/${id}`, data),
  delete: (id: number) => api.delete(`/materials/${id}`),
  import: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/materials/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const inventoryApi = {
  getRecords: (params?: any) => api.get('/inventory/records', { params }),
  stockIn: (data: any) => api.post('/inventory/in', data),
  stockOut: (data: any) => api.post('/inventory/out', data),
};

export const transferApi = {
  getAll: (params?: any) => api.get('/transfers', { params }),
  getById: (id: number) => api.get(`/transfers/${id}`),
  create: (data: any) => api.post('/transfers', data),
  approve: (id: number, data: any) => api.post(`/transfers/${id}/approve`, data),
  confirmOut: (id: number) => api.post(`/transfers/${id}/confirm-out`),
  confirmIn: (id: number) => api.post(`/transfers/${id}/confirm-in`),
};

export const alertApi = {
  getAll: (params?: any) => api.get('/alerts', { params }),
  getCount: () => api.get('/alerts/count'),
  handle: (id: number, data: any) => api.post(`/alerts/${id}/handle`, data),
};

export const statisticsApi = {
  getWarehouseValues: () => api.get('/statistics/warehouse-values'),
  getCategoryDistribution: () => api.get('/statistics/category-distribution'),
  getMonthlyFlow: () => api.get('/statistics/monthly-flow'),
  getExpiringMaterials: () => api.get('/statistics/expiring-materials'),
  getTransferCompletionRate: () => api.get('/statistics/transfer-completion-rate'),
  getTotalValue: () => api.get('/statistics/total-value'),
};

export default api;
