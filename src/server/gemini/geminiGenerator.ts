/**
 * Orquestrador central de geração de roteiros com o Google Gemini.
 * Executa o fluxo obrigatório:
 * 1. Validação de entrada
 * 2. Contexto estruturado e prompt com tags semânticas
 * 3. Chamada ao Gemini com timeout e AbortController
 * 4. Parse JSON
 * 5. Validação de Schema e Invariantes (placeIds, datas, justificativas concisas)
 * 6. Devolução da resposta segura e tipada ao cliente.
 */

import { SmartTripItinerary } from '../../types/itinerary';
import { validateItinerary } from '../../services/itinerary/itineraryValidator';
import {
  PROMPT_VERSION,
  getGeminiSystemInstructions,
  buildGeminiTaskPrompt,
  PromptContextPayload,
} from './promptTemplate';
import { geminiItineraryResponseSchema } from './schema';

export interface GenerateItineraryInput {
  destination: {
    id?: string;
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  startDate: string;
  endDate: string;
  preferences?: {
    travelStyle?: string;
    budgetLevel?: string;
    pace?: string;
    dietaryRestrictions?: string[];
    userNotes?: string;
  };
  weatherDays?: Array<{
    date: string;
    hasForecast: boolean;
    tempMin: number | null;
    tempMax: number | null;
    condition: any;
    observation?: string;
  }>;
  places: Array<{
    id: string;
    name: string;
    category?: string;
    address?: string;
    latitude: number;
    longitude: number;
  }>;
  // Opções para testes controlados
  mockResponseText?: string;
  forceTimeout?: boolean;
  forceUnavailable?: boolean;
}

export interface GenerateItineraryResult {
  success: boolean;
  itinerary?: SmartTripItinerary;
  promptVersion: string;
  source: 'gemini' | 'heuristic_fallback';
  durationMs: number;
  error?: {
    code: string;
    message: string;
    userMessage: string;
    details?: any;
  };
}

/**
 * Validação rigorosa dos dados de entrada antes da chamada ao modelo.
 */
export function validateGenerationInput(input: GenerateItineraryInput): { valid: boolean; error?: string } {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Payload de requisição não fornecido.' };
  }

  // 1. Destino
  if (!input.destination || !input.destination.name || !input.destination.country) {
    return { valid: false, error: 'Dados do destino incompletos (name e country são mandatórios).' };
  }
  if (
    typeof input.destination.latitude !== 'number' ||
    typeof input.destination.longitude !== 'number' ||
    isNaN(input.destination.latitude) ||
    isNaN(input.destination.longitude)
  ) {
    return { valid: false, error: 'Coordenadas do destino inválidas ou incompletas.' };
  }

  // 2. Datas
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(input.startDate) || !isoDateRegex.test(input.endDate)) {
    return { valid: false, error: 'Formato de data inválido. Utilize o padrão ISO YYYY-MM-DD.' };
  }

  const startMs = new Date(`${input.startDate}T00:00:00Z`).getTime();
  const endMs = new Date(`${input.endDate}T00:00:00Z`).getTime();
  if (isNaN(startMs) || isNaN(endMs)) {
    return { valid: false, error: 'Datas fornecidas são inválidas.' };
  }
  if (endMs < startMs) {
    return { valid: false, error: 'A data de término deve ser igual ou posterior à data de início.' };
  }

  const totalDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
  if (totalDays < 1 || totalDays > 7) {
    return {
      valid: false,
      error: `Duração da viagem (${totalDays} dias) fora dos limites permitidos pelo MVP (mínimo 1 dia, máximo 7 dias).`,
    };
  }

  // 3. Lugares (Grounding mandatório)
  if (!Array.isArray(input.places) || input.places.length === 0) {
    return { valid: false, error: 'A lista de lugares de interesse permitidos para grounding é mandatória.' };
  }
  for (const p of input.places) {
    if (!p.id || !p.name) {
      return { valid: false, error: 'Todos os lugares devem conter identificador "id" e "name".' };
    }
  }

  return { valid: true };
}

/**
 * Invoca o serviço Gemini e orquestra validações estruturais e de invariantes.
 */
export async function executeGeminiGeneration(input: GenerateItineraryInput): Promise<GenerateItineraryResult> {
  const startTime = Date.now();

  // 1. Validação de Entrada
  const inputCheck = validateGenerationInput(input);
  if (!inputCheck.valid) {
    return {
      success: false,
      promptVersion: PROMPT_VERSION,
      source: 'gemini',
      durationMs: Date.now() - startTime,
      error: {
        code: 'INVALID_INPUT',
        message: inputCheck.error!,
        userMessage: 'Os dados informados para a viagem estão incompletos ou fora dos limites.',
      },
    };
  }

  const startMs = new Date(`${input.startDate}T00:00:00Z`).getTime();
  const endMs = new Date(`${input.endDate}T00:00:00Z`).getTime();
  const totalDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1;

  // 2. Montagem do Contexto Estruturado
  const promptPayload: PromptContextPayload = {
    destination: input.destination,
    startDate: input.startDate,
    endDate: input.endDate,
    totalDays,
    preferences: input.preferences || {},
    weatherDays: (input.weatherDays || []).map((w) => ({
      date: w.date,
      hasForecast: w.hasForecast,
      tempMin: w.tempMin,
      tempMax: w.tempMax,
      condition: typeof w.condition === 'string' ? w.condition : 'Desconhecido',
    })),
    places: input.places.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category || 'atração',
      address: p.address || `${input.destination.name}, ${input.destination.country}`,
      latitude: p.latitude,
      longitude: p.longitude,
    })),
  };

  const systemInstruction = getGeminiSystemInstructions();
  const taskPrompt = buildGeminiTaskPrompt(promptPayload);
  const allowedPlaceIds = new Set(input.places.map((p) => p.id));

  // 3. Simulação controlada de erros para suíte de testes adversariais
  if (input.forceTimeout) {
    return {
      success: false,
      promptVersion: PROMPT_VERSION,
      source: 'gemini',
      durationMs: Date.now() - startTime,
      error: {
        code: 'GEMINI_TIMEOUT',
        message: 'A requisição ao modelo Gemini excedeu o tempo limite máximo de 12.000 ms.',
        userMessage: 'O tempo limite de geração foi atingido. Tente novamente em instantes.',
      },
    };
  }

  if (input.forceUnavailable) {
    return {
      success: false,
      promptVersion: PROMPT_VERSION,
      source: 'gemini',
      durationMs: Date.now() - startTime,
      error: {
        code: 'GEMINI_UNAVAILABLE',
        message: 'O serviço do Google Gemini retornou indisponibilidade temporária (HTTP 503).',
        userMessage: 'O serviço de inteligência artificial está temporariamente indisponível.',
      },
    };
  }

  // 4. Execução do Gemini (Real ou Mock de Teste ou Fallback Heurístico)
  let rawResponseText: string;
  let usedSource: 'gemini' | 'heuristic_fallback' = 'gemini';

  const apiKey = process.env.GEMINI_API_KEY;

  if (input.mockResponseText !== undefined) {
    rawResponseText = input.mockResponseText;
  } else if (apiKey && apiKey.trim() !== '') {
    try {
      rawResponseText = await callGeminiApiDirectly({
        apiKey,
        systemInstruction,
        taskPrompt,
        timeoutMs: 12000,
      });
    } catch (apiErr: any) {
      if (apiErr.code === 'GEMINI_TIMEOUT' || apiErr.code === 'GEMINI_RATE_LIMITED') {
        return {
          success: false,
          promptVersion: PROMPT_VERSION,
          source: 'gemini',
          durationMs: Date.now() - startTime,
          error: {
            code: apiErr.code,
            message: apiErr.message,
            userMessage: apiErr.userMessage || 'Falha ao comunicar com o modelo Gemini.',
          },
        };
      }
      console.warn('[Gemini Service] Falha na chamada da API externa, ativando gerador heurístico:', apiErr.message);
      usedSource = 'heuristic_fallback';
      rawResponseText = JSON.stringify(generateHeuristicItinerary(input, promptPayload));
    }
  } else {
    // Chave ausente: Fallback determinístico de alta fidelidade
    usedSource = 'heuristic_fallback';
    rawResponseText = JSON.stringify(generateHeuristicItinerary(input, promptPayload));
  }

  // 5. Parse JSON
  if (!rawResponseText || rawResponseText.trim() === '') {
    return {
      success: false,
      promptVersion: PROMPT_VERSION,
      source: usedSource,
      durationMs: Date.now() - startTime,
      error: {
        code: 'EMPTY_RESPONSE',
        message: 'O modelo Gemini retornou uma resposta textual vazia.',
        userMessage: 'Não foi possível estruturar o roteiro porque a IA retornou um conteúdo vazio.',
      },
    };
  }

  let parsedJson: any;
  try {
    parsedJson = JSON.parse(rawResponseText);
  } catch (parseErr: any) {
    return {
      success: false,
      promptVersion: PROMPT_VERSION,
      source: usedSource,
      durationMs: Date.now() - startTime,
      error: {
        code: 'INVALID_JSON',
        message: `Falha sintática no parse do JSON gerado: ${parseErr.message}`,
        userMessage: 'A inteligência artificial retornou um formato que não pôde ser interpretado.',
      },
    };
  }

  // 6. Validação do Schema e dos Invariantes (Grounding de placeIds, Limites de Datas, Justificativa < 200)
  const validationResult = validateItinerary(parsedJson, {
    allowedPlaceIds: Array.from(allowedPlaceIds),
    allowedPois: input.places.map((p) => ({ id: p.id, name: p.name })),
  });

  if (!validationResult.isValid || !validationResult.data) {
    const priorityErr =
      validationResult.errors.find((e) => e.code === 'UNKNOWN_PLACE_ID') ||
      validationResult.errors.find((e) => e.code === 'DATE_OUT_OF_RANGE') ||
      validationResult.errors.find((e) => e.code === 'DATE_GAP_DETECTED') ||
      validationResult.errors[0];

    return {
      success: false,
      promptVersion: PROMPT_VERSION,
      source: usedSource,
      durationMs: Date.now() - startTime,
      error: {
        code: priorityErr ? priorityErr.code : 'SCHEMA_VALIDATION_FAILED',
        message: priorityErr?.detail || 'Violação de invariantes no contrato de dados do roteiro.',
        userMessage: priorityErr ? priorityErr.userMessage : 'O roteiro gerado violou as regras de validação estrutural.',
        details: validationResult.errors,
      },
    };
  }

  // 7. Resposta Segura e Aprovada
  return {
    success: true,
    itinerary: validationResult.data,
    promptVersion: PROMPT_VERSION,
    source: usedSource,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Chamada à API REST oficial do Google Gemini com timeout e AbortController.
 */
async function callGeminiApiDirectly(options: {
  apiKey: string;
  systemInstruction: string;
  taskPrompt: string;
  timeoutMs: number;
}): Promise<string> {
  const modelName = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(
    options.apiKey
  )}`;

  const controller = new AbortController();
  const timeoutTimer = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: options.systemInstruction }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: options.taskPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.85,
          topK: 40,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
          responseSchema: geminiItineraryResponseSchema,
        },
      }),
    });

    clearTimeout(timeoutTimer);

    if (!response.ok) {
      if (response.status === 429) {
        const err: any = new Error('Limite de requisições por minuto excedido no Google Gemini (HTTP 429).');
        err.code = 'GEMINI_RATE_LIMITED';
        err.userMessage = 'Atingimos o limite temporário de requisições da IA. Aguarde alguns instantes.';
        throw err;
      }
      const errBody = await response.text().catch(() => '');
      const err: any = new Error(`Erro na API do Gemini: HTTP ${response.status} - ${errBody}`);
      err.code = 'GEMINI_API_ERROR';
      throw err;
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Candidato de resposta retornado pela API do Gemini não contém texto.');
    }

    return text;
  } catch (err: any) {
    clearTimeout(timeoutTimer);
    if (err.name === 'AbortError') {
      const timeoutErr: any = new Error(`Tempo limite de ${options.timeoutMs}ms excedido na chamada ao Gemini.`);
      timeoutErr.code = 'GEMINI_TIMEOUT';
      timeoutErr.userMessage = 'A inteligência artificial demorou muito para responder. Tente novamente.';
      throw timeoutErr;
    }
    throw err;
  }
}

/**
 * Gerador Heurístico Determinístico de Alta Fidelidade.
 * Usado em ambiente de teste ou quando a chave externa não estiver presente,
 * garantindo fidelidade absoluta às regras da SPEC e ao contrato.
 */
export function generateHeuristicItinerary(
  input: GenerateItineraryInput,
  payload: PromptContextPayload
): SmartTripItinerary {
  const destination = payload.destination;
  const places = payload.places;
  const startDate = payload.startDate;
  const endDate = payload.endDate;
  const totalDays = payload.totalDays;

  const periods: Array<'manha' | 'tarde' | 'noite'> = ['manha', 'tarde', 'noite'];
  const times = {
    manha: '09:30',
    tarde: '14:30',
    noite: '20:00',
  };

  const days: SmartTripItinerary['days'] = [];

  for (let i = 0; i < totalDays; i++) {
    const dayNumber = i + 1;
    const currentDayDate = new Date(`${startDate}T00:00:00Z`);
    currentDayDate.setUTCDate(currentDayDate.getUTCDate() + i);
    const dateStr = currentDayDate.toISOString().split('T')[0];

    const weatherDay = payload.weatherDays.find((w) => w.date === dateStr);
    let dayWeather = {
      hasForecast: false,
      tempMin: null as number | null,
      tempMax: null as number | null,
      condition: 'Desconhecido' as const,
      observation: 'Data fora do horizonte da previsão meteorológica imediata.',
    };

    if (weatherDay && weatherDay.hasForecast) {
      dayWeather = {
        hasForecast: true,
        tempMin: weatherDay.tempMin,
        tempMax: weatherDay.tempMax,
        condition: (weatherDay.condition as any) || 'Parcialmente Nublado',
        observation: `${weatherDay.condition}, máxima de ${Math.round(weatherDay.tempMax || 22)}°C e mínima de ${Math.round(
          weatherDay.tempMin || 15
        )}°C.`,
      };
    }

    const dayActivities: SmartTripItinerary['days'][0]['activities'] = [];
    const numActivities = Math.min(periods.length, Math.max(1, places.length));

    for (let pIdx = 0; pIdx < numActivities; pIdx++) {
      const placeIndex = (i * 2 + pIdx) % places.length;
      const place = places[placeIndex];
      const period = periods[pIdx];

      dayActivities.push({
        placeId: place.id,
        name: place.name,
        period,
        timeSlot: times[period],
        rationale: `Visita recomendada em ${destination.name} com foco em ${place.category}, combinando com o ritmo planejado.`.slice(0, 195),
        estimatedDuration: '2h',
        curatorTip: 'Recomenda-se calçado confortável para caminhada.',
      });
    }

    days.push({
      dayNumber,
      date: dateStr,
      theme: `Dia ${dayNumber}: Destaques Culturais e Atrações`,
      weather: dayWeather,
      alerts: [],
      activities: dayActivities,
    });
  }

  return {
    title: `Roteiro Inteligente em ${destination.name}`,
    summary: `Plano estruturado de ${totalDays} dias em ${destination.name}, ${destination.country}, contemplando atrações culturais, gastronômicas e pontos de interesse locais de acordo com as preferências selecionadas.`,
    destinationId: input.destination.id || `dest_${destination.name.toLowerCase().replace(/\s+/g, '_')}`,
    startDate,
    endDate,
    alerts: [
      'Valores de ingressos e taxas turísticas são estimativas de referência.',
      'Recomenda-se confirmar a abertura de museus e parques em feriados locais.',
    ],
    days,
  };
}
