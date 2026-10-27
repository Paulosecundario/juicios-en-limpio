// Intermediario entre la app y la IA de Claude.
// Guarda la clave de la API en secreto (variable ANTHROPIC_API_KEY de Netlify)
// y solo atiende a quien manda un código de acceso válido (variable ACCESS_CODES).

const API_URL = "https://api.anthropic.com/v1/messages";
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

function settings() {
  const key = (process.env.ANTHROPIC_API_KEY || "").trim();
  const codes = (process.env.ACCESS_CODES || "").split(/[,\n]/).map((c) => c.trim()).filter(Boolean);
  const model = (process.env.MODEL || "claude-haiku-4-5-20251001").trim();
  return { key, codes, model };
}

export default async (req) => {
  const { key, codes, model } = settings();

  // La app pregunta al abrir si la IA está lista.
  if (req.method === "GET") return json({ configured: Boolean(key && codes.length) });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!key || !codes.length) return json({ error: "not_configured" }, 503);

  let body;
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }

  const code = String(body.code || "").trim();
  if (!codes.includes(code)) return json({ error: "bad_code" }, 401);

  const prompt = String(body.prompt || "");
  if (!prompt) return json({ error: "bad_request" }, 400);
  if (prompt.length > 200000) return json({ error: "too_large" }, 413);

  const content = [];
  if (body.image && body.image.data) {
    const type = String(body.image.media_type || "");
    if (!IMAGE_TYPES.includes(type)) return json({ error: "bad_image" }, 400);
    content.push({ type: "image", source: { type: "base64", media_type: type, data: String(body.image.data) } });
  }
  content.push({ type: "text", text: prompt + "\n\nRespondé solo con el JSON pedido, sin texto antes ni después." });

  let r;
  try {
    r = await fetch(API_URL, {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 4096, messages: [{ role: "user", content }] }),
    });
  } catch (e) {
    return json({ error: "upstream_unreachable" }, 502);
  }

  if (r.status === 429) return json({ error: "rate_limited" }, 429);
  if (!r.ok) {
    console.error("Error de la API de Claude", r.status, (await r.text()).slice(0, 500));
    return json({ error: "upstream_error" }, 502);
  }

  const data = await r.json();
  const text = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
  return json({ text });
};
