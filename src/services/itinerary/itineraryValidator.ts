import {
  SmartTripItinerary,
  ItineraryDay,
  ItineraryActivity,
  ItineraryDayWeather,
  ValidationResult,
  ItineraryValidationError,
  ItineraryValidationErrorCode,
} from '../../types/itinerary';
import { WeatherCondition } from '../../types/weather';

const ALLOWED_ROOT_KEYS = new Set([
  'title',
  'summary',
  'destinationId',
  'startDate',
  'endDate',
  'alerts',
  'days',
]);

const ALLOWED_DAY_KEYS = new Set([
  'dayNumber',
  'date',
  'theme',
  'weather',
  'alerts',
  'activities',
]);

const ALLOWED_WEATHER_KEYS = new Set([
  'hasForecast',
  'tempMin',
  'tempMax',
  'condition',
  'observation',
]);

const ALLOWED_ACTIVITY_KEYS = new Set([
  'placeId',
  'name',
  'period',
  'timeSlot',
  'rationale',
  'estimatedDuration',
  'curatorTip',
]);

const VALID_CONDITIONS = new Set<WeatherCondition>([
  'Ensolarado',
  'Parcialmente Nublado',
  'Nublado',
  'Chuvoso',
  'Tempestade',
  'Neve',
  'Desconhecido',
]);

export interface ItineraryValidationOptions {
  allowedPlaceIds?: string[];
  allowedPois?: Array<{ id: string; name: string }>;
  rejectExtraProperties?: boolean;
}

export function validateItinerary(
  raw: unknown,
  options?: ItineraryValidationOptions
): ValidationResult<SmartTripItinerary> {
  const errors: ItineraryValidationError[] = [];

  function addError(
    code: ItineraryValidationErrorCode,
    field: string,
    detail: string,
    userMessage: string
  ) {
    errors.push({ code, field, detail, userMessage });
  }

  // 1. Objeto base
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    addError(
      'INVALID_TYPE',
      'root',
      'Payload do roteiro deve ser um objeto JSON não nulo.',
      'O roteiro recebido não possui uma estrutura válida.'
    );
    return { isValid: false, errors };
  }

  const data = raw as Record<string, any>;
  const rejectExtra = options?.rejectExtraProperties ?? true;

  // 2. Propriedades extras na raiz
  if (rejectExtra) {
    for (const key of Object.keys(data)) {
      if (!ALLOWED_ROOT_KEYS.has(key)) {
        addError(
          'EXTRA_FIELDS_DISALLOWED',
          key,
          `Propriedade não permitida na raiz do roteiro: '${key}'.`,
          `O roteiro contém dados extras não reconhecidos (${key}).`
        );
      }
    }
  }

  // 3. Título
  if (data.title === undefined || data.title === null) {
    addError(
      'REQUIRED_FIELD_MISSING',
      'title',
      'Campo obrigatório "title" ausente.',
      'O roteiro precisa de um título descritivo.'
    );
  } else if (typeof data.title !== 'string') {
    addError(
      'INVALID_TYPE',
      'title',
      `Campo "title" deve ser uma string, recebido: ${typeof data.title}.`,
      'O título do roteiro deve ser um texto.'
    );
  } else if (data.title.trim().length < 5 || data.title.trim().length > 100) {
    addError(
      'STRING_LENGTH_OUT_OF_BOUNDS',
      'title',
      `"title" possui ${data.title.trim().length} caracteres (esperado entre 5 e 100).`,
      'O título do roteiro deve conter entre 5 e 100 caracteres.'
    );
  }

  // 4. Resumo (summary)
  if (data.summary === undefined || data.summary === null) {
    addError(
      'REQUIRED_FIELD_MISSING',
      'summary',
      'Campo obrigatório "summary" ausente.',
      'O roteiro precisa de um resumo geral.'
    );
  } else if (typeof data.summary !== 'string') {
    addError(
      'INVALID_TYPE',
      'summary',
      `Campo "summary" deve ser uma string, recebido: ${typeof data.summary}.`,
      'O resumo do roteiro deve ser um texto.'
    );
  } else if (data.summary.trim().length < 20 || data.summary.trim().length > 400) {
    addError(
      'STRING_LENGTH_OUT_OF_BOUNDS',
      'summary',
      `"summary" possui ${data.summary.trim().length} caracteres (esperado entre 20 e 400).`,
      'O resumo deve conter entre 20 e 400 caracteres.'
    );
  }

  // 5. Destino
  if (!data.destinationId || typeof data.destinationId !== 'string' || !data.destinationId.trim()) {
    addError(
      'REQUIRED_FIELD_MISSING',
      'destinationId',
      'Campo obrigatório "destinationId" ausente ou inválido.',
      'Identificador do destino não informado.'
    );
  }

  // 6. Datas da Viagem
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  let isDatesValid = true;

  if (!data.startDate || typeof data.startDate !== 'string' || !dateRegex.test(data.startDate)) {
    addError(
      'REQUIRED_FIELD_MISSING',
      'startDate',
      'Data de início "startDate" ausente ou com formato diferente de YYYY-MM-DD.',
      'A data de início da viagem é inválida ou não foi informada.'
    );
    isDatesValid = false;
  }

  if (!data.endDate || typeof data.endDate !== 'string' || !dateRegex.test(data.endDate)) {
    addError(
      'REQUIRED_FIELD_MISSING',
      'endDate',
      'Data de término "endDate" ausente ou com formato diferente de YYYY-MM-DD.',
      'A data de término da viagem é inválida ou não foi informada.'
    );
    isDatesValid = false;
  }

  let expectedDateStrings: string[] = [];
  if (isDatesValid) {
    const start = new Date(data.startDate + 'T00:00:00Z');
    const end = new Date(data.endDate + 'T00:00:00Z');

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      addError('DATE_OUT_OF_RANGE', 'dates', 'Datas informadas são inexistentes no calendário.', 'Datas do calendário inválidas.');
      isDatesValid = false;
    } else if (end < start) {
      addError(
        'DATE_OUT_OF_RANGE',
        'endDate',
        `Data final (${data.endDate}) é anterior à data inicial (${data.startDate}).`,
        'A data de término não pode ser anterior à data de início.'
      );
      isDatesValid = false;
    } else {
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      for (let i = 0; i < diffDays; i++) {
        const cur = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
        expectedDateStrings.push(cur.toISOString().slice(0, 10));
      }
    }
  }

  // 7. Alertas globais
  if (data.alerts !== undefined && !Array.isArray(data.alerts)) {
    addError(
      'INVALID_TYPE',
      'alerts',
      'Campo "alerts" deve ser um array de strings quando presente.',
      'Alertas do roteiro devem ser fornecidos como uma lista.'
    );
  }

  // 8. Dias (days)
  if (!data.days) {
    addError(
      'REQUIRED_FIELD_MISSING',
      'days',
      'Campo obrigatório "days" ausente.',
      'O roteiro não contém a lista de dias planejados.'
    );
    return { isValid: false, errors };
  }

  if (!Array.isArray(data.days)) {
    addError(
      'INVALID_TYPE',
      'days',
      `Campo "days" deve ser um array, recebido: ${typeof data.days}.`,
      'A lista de dias do roteiro deve ser um array.'
    );
    return { isValid: false, errors };
  }

  if (data.days.length === 0) {
    addError(
      'EMPTY_COLLECTION_DISALLOWED',
      'days',
      'Array "days" não pode estar vazio.',
      'O roteiro precisa ter ao menos 1 dia planejado.'
    );
    return { isValid: false, errors };
  }

  if (isDatesValid && expectedDateStrings.length > 0) {
    if (data.days.length !== expectedDateStrings.length) {
      addError(
        'DATE_GAP_DETECTED',
        'days',
        `Quantidade de dias entregues (${data.days.length}) difere do total de dias da viagem (${expectedDateStrings.length}).`,
        'A quantidade de dias gerados não coincide com a duração total da viagem.'
      );
    }
  }

  // 9. Validação de cada dia
  data.days.forEach((day: any, dIdx: number) => {
    const dayPath = `days[${dIdx}]`;

    if (!day || typeof day !== 'object' || Array.isArray(day)) {
      addError('INVALID_TYPE', dayPath, `Elemento em ${dayPath} deve ser um objeto.`, `O dia ${dIdx + 1} possui estrutura inválida.`);
      return;
    }

    if (rejectExtra) {
      for (const k of Object.keys(day)) {
        if (!ALLOWED_DAY_KEYS.has(k)) {
          addError(
            'EXTRA_FIELDS_DISALLOWED',
            `${dayPath}.${k}`,
            `Propriedade extra não permitida em ${dayPath}: '${k}'.`,
            `O dia ${dIdx + 1} contém campo não reconhecido (${k}).`
          );
        }
      }
    }

    // dayNumber
    if (typeof day.dayNumber !== 'number' || !Number.isInteger(day.dayNumber)) {
      addError(
        'INVALID_TYPE',
        `${dayPath}.dayNumber`,
        `dayNumber deve ser um inteiro, recebido: ${typeof day.dayNumber}.`,
        `O número sequencial do dia ${dIdx + 1} é inválido.`
      );
    } else if (day.dayNumber !== dIdx + 1) {
      addError(
        'INVALID_TYPE',
        `${dayPath}.dayNumber`,
        `dayNumber esperado ${dIdx + 1}, recebido: ${day.dayNumber}.`,
        `O dia ${dIdx + 1} está fora de ordem numérica.`
      );
    }

    // date
    if (!day.date || typeof day.date !== 'string' || !dateRegex.test(day.date)) {
      addError(
        'REQUIRED_FIELD_MISSING',
        `${dayPath}.date`,
        `Data do dia em ${dayPath} ausente ou em formato inválido.`,
        `A data do dia ${dIdx + 1} é inválida.`
      );
    } else if (isDatesValid && expectedDateStrings.length > dIdx) {
      if (day.date !== expectedDateStrings[dIdx]) {
        addError(
          'DATE_OUT_OF_RANGE',
          `${dayPath}.date`,
          `Data do dia ${dIdx + 1} (${day.date}) não corresponde à data cronológica esperada (${expectedDateStrings[dIdx]}).`,
          `A data do dia ${dIdx + 1} está fora do período da viagem.`
        );
      }
    }

    // theme
    if (!day.theme || typeof day.theme !== 'string') {
      addError(
        'REQUIRED_FIELD_MISSING',
        `${dayPath}.theme`,
        `Tema do dia em ${dayPath} ausente ou não é string.`,
        `O dia ${dIdx + 1} precisa de um tema.`
      );
    } else if (day.theme.trim().length < 3 || day.theme.trim().length > 80) {
      addError(
        'STRING_LENGTH_OUT_OF_BOUNDS',
        `${dayPath}.theme`,
        `Tema do dia possui ${day.theme.trim().length} caracteres (esperado entre 3 e 80).`,
        `O tema do dia ${dIdx + 1} deve conter entre 3 e 80 caracteres.`
      );
    }

    // weather
    if (!day.weather || typeof day.weather !== 'object' || Array.isArray(day.weather)) {
      addError(
        'REQUIRED_FIELD_MISSING',
        `${dayPath}.weather`,
        `Objeto weather em ${dayPath} ausente ou inválido.`,
        `Informações de clima do dia ${dIdx + 1} ausentes.`
      );
    } else {
      const w = day.weather;
      if (rejectExtra) {
        for (const wk of Object.keys(w)) {
          if (!ALLOWED_WEATHER_KEYS.has(wk)) {
            addError(
              'EXTRA_FIELDS_DISALLOWED',
              `${dayPath}.weather.${wk}`,
              `Campo extra não permitido no clima: '${wk}'.`,
              `Dados extras no clima do dia ${dIdx + 1}.`
            );
          }
        }
      }

      if (typeof w.hasForecast !== 'boolean') {
        addError(
          'INVALID_TYPE',
          `${dayPath}.weather.hasForecast`,
          `hasForecast deve ser boolean, recebido: ${typeof w.hasForecast}.`,
          `Status da previsão no dia ${dIdx + 1} inválido.`
        );
      } else {
        if (!w.hasForecast) {
          // Regra INV-05: sem clima inventado
          if (w.tempMin !== null || w.tempMax !== null) {
            addError(
              'WEATHER_INVARIANT_VIOLATION',
              `${dayPath}.weather`,
              'Violação de invariante climática: datas com hasForecast: false devem ter tempMin e tempMax estritamente null.',
              `Previsão não pode conter temperaturas simuladas para datas sem cobertura meteorológica (dia ${dIdx + 1}).`
            );
          }
          if (w.condition !== 'Desconhecido') {
            addError(
              'WEATHER_INVARIANT_VIOLATION',
              `${dayPath}.weather.condition`,
              `Datas sem previsão devem ter condição "Desconhecido", recebido: '${w.condition}'.`,
              `Condição climática desconhecida para o dia ${dIdx + 1}.`
            );
          }
        } else {
          if (typeof w.tempMin !== 'number' || typeof w.tempMax !== 'number') {
            addError(
              'INVALID_TYPE',
              `${dayPath}.weather.temperature`,
              'Datas com hasForecast: true devem conter temperaturas numéricas.',
              `Temperaturas ausentes no dia ${dIdx + 1}.`
            );
          } else if (w.tempMax < w.tempMin) {
            addError(
              'WEATHER_INVARIANT_VIOLATION',
              `${dayPath}.weather.temperature`,
              `tempMax (${w.tempMax}) não pode ser inferior a tempMin (${w.tempMin}).`,
              `Temperatura máxima inferior à mínima no dia ${dIdx + 1}.`
            );
          }
        }
      }

      if (!w.observation || typeof w.observation !== 'string') {
        addError(
          'REQUIRED_FIELD_MISSING',
          `${dayPath}.weather.observation`,
          'Observação meteorológica ausente.',
          `Observação climática não informada no dia ${dIdx + 1}.`
        );
      } else if (w.observation.trim().length < 5 || w.observation.trim().length > 160) {
        addError(
          'STRING_LENGTH_OUT_OF_BOUNDS',
          `${dayPath}.weather.observation`,
          `observation possui ${w.observation.trim().length} caracteres (máx 160).`,
          `A observação de clima deve ter até 160 caracteres.`
        );
      }
    }

    // day alerts
    if (day.alerts !== undefined && !Array.isArray(day.alerts)) {
      addError('INVALID_TYPE', `${dayPath}.alerts`, 'alerts do dia deve ser array.', `Alertas do dia ${dIdx + 1} inválidos.`);
    }

    // activities
    if (!day.activities || !Array.isArray(day.activities) || day.activities.length === 0) {
      addError(
        'EMPTY_COLLECTION_DISALLOWED',
        `${dayPath}.activities`,
        `Dia ${dIdx + 1} não possui nenhuma atividade (mínimo 1).`,
        `O dia ${dIdx + 1} precisa de pelo menos uma atividade.`
      );
      return;
    }

    day.activities.forEach((act: any, aIdx: number) => {
      const actPath = `${dayPath}.activities[${aIdx}]`;

      if (!act || typeof act !== 'object' || Array.isArray(act)) {
        addError('INVALID_TYPE', actPath, `Atividade em ${actPath} inválida.`, `Atividade ${aIdx + 1} do dia ${dIdx + 1} inválida.`);
        return;
      }

      if (rejectExtra) {
        for (const ak of Object.keys(act)) {
          if (!ALLOWED_ACTIVITY_KEYS.has(ak)) {
            addError(
              'EXTRA_FIELDS_DISALLOWED',
              `${actPath}.${ak}`,
              `Campo extra não permitido na atividade: '${ak}'.`,
              `Atividade com campo desconhecido (${ak}).`
            );
          }
        }
      }

      // placeId
      if (!act.placeId || typeof act.placeId !== 'string' || !act.placeId.trim()) {
        addError(
          'REQUIRED_FIELD_MISSING',
          `${actPath}.placeId`,
          `placeId ausente na atividade ${aIdx + 1}.`,
          `Local não identificado na atividade ${aIdx + 1} do dia ${dIdx + 1}.`
        );
      } else if (options?.allowedPlaceIds && options.allowedPlaceIds.length > 0) {
        // Regra INV-03: Ancoragem factual estrita
        if (!options.allowedPlaceIds.includes(act.placeId)) {
          addError(
            'UNKNOWN_PLACE_ID',
            `${actPath}.placeId`,
            `placeId '${act.placeId}' não pertence à lista de POIs factuais fornecida.`,
            `O local selecionado (${act.name || act.placeId}) não existe na base factual do destino.`
          );
        }
      }

      // name
      if (!act.name || typeof act.name !== 'string' || act.name.trim().length < 2) {
        addError(
          'REQUIRED_FIELD_MISSING',
          `${actPath}.name`,
          `Nome da atividade em ${actPath} ausente ou muito curto.`,
          `Nome do local ausente na atividade ${aIdx + 1}.`
        );
      } else if (options?.allowedPois && options.allowedPois.length > 0 && act.placeId) {
        const foundPoi = options.allowedPois.find((p) => p.id === act.placeId);
        if (foundPoi && foundPoi.name.toLowerCase() !== act.name.trim().toLowerCase()) {
          addError(
            'FACTUAL_NAME_MISMATCH',
            `${actPath}.name`,
            `Nome '${act.name}' diverge do nome factual oficial '${foundPoi.name}'.`,
            `O nome do local não confere com o cadastro oficial.`
          );
        }
      }

      // period
      if (!['manha', 'tarde', 'noite'].includes(act.period)) {
        addError(
          'INVALID_TYPE',
          `${actPath}.period`,
          `period inválido: '${act.period}'. Esperado 'manha', 'tarde' ou 'noite'.`,
          `Período do dia inválido na atividade ${aIdx + 1}.`
        );
      }

      // timeSlot
      const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (!act.timeSlot || typeof act.timeSlot !== 'string' || !timeRegex.test(act.timeSlot)) {
        addError(
          'INVALID_TIMESLOT_FORMAT',
          `${actPath}.timeSlot`,
          `timeSlot '${act.timeSlot}' fora do formato HH:MM (ex: 09:30).`,
          `Horário da atividade ${aIdx + 1} em formato incorreto (use HH:MM).`
        );
      }

      // rationale (Justificativa)
      if (!act.rationale || typeof act.rationale !== 'string') {
        addError(
          'REQUIRED_FIELD_MISSING',
          `${actPath}.rationale`,
          `Justificativa 'rationale' ausente na atividade.`,
          `Justificativa não informada para a atividade ${aIdx + 1}.`
        );
      } else if (act.rationale.trim().length < 10 || act.rationale.trim().length > 200) {
        addError(
          'STRING_LENGTH_OUT_OF_BOUNDS',
          `${actPath}.rationale`,
          `rationale possui ${act.rationale.trim().length} caracteres (esperado entre 10 e 200). Textos longos são rejeitados.`,
          `A justificativa da atividade deve ser concisa (até 200 caracteres).`
        );
      }
    });
  });

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? (data as SmartTripItinerary) : undefined,
    errors,
  };
}
