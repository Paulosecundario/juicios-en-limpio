# Juicios en Limpio — sitio para Netlify

Contenido de esta carpeta:

- `index.html` — la app.
- `icon.png` — el ícono de la pestaña.
- `netlify.toml` — la configuración para Netlify.
- `admin.html` — tu página para generar y manejar los códigos de acceso (entrás con tu contraseña de administrador).
- `package.json` — le dice a Netlify qué usar para guardar los códigos.
- `netlify/functions/ia.mjs` — el intermediario que habla con la IA de Claude. Guarda la clave en secreto y solo atiende a quien tiene un código de acceso.
- `netlify/functions/admin.mjs` y `netlify/lib/accesos.mjs` — lo que usa la página de administración.

## 1. Subir la carpeta a GitHub (todo desde el navegador)

1. Entrá a github.com y creá una cuenta si no tenés.
2. Tocá **New repository**. Nombre: `juicios-en-limpio`. Podés dejarlo **Private**. Tocá **Create repository**.
3. En la página del repositorio, tocá **uploading an existing file**.
4. Arrastrá **todo lo que hay adentro** de esta carpeta (`index.html`, `admin.html`, `icon.png`, `netlify.toml`, `package.json` y la carpeta `netlify`). Usá Chrome o Edge para que se suba también la carpeta.
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
| `ADMIN_PASSWORD` | tu contraseña para entrar a la página de administración. Usá una larga (12 caracteres o más) y que no uses en otro lado |
| `MONTHLY_LIMIT` (opcional) | el tope de juicios por mes de cada código. Si no la ponés, es 500 |
| `ACCESS_CODES` (opcional) | códigos tuyos, sin tope y sin navegador fijo, separados por comas. Dejala solo con el tuyo, o borrala |
| `MODEL` (opcional) | el modelo. Si no la ponés, usa `claude-haiku-4-5-20251001` |

Después: **Deploys → Trigger deploy → Deploy site**, para que tome las variables.

## Cómo manejar los accesos

Entrá a `tu-sitio.netlify.app/admin.html` y poné tu contraseña de administrador.

- **Dar acceso:** escribí para quién es, poné una fecha de vencimiento si querés y tocá **Generar código**. Con **Copiar mensaje para mandarle** te queda un texto listo para WhatsApp.
- **Cada código anda en un solo navegador:** el primero donde se usa. Si la persona lo prueba en otra compu, la app le dice que ya está en uso.
- **Si cambió de compu o borró el navegador:** tocá **Liberar navegador** y el próximo navegador donde lo use queda como el nuevo.
- **Tope:** 500 juicios por mes por código. Se renueva solo el día 1.
- **Renovar o cortar:** cambiá la fecha de vencimiento, o tocá **Desactivar**. **Borrar** lo elimina para siempre.
- Los códigos se guardan en el almacenamiento de Netlify (Blobs). No hace falta hacer Trigger deploy para dar o quitar accesos.
- Los datos de cada docente quedan en su navegador y en su archivo de datos, nunca en el sitio.

## Para actualizar la app

Cuando haya una versión nueva de `index.html`, entrá al repositorio en GitHub, tocá **Add file → Upload files**, subí el archivo nuevo y tocá **Commit changes**. Netlify publica la nueva versión solo.
