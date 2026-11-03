// Códigos de acceso guardados en Netlify Blobs (el almacenamiento que trae Netlify).
// Cada código queda atado al primer navegador que lo usa y tiene un tope de juicios por mes.

import { getStore } from "@netlify/blobs";

export const LIMITE_MES = () => parseInt(process.env.MONTHLY_LIMIT || "500", 10) || 500;
// Tope de llamadas por mes, para que nadie use el sitio como IA gratis con pedidos que no son juicios
export const LLAMADAS_MES = () => parseInt(process.env.MONTHLY_CALLS || "1500", 10) || 1500;

export function store() {
  if (globalThis.__accesosStore) return globalThis.__accesosStore; // solo para pruebas
  return getStore({ name: "accesos", consistency: "strong" });
}

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

// Fecha y mes en hora de Uruguay
export function hoyUY() {
  return new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
}
export const mesUY = () => hoyUY().slice(0, 7);

export function normCode(c) {
  return String(c || "").trim().toLowerCase().replace(/\s+/g, "");
}

const ALFABETO = "abcdefghjkmnpqrstuvwxyz23456789"; // sin letras que se confunden (i, l, o, 0, 1)
export function nuevoCodigo() {
  const r = crypto.getRandomValues(new Uint32Array(8));
  const s = Array.from(r, (v) => ALFABETO[v % ALFABETO.length]).join("");
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}

export const clave = (code) => "codigos/" + code;

export async function leer(code) {
  return await store().get(clave(code), { type: "json" });
}
export async function guardar(rec) {
  await store().setJSON(clave(rec.code), rec);
}

export function usoDelMes(rec) {
  const m = mesUY();
  const u = (rec.uso && rec.uso[m]) || { juicios: 0, llamadas: 0 };
  return { mes: m, juicios: u.juicios || 0, llamadas: u.llamadas || 0 };
}
