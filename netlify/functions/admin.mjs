// Administración de códigos de acceso. Solo responde a quien manda la contraseña
// de la variable ADMIN_PASSWORD de Netlify. La usa la página /admin.html.

import { json, store, leer, guardar, normCode, nuevoCodigo, usoDelMes, LIMITE_MES } from "../lib/accesos.mjs";

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

function mismaClave(a, b) {
  const x = new TextEncoder().encode(String(a)), y = new TextEncoder().encode(String(b));
  if (x.length !== y.length) return false;
  let d = 0; for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
}

const fechaOk = (v) => v === null || v === "" || /^\d{4}-\d{2}-\d{2}$/.test(String(v));

function resumen(rec) {
  const u = usoDelMes(rec);
  return {
    code: rec.code, nombre: rec.nombre || "", creado: rec.creado, vence: rec.vence || null,
    activo: rec.activo !== false, navegador: Boolean(rec.device), navegadorDesde: rec.deviceDesde || null,
    usados: u.juicios, limite: LIMITE_MES(), ultimoUso: rec.ultimoUso || null,
  };
}

export default async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const pass = (process.env.ADMIN_PASSWORD || "").trim();
  if (pass.length < 8) return json({ error: "admin_not_configured" }, 503);

  let b;
  try { b = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  if (!mismaClave(b.password || "", pass)) { await espera(800); return json({ error: "bad_password" }, 401); }

  try {
    switch (b.action) {
      case "list": {
        const { blobs } = await store().list({ prefix: "codigos/" });
        const recs = (await Promise.all(blobs.map((x) => store().get(x.key, { type: "json" })))).filter(Boolean);
        recs.sort((a, c) => String(c.creado).localeCompare(String(a.creado)));
        return json({ codigos: recs.map(resumen), limite: LIMITE_MES() });
      }
      case "create": {
        const nombre = String(b.nombre || "").trim().slice(0, 80);
        if (!fechaOk(b.vence)) return json({ error: "bad_date" }, 400);
        let code;
        for (let i = 0; i < 5; i++) { code = nuevoCodigo(); if (!(await leer(code))) break; }
        const rec = { code, nombre, creado: new Date().toISOString(), vence: b.vence || null, activo: true, device: null, uso: {} };
        await guardar(rec);
        return json({ codigo: resumen(rec) });
      }
      case "release": case "extend": case "toggle": case "delete": {
        const code = normCode(b.code);
        const rec = await leer(code);
        if (!rec) return json({ error: "not_found" }, 404);
        if (b.action === "delete") { await store().delete("codigos/" + code); return json({ ok: true }); }
        if (b.action === "release") { rec.device = null; rec.deviceDesde = null; }
        if (b.action === "extend") { if (!fechaOk(b.vence)) return json({ error: "bad_date" }, 400); rec.vence = b.vence || null; }
        if (b.action === "toggle") rec.activo = !(rec.activo !== false);
        await guardar(rec);
        return json({ codigo: resumen(rec) });
      }
      default:
        return json({ error: "bad_action" }, 400);
    }
  } catch (e) {
    console.error("Blobs", e);
    return json({ error: "storage_error" }, 502);
  }
};
