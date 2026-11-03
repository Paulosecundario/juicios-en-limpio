// Intermediario entre la app y la IA de Claude.
// Guarda la clave de la API en secreto (variable ANTHROPIC_API_KEY de Netlify) y solo atiende
// a quien manda un código de acceso válido:
//  - los códigos que generás en /admin.html: cada uno anda en un solo navegador y tiene un tope por mes;
//  - los códigos de la variable ACCESS_CODES (opcional): son tuyos, sin tope ni navegador fijo.

import { json, leer, guardar, normCode, hoyUY, usoDelMes, LIMITE_MES, LLAMADAS_MES } from "../lib/accesos.mjs";

const API_URL = "https://api.anthropic.com/v1/messages";
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function settings() {
  const key = (process.env.ANTHROPIC_API_KEY || "").trim();
  const master = (process.env.ACCESS_CODES || "").split(/[,\n]/).map(normCode).filter(Boolean);
  const model = (process.env.MODEL || "claude-haiku-4-5-20251001").trim();
  return { key, master, model };
}

// Cuántos juicios pide este mensaje: la app manda los alumnos en la lista ESTUDIANTES
function juiciosPedidos(prompt) {
  const m = prompt.match(/ESTUDIANTES\n(\[[\s\S]*?\])\n/);
  if (!m) return 0;
  try { const a = JSON.parse(m[1]); return Array.isArray(a) ? a.length : 0; } catch { return 0; }
}

export default async (req) => {
  const { key, master, model } = settings();

  // La app pregunta al abrir si la IA está lista.
  if (req.method === "GET") return json({ configured: Boolean(key) });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!key) return json({ error: "not_configured" }, 503);

  let body;
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }

  const prompt = String(body.prompt || "");
  if (!prompt) return json({ error: "bad_request" }, 400);
  if (prompt.length > 200000) return json({ error: "too_large" }, 413);

  // ---- acceso ----
  const code = normCode(body.code);
  if (!code) return json({ error: "bad_code" }, 401);
  let rec = null;
  const n = juiciosPedidos(prompt);
  if (!master.includes(code)) {
    try { rec = await leer(code); } catch (e) { console.error("Blobs", e); return json({ error: "upstream_error" }, 502); }
    if (!rec) return json({ error: "bad_code" }, 401);
    if (rec.activo === false) return json({ error: "code_disabled" }, 403);
    if (rec.vence && rec.vence < hoyUY()) return json({ error: "code_expired", vence: rec.vence }, 403);

    const device = String(body.device || "").trim();
    if (!/^[a-z0-9-]{16,64}$/i.test(device)) return json({ error: "device_required" }, 400);
    if (!rec.device) { rec.device = device; rec.deviceDesde = new Date().toISOString(); }
    else if (rec.device !== device) return json({ error: "device_mismatch" }, 403);

    const u = usoDelMes(rec), lim = LIMITE_MES();
    if (u.juicios >= lim || u.llamadas >= LLAMADAS_MES())  // el último lote puede pasarse por pocos
      return json({ error: "quota", usados: u.juicios, limite: lim, quedan: Math.max(0, lim - u.juicios) }, 429);
  }

  // ---- IA ----
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

  // ---- anotar el uso (solo si salió bien) ----
  let uso = null;
  if (rec) {
    const u = usoDelMes(rec);
    rec.uso = rec.uso || {};
    rec.uso[u.mes] = { juicios: u.juicios + n, llamadas: u.llamadas + 1 };
    // guardar solo los últimos 12 meses
    for (const m of Object.keys(rec.uso).sort().slice(0, -12)) delete rec.uso[m];
    rec.ultimoUso = new Date().toISOString();
    try { await guardar(rec); } catch (e) { console.error("Blobs", e); }
    uso = { usados: u.juicios + n, limite: LIMITE_MES() };
  }
  return json({ text, uso });
};
