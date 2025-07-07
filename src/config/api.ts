// API Configuration
export const API_CONFIG = {
  // Use environment variable with fallback to production URL
  BASE_URL:
    import.meta.env.VITE_API_BASE_URL || "https://educomm-backend.vercel.app",

  // API endpoints
  ENDPOINTS: {
    // User endpoints
    USER_SEARCH: "/api/users/search",
    USER_CREATE: "/api/users/create",
    USER_GET_EMAIL: "/api/users/get-email",

    // Group endpoints
    GROUPS: "/api/groups",
    GROUP_MEMBERS: (groupId: string) => `/api/groups/${groupId}/members`,
    GROUP_MESSAGES: (groupId: string) => `/api/groups/${groupId}/messages`,

    // Course endpoints
    COURSES: "/api/courses",
    COURSE_STUDENTS: (courseId: string) => `/api/courses/${courseId}/students`,

    // Chat endpoints
    CHAT_NOTIFY: (chatId: string) => `/api/chats/${chatId}/notify-message`,

    // Message endpoints
    MESSAGE_DELETE: (messageId: string) => `/api/messages/${messageId}`,

    // Translation endpoints
    TRANSLATE: "/api/translate/translate",
    TRANSLATE_DETECT: "/api/translate/detect",

    // File endpoints
    UPLOAD: "/api/upload",
    FILES: "/api/files",
  },
} as const;

// Helper function to build full URL
export const buildApiUrl = (
  endpoint: string,
  params?: Record<string, string>
) => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  return url;
};

// Helper function for common API calls
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {},
  params?: Record<string, string>
) => {
  const url = buildApiUrl(endpoint, params);

  const defaultOptions: RequestInit = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  return fetch(url, defaultOptions);
};

// Helper function for authenticated API calls
export const authenticatedApiCall = async (
  endpoint: string,
  token: string,
  options: RequestInit = {},
  params?: Record<string, string>
) => {
  return apiCall(
    endpoint,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    },
    params
  );
};
