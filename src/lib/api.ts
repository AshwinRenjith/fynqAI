
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Helper to get JWT token from localStorage
function getToken() {
  // Try to get the token from Supabase session
  const supabaseAuth = localStorage.getItem('sb-lqfqdpemaihdtpzyuevl-auth-token');
  if (supabaseAuth) {
    try {
      const authData = JSON.parse(supabaseAuth);
      return authData.access_token;
    } catch (e) {
      console.log('Could not parse Supabase auth token');
    }
  }
  return null;
}

// Helper to handle fetch with auth and error handling
async function fetchWithAuth(url: string, options: RequestInit = {}, onAuthError?: () => void) {
  const token = getToken();
  const headers: Record<string, string> = options.headers ? { ...options.headers as any } : {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  
  try {
    const response = await fetch(url, { 
      ...options, 
      headers,
      mode: 'cors' // Explicitly set CORS mode
    });
    
    if (response.status === 401 || response.status === 403) {
      if (onAuthError) onAuthError();
      throw new Error('Authentication required');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export const sendMessageToGemini = async (message: string, chat_id?: number, onAuthError?: () => void) => {
  try {
    return await fetchWithAuth(
      `${API_BASE_URL}/api/v1/chat/message`,
      {
        method: 'POST',
        body: JSON.stringify({ message, chat_id: chat_id?.toString() }),
      },
      onAuthError
    );
  } catch (error) {
    console.error('Error sending message to Gemini:', error);
    throw error;
  }
};

export const uploadImageToGemini = async (file: File, message: string = '', chat_id?: number, onAuthError?: () => void) => {
  const token = getToken();
  const formData = new FormData();
  formData.append('image', file);
  formData.append('message', message);
  if (chat_id) formData.append('chat_id', chat_id.toString());
  
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/image`, {
      method: 'POST',
      headers,
      body: formData,
      mode: 'cors'
    });
    
    if (response.status === 401 || response.status === 403) {
      if (onAuthError) onAuthError();
      throw new Error('Authentication required');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Image Upload Error:', error);
    throw error;
  }
};

export const uploadFile = async (file: File, onAuthError?: () => void) => {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);
  
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/files/upload`, {
      method: 'POST',
      headers,
      body: formData,
      mode: 'cors'
    });
    
    if (response.status === 401 || response.status === 403) {
      if (onAuthError) onAuthError();
      throw new Error('Authentication required');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('File Upload Error:', error);
    throw error;
  }
};

export const getChatHistory = async (onAuthError?: () => void) => {
  return fetchWithAuth(
    `${API_BASE_URL}/api/v1/chat/history`,
    {
      method: 'GET',
    },
    onAuthError
  );
};

export const getCurrentUser = async (onAuthError?: () => void) => {
  return fetchWithAuth(
    `${API_BASE_URL}/api/v1/users/me`,
    {
      method: 'GET',
    },
    onAuthError
  );
};
