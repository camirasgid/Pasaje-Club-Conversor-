// Función serverless: recibe el texto/imágenes y devuelve la ficha ordenada.
// La clave de la API se lee de una variable de entorno del servidor (nunca se expone en la web).

const SYSTEM_PROMPT = `Sos un asistente que ordena la información de un viaje para cargarla en un sistema de presupuestos de una agencia.
A partir del mail del operador y/o de las imágenes/PDF que te manden (vuelos, hoteles, etc.), devolvés UNA ficha con este formato EXACTO y nada más (sin saludos, sin comentarios, sin markdown, sin asteriscos):

DESTINO:
CLIENTE:
SALIDA:    REGRESO:
ORIGEN:
COTIZACIÓN PARA:
TIPO:

VUELO — [título, ej: Aéreo internacional]
AEROLÍNEA:
EQUIPAJE:
IDA: [origen cód] → [destino cód] | [fecha] [hora salida] → [fecha] [hora llegada] | [duración]
ESCALA IDA: [lugar/cód] | [tiempo de espera]
VUELTA: [origen cód] → [destino cód] | [fecha] [hora salida] → [fecha] [hora llegada] | [duración]
ESCALA VUELTA: [lugar/cód] | [tiempo de espera]
NOTA:

ALOJAMIENTO 1
NOMBRE:    ESTRELLAS:    RATING:    NOCHES:
UBICACIÓN:
HABITACIÓN:
RÉGIMEN / QUÉ INCLUYE:
AMENITIES:
PRECIO POR PERSONA:    (Seña ... + N cuotas de ...)

TRASLADOS:
ASISTENCIA AL VIAJERO:
ITINERARIO:
MONEDA:
PRECIO FINAL POR PERSONA:
SEÑA POR PERSONA:    SALDO ANTES DE:
CANTIDAD DE CUOTAS:    MONTO POR CUOTA:
PRECIO TOTAL DEL PAQUETE:
FORMAS DE PAGO:

REGLAS IMPORTANTES:
- No inventes datos. Si un campo no aparece en la fuente, dejalo vacío después de los dos puntos.
- ESCALAS: revisá con cuidado cada conexión. Si un tramo tiene escala, indicá lugar y tiempo de espera. Si hay varias escalas en un tramo, listalas todas (ESCALA IDA 1, ESCALA IDA 2, etc.). Si un vuelo es directo, dejá la línea de escala vacía.
- Si hay más de un tramo además de ida y vuelta, agregá líneas con el mismo formato.
- HOTELES: si hay más de un hotel cotizado, repetí el bloque completo como ALOJAMIENTO 2, ALOJAMIENTO 3, etc. En "RÉGIMEN / QUÉ INCLUYE" poné si es all inclusive, media pensión, desayuno, etc., y todo lo que el alojamiento incluya.
- Fechas en formato dd/mm/aaaa y horas en 24hs.
- Mantené los montos con su moneda tal como figuran (USD, US$, $, etc.).
- Si en imágenes de vuelo aparecen datos como TUUA, tasas, cargos por conexión o avisos, ponelos en NOTA.
- Respondé en español. Devolvé SOLO la ficha, sin texto adicional antes ni después.`;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido." });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Falta configurar ANTHROPIC_API_KEY en el servidor (Vercel → Settings → Environment Variables)." });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const emailText = body.emailText || "";
    const files = Array.isArray(body.files) ? body.files : [];

    const content = [];
    for (const f of files) {
      if (f.kind === "pdf") {
        content.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: f.base64 },
        });
      } else if (f.base64) {
        content.push({
          type: "image",
          source: { type: "base64", media_type: f.mediaType || "image/jpeg", data: f.base64 },
        });
      }
    }
    content.push({
      type: "text",
      text:
        "Armá la ficha con esta información.\n\nMAIL / TEXTO DEL OPERADOR (puede estar desordenado o vacío):\n" +
        (emailText.trim() || "(sin texto, usar solo los archivos adjuntos)"),
    });

    const apiResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content }],
      }),
    });

    const data = await apiResp.json();

    if (data.error) {
      res.status(500).json({ error: data.error.message || "La API devolvió un error." });
      return;
    }

    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!text) {
      res.status(200).json({ error: "No se pudo leer la información. Probá con un texto más completo o una imagen más clara." });
      return;
    }

    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: "Error procesando la solicitud. Si subiste muchas fotos pesadas, probá con menos o más livianas." });
  }
};
