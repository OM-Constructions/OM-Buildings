export const API_BASE_URL = "http://localhost:8000"; // change per environment

export async function submitEnquiry({ name, email, phone, projectType, message, honeypot }) {
  const res = await fetch(`${API_BASE_URL}/api/v1/contact/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      email,
      phone: phone || null,
      project_type: projectType || null,
      message,
      honeypot: honeypot || "",
    }),
  });
  if (!res.ok) throw new Error("Failed to submit");
  return res.json();
}
