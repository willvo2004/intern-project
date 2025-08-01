// API Configuration
const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod';

export const API_ENDPOINTS = {
  PRODUCTS: `${API_GATEWAY_URL}/products`,
  UPDATE_PRODUCT: `${API_GATEWAY_URL}/update-product`,
  SAVE_PRODUCT: `${API_GATEWAY_URL}/save-product`,
  GENERATE: `${API_GATEWAY_URL}/generate`,
  POLLING: `${API_GATEWAY_URL}/status/`
};

// Common fetch options for API Gateway
export const API_OPTIONS = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  mode: 'cors' as RequestMode,
};

// Helper function to make API calls with error handling
export async function apiCall(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...API_OPTIONS,
    ...options,
    headers: {
      ...API_OPTIONS.headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  if (url == API_ENDPOINTS.GENERATE) return response;
  return response.json();
}
