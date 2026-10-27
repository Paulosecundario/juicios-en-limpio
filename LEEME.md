# Juicios en Limpio — sitio para Netlify

Contenido de esta carpeta:

- `index.html` — la app.
- `icon.png` — el ícono de la pestaña.
- `netlify.toml` — la configuración para Netlify.
- `netlify/functions/ia.mjs` — el intermediario que habla con la IA de Claude. Guarda la clave en secreto y solo atiende a quien tiene un código de acceso.

## 1. Subir la carpeta a GitHub (todo desde el navegador)

1. Entrá a github.com y creá una cuenta si no tenés.
2. Tocá **New repository**. Nombre: `juicios-en-limpio`. Podés dejarlo **Private**. Tocá **Create repository**.
3. En la página del repositorio, tocá **uploading an existing file**.
4. Arrastrá **todo lo que hay adentro** de esta carpeta (`index.html`, `icon.png`, `netlify.toml` y la carpeta `netlify`). Usá Chrome o Edge para que se suba también la carpeta.
5. Abajo, tocá **Commit changes**.

## 2. Publicar con Netlify

1. Entrá a netlify.com y registrate con **Continuar con GitHub**.
2. Tocá **Add new site → Import an existing project → GitHub** y elegí `juicios-en-limpio`.
3. Dejá todo como viene (la configuración la toma de `netlify.toml`) y tocá **Deploy**.
4. En un minuto tenés un link tipo `algo-raro.netlify.app`. Para cambiarlo: **Site configuration → Change site name**, por ejemplo `juicios-en-limpio`.

No uses la opción de arrastrar la carpeta suelta (Netlify Drop): de esa forma no se sube el intermediario de IA.

## 3. Crear la clave de la IA

1. Entrá a platform.claude.com y creá una cuenta.
2. En **Billing**, cargá crédito (con 5 dólares sobra para empezar) y poné un **límite de gasto mensual**.
3. En **API Keys**, tocá **Create Key** y copiala. Empieza con `sk-ant-`. No la mandes por chat ni la pongas en ningún archivo.

## 4. Conectar la IA en Netlify

En Netlify: **Site configuration → Environment variables → Add a variable**.

| Nombre | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | la clave del paso 3 |
| `ACCESS_CODES` | los códigos que vas a repartir, separados por comas. Ej: `abril-7k2p, colega-9xq4` |
| `MODEL` (opcional) | el modelo. Si no la ponés, usa `claude-haiku-4-5-20251001` |

Después: **Deploys → Trigger deploy → Deploy site**, para que tome las variables.

## Cómo manejar los accesos

- Para dar acceso: agregá un código nuevo en `ACCESS_CODES` y volvé a hacer **Trigger deploy**.
- Para quitar acceso: borrá ese código y hacé **Trigger deploy**.
- Usá un código distinto por persona, así podés quitárselo a una sola.
- Los datos de cada docente quedan en su navegador y en su archivo de datos, nunca en el sitio.

## Para actualizar la app

Cuando haya una versión nueva de `index.html`, entrá al repositorio en GitHub, tocá **Add file → Upload files**, subí el archivo nuevo y tocá **Commit changes**. Netlify publica la nueva versión solo.
