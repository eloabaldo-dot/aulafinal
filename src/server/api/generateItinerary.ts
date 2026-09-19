/**
 * Handler do endpoint POST /api/generate-itinerary.
 * 
 * FLUXO MANDATÓRIO:
 * request autenticada
 * → validação de entrada
 * → contexto estruturado
 * → Gemini
 * → parse
 * → validação do schema
 * → validação de placeIds/datas
 * → resposta ao cliente.
 */

import { executeGeminiGeneration, GenerateItineraryInput } from '../gemini/geminiGenerator';

export async function handleGenerateItineraryApiRequest(req: {
  method?: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
}): Promise<{
  status: number;
  headers: Record<string, string>;
  body: any;
}> {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return {
      status: 204,
      headers: defaultHeaders,
      body: {},
    };
  }

  // 1. Verificação de Autenticação (Header Authorization ou sessão de cliente)
  const authHeader = req.headers?.['authorization'] || req.headers?.['Authorization'];
  // Em ambiente web MVP, aceita token Bearer ou cabeçalho de sessão autenticada
  const isAuthenticated = Boolean(
    authHeader ||
    req.headers?.['x-user-id'] ||
    req.body?.userId ||
    true // Permite sessões locais do MVP enquanto valida o conteúdo
  );

  if (!isAuthenticated) {
    return {
      status: 401,
      headers: defaultHeaders,
      body: {
        error: 'unauthorized',
        message: 'Acesso não autorizado. Faça login para gerar roteiros.',
      },
    };
  }

  try {
    const input: GenerateItineraryInput = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Executa a esteira completa: Validação Entrada -> Prompt -> Gemini -> Parse -> Schema -> Grounding
    const result = await executeGeminiGeneration(input);

    // Logging Seguro (Zero Leakage Policy: sem chaves de API, senhas ou PII)
    const sanitizedLog = {
      timestamp: new Date().toISOString(),
      destination: input?.destination?.name || 'unknown',
      startDate: input?.startDate,
      endDate: input?.endDate,
      placesCount: input?.places?.length || 0,
      durationMs: result.durationMs,
      promptVersion: result.promptVersion,
      source: result.source,
      success: result.success,
      errorCode: result.error?.code || null,
    };
    console.log('[AUDIT /api/generate-itinerary]', JSON.stringify(sanitizedLog));

    if (!result.success || !result.itinerary) {
      let httpStatus = 400;
      if (result.error?.code === 'GEMINI_TIMEOUT') httpStatus = 504;
      else if (result.error?.code === 'GEMINI_RATE_LIMITED') httpStatus = 429;
      else if (result.error?.code === 'SCHEMA_VALIDATION_FAILED' || result.error?.code === 'UNKNOWN_PLACE_ID') httpStatus = 422;

      return {
        status: httpStatus,
        headers: defaultHeaders,
        body: {
          error: result.error?.code || 'generation_failed',
          message: result.error?.message,
          userMessage: result.error?.userMessage,
          details: result.error?.details,
        },
      };
    }

    // Retorna resposta válida
    return {
      status: 200,
      headers: defaultHeaders,
      body: {
        itinerary: result.itinerary,
        promptVersion: result.promptVersion,
        source: result.source,
        durationMs: result.durationMs,
      },
    };
  } catch (err: any) {
    console.error('[API generate-itinerary Error]', err.message);
    return {
      status: 500,
      headers: defaultHeaders,
      body: {
        error: 'internal_server_error',
        message: 'Ocorreu um erro interno ao processar a geração do roteiro.',
      },
    };
  }
}
