export const API_BASE_URL =
  (typeof window !== "undefined" && window.API_BASE_URL) ||
  (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? (window.location.port === "8000" ? "" : "http://localhost:8000")
    : "https://om-buildings-rust.vercel.app");

export async function submitEnquiry({ name, email, phone, location, serviceSlug, projectType, message, honeypot }) {
  const slug = serviceSlug || projectType;
  const headers = { "Content-Type": "application/json" };
  try {
    const token = localStorage.getItem("om_auth_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } catch (e) {}
  const res = await fetch(`${API_BASE_URL}/api/v1/enquiries/`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({
      name,
      email,
      phone: phone || null,
      location: location || null,
      service_slug: slug,
      message,
      website: honeypot || "",
      honeypot: honeypot || "",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.detail || `Failed to submit enquiry (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function askAssistant(message, history = []) {
  const res = await fetch(`${API_BASE_URL}/api/v1/assistant/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error("Assistant request failed");
  return res.json();
}

