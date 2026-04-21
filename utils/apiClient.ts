// utils/apiClient.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

async function client(endpoint: string, customConfig: RequestInit = {}) {
  const config = {
    ...customConfig,
    headers: {
      'Content-Type': 'application/json',
      // Add global headers like Authorization here if needed
      // 'Authorization': `Bearer ${token}`,
      ...customConfig.headers,
    },
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error(`API Client Error [${customConfig.method}] ${endpoint}:`, error);
    throw error;
  }
}

// Export the custom methods
export const api = {
  get: (endpoint: string, customConfig = {}) => 
    client(endpoint, { ...customConfig, method: 'GET' }),
    
  post: (endpoint: string, body: any, customConfig = {}) => 
    client(endpoint, { ...customConfig, method: 'POST', body: JSON.stringify(body) }),
    
  put: (endpoint: string, body: any, customConfig = {}) => 
    client(endpoint, { ...customConfig, method: 'PUT', body: JSON.stringify(body) }),
    
  delete: (endpoint: string, customConfig = {}) => 
    client(endpoint, { ...customConfig, method: 'DELETE' }),
};