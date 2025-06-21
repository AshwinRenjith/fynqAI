const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Helper to get JWT token from localStorage (customize as needed)
function getToken() {
  return localStorage.getItem('token');
}

// Helper to handle fetch with auth and error handling
async function fetchWithAuth(url: string, options: RequestInit = {}, onAuthError?: () => void) {
  const token = getToken();
  const headers: Record<string, string> = options.headers ? { ...options.headers as any } : {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401 || response.status === 403) {
    if (onAuthError) onAuthError();
    throw new Error('AUTH_ERROR');
  }
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const sendMessageToGemini = async (message: string, onAuthError?: () => void) => {
  return fetchWithAuth(
    `${API_BASE_URL}/api/v1/chat/message`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    },
    onAuthError
  );
};

export const uploadImageToGemini = async (file: File, onAuthError?: () => void) => {
  const formData = new FormData();
  formData.append('file', file);
  return fetchWithAuth(
    `${API_BASE_URL}/api/v1/chat/image`,
    {
      method: 'POST',
      body: formData,
    },
    onAuthError
  );
};

export const uploadFile = async (file: File, onAuthError?: () => void) => {
  const formData = new FormData();
  formData.append('file', file);
  return fetchWithAuth(
    `${API_BASE_URL}/api/v1/files/upload`,
    {
      method: 'POST',
      body: formData,
    },
    onAuthError
  );
};