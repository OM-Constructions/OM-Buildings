export const API_BASE_URL = 
  (typeof window !== "undefined" && window.API_BASE_URL) ||
  (typeof window !== "undefined" && window.location.port === "8000" ? "http://localhost:8080" : "http://localhost:8000");

/**
 * Register a new customer account
 * @param {{ name: string, email: string, password: string }}
 * @returns {Promise<{ success: boolean, name: string }>}
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
 * @returns {Promise<{ success: boolean, name: string }>}
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
    throw new Error(data.detail || "Invalid email or password");
  }
  return data;
}

/**
 * Log out and clear session cookie
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function logout() {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Failed to log out");
  }
  return data;
}

/**
 * Check if the user is logged in
 * @returns {Promise<{ name: string, email: string } | null>}
 */
export async function getCurrentUser() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

/**
 * Fetch the logged-in customer's own enquiries
 * @returns {Promise<Array<{ id: number, name: string, project_type: string, message: string, status: string, created_at: string }>>}
 */
export async function getMySubmissions() {
  const res = await fetch(`${API_BASE_URL}/api/v1/me/submissions`, {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Failed to load submissions");
  }
  return data;
}
