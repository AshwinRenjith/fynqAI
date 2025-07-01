
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Helper to get JWT token from localStorage
function getToken() {
  return localStorage.getItem('supabase.auth.token');
}

// Helper to handle fetch with auth and error handling
async function fetchWithAuth(url: string, options: RequestInit = {}, onAuthError?: () => void) {
  const token = getToken();
  const headers: Record<string, string> = {};
  
  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Merge with existing headers
  if (options.headers) {
    Object.assign(headers, options.headers);
  }
  
  const requestOptions: RequestInit = {
    ...options,
    headers,
    mode: 'cors',
    credentials: 'omit',
  };

  console.log(`Making request to: ${url}`);
  console.log('Request options:', requestOptions);
  
  try {
    const response = await fetch(url, requestOptions);
    
    console.log(`Response status: ${response.status}`);
    console.log('Response headers:', response.headers);
    
    if (response.status === 401 || response.status === 403) {
      console.error('Authentication error');
      if (onAuthError) onAuthError();
      throw new Error('Authentication required');
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText };
      }
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Response data:', result);
    return result;
  } catch (error) {
    console.error('API Error:', error);
    
    // Handle network errors specifically
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('Network error - check if backend is running on', API_BASE_URL);
      throw new Error(`Unable to connect to backend server at ${API_BASE_URL}. Please ensure the backend is running.`);
    }
    
    throw error;
  }
}

export const sendMessageToGemini = async (message: string, chat_id?: number, onAuthError?: () => void) => {
  console.log('Sending message to Gemini:', { message, chat_id });
  return fetchWithAuth(
    `${API_BASE_URL}/api/v1/chat/message`,
    {
      method: 'POST',
      body: JSON.stringify({ message, chat_id }),
    },
    onAuthError
  );
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
  
  console.log('Uploading image to Gemini:', { file: file.name, message, chat_id });
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/image`, {
      method: 'POST',
      headers,
      body: formData,
      mode: 'cors',
      credentials: 'omit',
    });
    
    console.log(`Image upload response status: ${response.status}`);
    
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
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`Unable to connect to backend server at ${API_BASE_URL}. Please ensure the backend is running.`);
    }
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
      mode: 'cors',
      credentials: 'omit',
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
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`Unable to connect to backend server at ${API_BASE_URL}. Please ensure the backend is running.`);
    }
    throw error;
  }
};

export const getChatHistory = async (onAuthError?: () => void) => {
  console.log('Fetching chat history');
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
