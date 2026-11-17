const ALLOWED_ORIGIN = "https://dantexdev-png.github.io";
const MODEL = "gemini-2.5-flash";

function cors(origin) {
  const allowed = origin === ALLOWED_ORIGIN || origin === "http://localhost:8788";
  return {
    "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}
function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors(origin) }
  });
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    if (origin !== ALLOWED_ORIGIN && origin !== "http://localhost:8788") return json({ error: "Origem não autorizada." }, 403, origin);
    if (request.method !== "POST") return json({ error: "Use POST." }, 405, origin);
    if (!env.GEMINI_API_KEY) return json({ error: "Configure GEMINI_API_KEY nos Secrets do Worker." }, 500, origin);
    try {
      const body = await request.json();
      const frames = body.frames;
      if (!Array.isArray(frames) || frames.length < 1 || frames.length > 6 ||
          frames.some(frame => typeof frame !== "string" || frame.length > 1800000)) {
        return json({ error: "Envie de 1 a 6 quadros JPEG válidos." }, 400, origin);
      }
      const productName = String(body.context?.productName || "").slice(0,120);
      const category = String(body.context?.category || "").slice(0,80);
      const parts = [{
        text: "Analise os quadros deste vídeo de produto para criar conteúdo em português brasileiro para um Reel de ofertas.\n" +
          "Contexto informado: produto=" + productName + ", categoria=" + category + ".\n" +
          "Não invente marca, preço, especificações, materiais, resultados ou benefícios. Se algo não estiver claramente visível, omita. " +
          "Identifique com descrição curta e genérica quando necessário. Crie uma headline curta e chamativa sem alegações enganosas. " +
          "Benefícios devem ser apenas observações visuais confiáveis. Responda SOMENTE JSON válido com: " +
          'productName (string), category (string), headline (string), benefits (array de até 4 strings), caption (string). ' +
          "Se não conseguir identificar, use strings vazias e explique brevemente em benefits."
      }];
      for (const frame of frames) parts.push({ inlineData: { mimeType: "image/jpeg", data: frame } });

      const upstream = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            generationConfig: { temperature: 0.25, responseMimeType: "application/json" }
          })
        }
      );
      const payload = await upstream.json().catch(() => ({}));
      if (!upstream.ok) return json({ error: payload.error?.message || "Falha na API Gemini." }, upstream.status, origin);
      const raw = payload.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim();
      if (!raw) return json({ error: "O Gemini não retornou uma análise. Tente novamente." }, 502, origin);
      let result;
      try { result = JSON.parse(raw); }
      catch { return json({ error: "A resposta da IA veio em formato inesperado. Tente novamente." }, 502, origin); }
      return json({ result }, 200, origin);
    } catch (error) {
      return json({ error: error?.message || "Erro interno no Worker." }, 500, origin);
    }
  }
};
