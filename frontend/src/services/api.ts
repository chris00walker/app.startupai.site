// Strategyzer AI Platform API Service
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://strategyzer-ai-backend-e42x4wjxiq-uc.a.run.app/api';

const api = {
  get: (endpoint: string) => fetch(`${API_BASE_URL}${endpoint}`).then(r => r.json()),
  post: (endpoint: string, data: any) => 
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  put: (endpoint: string, data: any) => 
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  delete: (endpoint: string) => 
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE'
    }).then(r => r.json()),

  // Canvas-specific API methods
  canvas: {
    getByClient: (clientId: string) => api.get(`/api/canvas/client/${clientId}`),
    getById: (canvasId: string) => api.get(`/api/canvas/${canvasId}`),
    generateValueProposition: (data: { clientId: string; title?: string; description?: string }) => 
      api.post('/api/canvas/generate/value-proposition', data),
    generateBusinessModel: (data: { clientId: string; title?: string; description?: string }) => 
      api.post('/api/canvas/generate/business-model', data),
    generateCompleteFramework: (data: { clientId: string; autoExport?: boolean }) => 
      api.post('/api/canvas/workflow/complete-framework', data),
    getWorkflowStatus: (clientId: string) => api.get(`/api/canvas/workflow/status/${clientId}`),
    exportCanvas: (canvasId: string, format: string = 'svg', theme: string = 'professional') => 
      api.post(`/api/canvas/${canvasId}/export`, { format, theme }),
    updateCanvas: (canvasId: string, data: any) => api.put(`/api/canvas/${canvasId}`, data),
    deleteCanvas: (canvasId: string) => api.delete(`/api/canvas/${canvasId}`),
    getStatistics: () => api.get('/api/canvas/stats/overview')
  }
};

export default api;
