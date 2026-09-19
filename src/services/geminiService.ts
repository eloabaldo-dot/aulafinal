/**
 * Serviço client-side e ponto de entrada para o Gerador de Roteiros com Gemini (RF-007, RF-008).
 * 
 * Invoca a rota segura de backend POST /api/generate-itinerary garantindo que
 * a chave GEMINI_API_KEY permaneça exclusivamente no servidor.
 */

import { SmartTripItinerary } from '../types/itinerary';
import { GenerateItineraryInput, executeGeminiGeneration } from '../server/gemini/geminiGenerator';
import { PROMPT_VERSION } from '../server/gemini/promptTemplate';

export { PROMPT_VERSION };
export type { GenerateItineraryInput };

export class GeminiServiceError extends Error {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly details?: any;

  constructor(code: string, message: string, userMessage: string, details?: any) {
    super(message);
    this.name = 'GeminiServiceError';
    this.code = code;
    this.userMessage = userMessage;
    this.details = details;
  }
}

/**
 * Invoca o serviço de geração de roteiro.
 * Em ambiente de navegador, chama o endpoint seguro POST /api/generate-itinerary.
 * Em ambiente Node.js / servidor direto, executa a esteira server-side.
 */
export async function generateItineraryWithGemini(
  input: GenerateItineraryInput,
  options?: { signal?: AbortSignal; authToken?: string }
): Promise<SmartTripItinerary> {
  const isBrowser = typeof window !== 'undefined' && typeof window.fetch === 'function';

  if (isBrowser) {
    try {
      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options?.authToken ? { Authorization: `Bearer ${options.authToken}` } : {}),
        },
        body: JSON.stringify(input),
        signal: options?.signal,
      });

      const body = await response.json();

      if (!response.ok || !body.itinerary) {
        throw new GeminiServiceError(
          body.error || 'GENERATION_ERROR',
          body.message || `Erro HTTP ${response.status} ao gerar roteiro`,
          body.userMessage || 'Não foi possível gerar o roteiro com a inteligência artificial. Tente novamente.',
          body.details
        );
      }

      return body.itinerary;
    } catch (err: any) {
      if (err instanceof GeminiServiceError) {
        throw err;
      }
      if (err.name === 'AbortError') {
        throw new GeminiServiceError(
          'GEMINI_TIMEOUT',
          'A requisição foi abortada por tempo limite.',
          'O tempo limite de geração foi atingido. Tente novamente.'
        );
      }
      throw new GeminiServiceError(
        'NETWORK_ERROR',
        `Falha de comunicação com o backend de roteiros: ${err.message}`,
        'Não foi possível conectar ao servidor para gerar seu roteiro. Verifique sua conexão.'
      );
    }
  }

  // Execução direta em ambiente de teste ou Node.js
  const result = await executeGeminiGeneration(input);
  if (!result.success || !result.itinerary) {
    throw new GeminiServiceError(
      result.error?.code || 'GENERATION_ERROR',
      result.error?.message || 'Falha na geração do roteiro',
      result.error?.userMessage || 'Erro ao processar dados com o Gemini.',
      result.error?.details
    );
  }

  return result.itinerary;
}

export const geminiService = {
  generateItinerary: generateItineraryWithGemini,
  promptVersion: PROMPT_VERSION,
};
