const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.MODE === 'development'
    ? 'http://localhost:5050/api'
    : 'https://chat-app-0yh9.onrender.com/api'
);

// Short-lived Access Token stored strictly in application memory
let inMemoryAccessToken = localStorage.getItem('chat_token') || null;

export const setAccessToken = (token) => {
  inMemoryAccessToken = token;
  if (token) {
    localStorage.setItem('chat_token', token);
  } else {
    localStorage.removeItem('chat_token');
  }
};

export const getAccessToken = () => inMemoryAccessToken;

export const apiRequest = async (endpoint, method = 'GET', body = null, isRetry = false) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (inMemoryAccessToken) {
    headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;
  }

  const config = {
    method,
    headers,
    credentials: 'include', // Pass HttpOnly cookies automatically
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Safely parse JSON or text error fallback
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text || `HTTP ${response.status} Error` };
    }

    // Transparent 401 Token Refresh Interceptor
    if (response.status === 401 && !isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register') && !endpoint.includes('/auth/refresh')) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setAccessToken(refreshData.token);
          // Retry initial request with new access token
          return await apiRequest(endpoint, method, body, true);
        } else {
          setAccessToken(null);
        }
      } catch (refreshErr) {
        setAccessToken(null);
      }
    }

    if (!response.ok) {
      throw new Error(data.message || `An error occurred (${response.status})`);
    }

    return data;
  } catch (error) {
    if (!endpoint.includes('/auth/refresh')) {
      console.error(`API Error (${endpoint}):`, error.message || error);
    }
    throw error;
  }
};
