export const API_BASE_URL = 
  (typeof window !== "undefined" && window.API_BASE_URL) ||
  (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? (window.location.port === "8000" ? "" : "http://localhost:8000")
    : "https://om-buildings-rust.vercel.app");

export function getStoredToken() {
  try {
    return localStorage.getItem("om_auth_token") || null;
  } catch (e) {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem("om_auth_token", token);
    } else {
      localStorage.removeItem("om_auth_token");
    }
  } catch (e) {}
}

export function getAuthHeaders(extraHeaders = {}) {
  const token = getStoredToken();
  const headers = { ...extraHeaders };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Register a new customer account
 * @param {{ name: string, email: string, password: string }}
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function signup({ name, email, password }) {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Unable to create account");
  }
  return data;
}

/**
 * Log in with email and password
 * @param {{ email: string, password: string }}
 * @returns {Promise<{ success: boolean, name: string, token?: string }>}
 */
export async function login({ email, password }) {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.detail || "Invalid email or password");
    err.status = res.status;
    err.code = data.error || (data.detail === "email_not_verified" ? "email_not_verified" : null);
    throw err;
  }
  try {
    localStorage.setItem("om_logged_in", "true");
    if (data.name) localStorage.setItem("om_user_name", data.name);
    if (data.token) setStoredToken(data.token);
  } catch (e) {}
  return data;
}

/**
 * Verify 6-digit OTP code and set session cookie
 * @param {{ email: string, otp: string }}
 * @returns {Promise<{ success: boolean, name: string }>}
 */
export async function verifyOtp(arg1, arg2) {
  let email, otp;
  if (typeof arg1 === "object" && arg1 !== null) {
    email = arg1.email;
    otp = arg1.otp;
  } else {
    email = arg1;
    otp = arg2;
  }
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email: email ? email.trim() : "", otp: otp ? otp.trim() : "" }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.detail || "Invalid or expired code");
    err.status = res.status;
    throw err;
  }
  try {
    localStorage.setItem("om_logged_in", "true");
    if (data.name) localStorage.setItem("om_user_name", data.name);
    if (data.token) setStoredToken(data.token);
  } catch (e) {}
  return data;
}

/**
 * Resend 6-digit OTP code
 * @param {string} email
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function resendOtp(email) {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.detail || "Unable to resend code");
    err.status = res.status;
    throw err;
  }
  return data;
}

/**
 * Log out and clear session cookie & stored auth tokens
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function logout() {
  const headers = getAuthHeaders();
  try {
    localStorage.removeItem("om_logged_in");
    localStorage.removeItem("om_user_name");
    setStoredToken(null);
  } catch (e) {}
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
    method: "POST",
    headers,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Failed to log out");
  }
  return data;
}

/**
 * Synchronous check for stored login flag
 * @returns {boolean}
 */
export function isStoredUserLoggedIn() {
  try {
    return localStorage.getItem("om_logged_in") === "true" || !!getStoredToken();
  } catch (e) {
    return false;
  }
}

/**
 * Fetch helper with strict timeout to prevent infinite hanging
 */
export async function fetchWithTimeout(resource, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Check if the user is logged in
 * @returns {Promise<{ name: string, email: string } | null>}
 */
export async function getCurrentUser() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/auth/me`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    }, 20000);
    
    if (!res.ok) {
      // Only clear storage if explicitly rejected as unauthenticated
      if (res.status === 401 || res.status === 403) {
        try {
          localStorage.removeItem("om_logged_in");
          localStorage.removeItem("om_user_name");
          setStoredToken(null);
        } catch (e) {}
        return null;
      }
      throw new Error(`Server returned HTTP ${res.status}`);
    }
    const data = await res.json();
    try {
      localStorage.setItem("om_logged_in", "true");
      if (data && data.name) localStorage.setItem("om_user_name", data.name);
    } catch (e) {}
    return data;
  } catch (err) {
    console.warn("getCurrentUser check encountered network or server error:", err.message);
    const networkErr = new Error(err.message || "Connection timeout");
    networkErr.isNetworkError = true;
    throw networkErr;
  }
}

/**
 * Fetch the logged-in customer's own enquiries
 * @returns {Promise<Array<{ id: number, name: string, project_type: string, message: string, status: string, created_at: string }>>}
 */
export async function getMySubmissions() {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/me/submissions`, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  }, 20000);
  
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Failed to load submissions (${res.status})`);
  }
  return data;
}
