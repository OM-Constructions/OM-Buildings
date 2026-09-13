export const API_BASE_URL = 
  (typeof window !== "undefined" && window.API_BASE_URL) ||
  (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? (window.location.port === "8000" ? "" : "http://localhost:8000")
    : "");

export async function submitEnquiry({ name, email, phone, serviceSlug, projectType, message, honeypot }) {
  const slug = serviceSlug || projectType;
  const res = await fetch(`${API_BASE_URL}/api/v1/enquiries/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      name,
      email,
      phone: phone || null,
      service_slug: slug,
      message,
      website: honeypot || "",
      honeypot: honeypot || "",
    }),
  });
  if (!res.ok) throw new Error("Failed to submit enquiry");
  return res.json();
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

