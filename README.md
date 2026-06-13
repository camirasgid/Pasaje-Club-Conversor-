# Conversor de fichas · Pasaje Club

Una web propia donde pegás el mail desordenado del operador (o subís imágenes/PDF de vuelos y hoteles) y te devuelve la ficha ordenada, con los mismos campos que el formulario de presupuestos, lista para pegar en "Importar con IA".

Funciona con texto, con imágenes, o con las dos cosas a la vez.

---

## Qué necesitás (una sola vez)

1. **Una clave de la API de Claude** (es lo que hace la "magia" de leer y ordenar).
2. **Una cuenta de Vercel** (gratis) para publicar la web y tener tu propio link.

No hace falta saber programar: son pasos de copiar y pegar.

---

## Paso 1 — Sacar tu clave de Claude

1. Entrá a **console.anthropic.com** y creá tu cuenta.
2. En el menú, andá a **API Keys → Create Key**. Ponele un nombre (ej: "conversor") y copiá la clave. **Ojo: se muestra una sola vez**, guardala en un lugar seguro.
3. Andá a **Billing** y cargá un poco de crédito. Al crear la cuenta solés tener **USD 5 gratis**, que para esto te rinde un montón (ver costos abajo).

## Paso 2 — Publicar la web en Vercel

La forma más directa es con la terminal:

1. Instalá **Node.js** (versión LTS) desde **nodejs.org**.
2. Abrí una terminal **dentro de esta carpeta** (la que tiene `index.html`).
3. Instalá Vercel:
   ```
   npm i -g vercel
   ```
4. Iniciá sesión (te pide tu mail):
   ```
   vercel login
   ```
5. Subí el proyecto (apretá Enter a todas las preguntas):
   ```
   vercel
   ```
   Esto te da un primer link de prueba.
6. Cargá tu clave como variable de entorno:
   ```
   vercel env add ANTHROPIC_API_KEY
   ```
   Pegá tu clave cuando la pida y elegí **Production** (podés agregar también Preview y Development).
7. Publicá la versión final:
   ```
   vercel --prod
   ```
   Listo: ese es **tu link propio**. Guardalo o ponelo en favoritos.

> Si más adelante querés cambiar algo del diseño o de los campos, editás los archivos y volvés a correr `vercel --prod`.

---

## Costos reales

Usa el modelo **Claude Sonnet 4.6**: **USD 3 por millón de tokens de entrada** y **USD 15 por millón de salida**.

En la práctica, cada ficha que armás cuesta **unos pocos centavos de dólar** (aprox. 2 a 6 centavos, según cuántas imágenes mandes). Con los **USD 5 gratis** del inicio te alcanza para **cientos de cotizaciones**. Solo pagás por lo que usás.

## Seguridad

Tu clave queda guardada en Vercel como variable de entorno del servidor. **Nunca aparece en la web ni en el navegador**, así que nadie que entre a tu link la puede ver.

## Notas

- Si subís **muchas fotos pesadas juntas** puede fallar por límite de tamaño. Mandá menos fotos por vez o más livianas.
- La ficha es un punto de partida: **revisá y ajustá** antes de guardar el presupuesto. Si ves que algún campo lo lee siempre torcido, se puede afinar el formato (está en `api/convertir.js`).

## Qué hay en cada archivo

- `index.html` — la página que ves y usás.
- `api/convertir.js` — el "cerebro": recibe lo que pegás, llama a Claude y devuelve la ficha. Acá vive el formato de la ficha y se puede ajustar.
- `package.json` — config mínima del proyecto.
