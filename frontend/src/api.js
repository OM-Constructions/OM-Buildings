export const API_BASE_URL = 
  (typeof window !== "undefined" && window.API_BASE_URL) ||
  (typeof window !== "undefined" && window.location.port === "8000" ? "http://localhost:8080" : "http://localhost:8000");

export async function submitEnquiry({ name, email, phone, projectType, message, honeypot }) {
  const res = await fetch(`${API_BASE_URL}/api/v1/contact/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      name,
      email,
      phone: phone || null,
      project_type: projectType || null,
      message,
      website: honeypot || "",
      honeypot: honeypot || "",
    }),
  });
  if (!res.ok) throw new Error("Failed to submit");
  return res.json();
}

