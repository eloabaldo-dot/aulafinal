/**
 * Suíte de Testes Automatizados para o Contrato de Roteiro do SmartTrip
 * Valida:
 * 1. Exemplo válido (passes validation with zero errors)
 * 2. Título vazio ou muito curto (rejeição com REQUIRED_FIELD_MISSING / STRING_LENGTH)
 * 3. Days vazio (rejeição com EMPTY_COLLECTION_DISALLOWED)
 * 4. Data fora do período da viagem (rejeição com DATE_OUT_OF_RANGE)
 * 5. Atividade sem placeId (rejeição com REQUIRED_FIELD_MISSING)
 * 6. placeId desconhecido (rejeição com UNKNOWN_PLACE_ID contra lista permitida)
 * 7. Campo obrigatório ausente (ex: summary ou theme)
 * 8. Tipo incorreto (ex: dayNumber como string, tempMin como texto)
 * 9. Campos extras quando a política determinar rejeição (EXTRA_FIELDS_DISALLOWED)
 * 10. Justificativa prolixa (> 200 caracteres)
 * 11. Clima inventado para data sem previsão (WEATHER_INVARIANT_VIOLATION)
 * 12. Mensagens legíveis para logs e seguras para usuários
 */

import { validateItinerary } from './src/services/itinerary/itineraryValidator';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    failed++;
  }
}

console.log('=== TESTES: CONTRATO DE ROTEIRO SMARTTRIP ===\n');

// Base factual de lugares permitidos para testes
const ALLOWED_POIS = [
  { id: 'poi_osm_node_1001', name: 'Museu do Louvre' },
  { id: 'poi_osm_node_1002', name: 'Torre Eiffel' },
  { id: 'poi_osm_node_1005', name: 'Café de Flore' },
  { id: 'poi_osm_node_1006', name: 'Le Jules Verne' },
];

const ALLOWED_PLACE_IDS = ALLOWED_POIS.map((p) => p.id);

function getValidSampleItinerary() {
  return {
    title: 'Paris Cultural e Gastronômica',
    summary: 'Roteiro balanceado de 2 dias priorizando os maiores museus do mundo pela manhã e gastronomia autêntica à noite.',
    destinationId: 'dest_fr_paris_48-8566_2-3522',
    startDate: '2026-10-05',
    endDate: '2026-10-06',
    alerts: ['Recomenda-se comprar ingressos com antecedência.'],
    days: [
      {
        dayNumber: 1,
        date: '2026-10-05',
        theme: 'Grandes Obras da Humanidade & Alta Culinária',
        weather: {
          hasForecast: true,
          tempMin: 14,
          tempMax: 22,
          condition: 'Ensolarado',
          observation: 'Dia com clima agradável e ensolarado para passeios ao ar livre.',
        },
        alerts: [],
        activities: [
          {
            placeId: 'poi_osm_node_1001',
            name: 'Museu do Louvre',
            period: 'manha',
            timeSlot: '09:30',
            rationale: 'Alinhado ao seu interesse cultural com menor fluxo de visitantes.',
            estimatedDuration: '3h',
          },
          {
            placeId: 'poi_osm_node_1006',
            name: 'Le Jules Verne',
            period: 'noite',
            timeSlot: '20:00',
            rationale: 'Reserva gastronômica memorável combinando alta culinária e vista panorâmica.',
          },
        ],
      },
      {
        dayNumber: 2,
        date: '2026-10-06',
        theme: 'Cafés Históricos e Monumentos',
        weather: {
          hasForecast: false,
          tempMin: null,
          tempMax: null,
          condition: 'Desconhecido',
          observation: 'Data sem modelo meteorológico numérico disponível.',
        },
        alerts: [],
        activities: [
          {
            placeId: 'poi_osm_node_1002',
            name: 'Torre Eiffel',
            period: 'manha',
            timeSlot: '10:00',
            rationale: 'Ponto turístico clássico de contemplação matinal.',
          },
          {
            placeId: 'poi_osm_node_1005',
            name: 'Café de Flore',
            period: 'tarde',
            timeSlot: '15:30',
            rationale: 'Pausa aconchegante para café no tradicional bairro de Saint-Germain.',
          },
        ],
      },
    ],
  };
}

async function runTests() {
  // 1. Exemplo Válido Completo
  const validSample = getValidSampleItinerary();
  const res1 = validateItinerary(validSample, {
    allowedPlaceIds: ALLOWED_PLACE_IDS,
    allowedPois: ALLOWED_POIS,
  });
  assert(res1.isValid === true, '1.1. Exemplo válido aprovado pelo validador');
  assert(res1.errors.length === 0, '1.2. Zero erros no exemplo válido');
  assert(res1.data?.title === validSample.title, '1.3. Dados tipados retornados com sucesso');

  // 2. Título Vazio / Muito Curto
  const invalidTitle = getValidSampleItinerary();
  (invalidTitle as any).title = '';
  const res2 = validateItinerary(invalidTitle);
  assert(res2.isValid === false, '2.1. Título vazio rejeitado');
  assert(
    res2.errors.some((e) => e.field === 'title' && e.code === 'STRING_LENGTH_OUT_OF_BOUNDS'),
    '2.2. Código STRING_LENGTH_OUT_OF_BOUNDS emitido para título vazio'
  );

  // 3. Days Vazio
  const emptyDays = getValidSampleItinerary();
  emptyDays.days = [];
  const res3 = validateItinerary(emptyDays);
  assert(res3.isValid === false, '3.1. Array days vazio rejeitado');
  assert(
    res3.errors.some((e) => e.field === 'days' && e.code === 'EMPTY_COLLECTION_DISALLOWED'),
    '3.2. Código EMPTY_COLLECTION_DISALLOWED emitido para dias vazios'
  );

  // 4. Data Fora do Período
  const outOfRangeDate = getValidSampleItinerary();
  // Viagem vai de 05 a 06/10, mas dia 2 recebe 15/10
  outOfRangeDate.days[1].date = '2026-10-15';
  const res4 = validateItinerary(outOfRangeDate);
  assert(res4.isValid === false, '4.1. Data fora do período rejeitada');
  assert(
    res4.errors.some((e) => e.code === 'DATE_OUT_OF_RANGE'),
    '4.2. Código DATE_OUT_OF_RANGE emitido para data divergente'
  );

  // 5. Atividade Sem placeId
  const missingPlaceId = getValidSampleItinerary();
  delete (missingPlaceId.days[0].activities[0] as any).placeId;
  const res5 = validateItinerary(missingPlaceId);
  assert(res5.isValid === false, '5.1. Atividade sem placeId rejeitada');
  assert(
    res5.errors.some((e) => e.code === 'REQUIRED_FIELD_MISSING' && e.field.includes('placeId')),
    '5.2. Código REQUIRED_FIELD_MISSING emitido para placeId ausente'
  );

  // 6. placeId Desconhecido (Não Fornecido / Alucinação da IA)
  const unknownPlace = getValidSampleItinerary();
  unknownPlace.days[0].activities[0].placeId = 'poi_fantasma_inexistente_999';
  const res6 = validateItinerary(unknownPlace, { allowedPlaceIds: ALLOWED_PLACE_IDS });
  assert(res6.isValid === false, '6.1. placeId desconhecido rejeitado com rigor');
  assert(
    res6.errors.some((e) => e.code === 'UNKNOWN_PLACE_ID'),
    '6.2. Código UNKNOWN_PLACE_ID emitido para lugar que não constava na lista fornecida'
  );

  // 7. Campo Obrigatório Ausente (Ex: summary ausente)
  const missingSummary = getValidSampleItinerary();
  delete (missingSummary as any).summary;
  const res7 = validateItinerary(missingSummary);
  assert(res7.isValid === false, '7.1. summary ausente rejeitado');
  assert(
    res7.errors.some((e) => e.field === 'summary' && e.code === 'REQUIRED_FIELD_MISSING'),
    '7.2. Código REQUIRED_FIELD_MISSING emitido para summary ausente'
  );

  // 8. Tipo Incorreto (Ex: dayNumber como string)
  const badType = getValidSampleItinerary();
  (badType.days[0] as any).dayNumber = 'primeiro';
  const res8 = validateItinerary(badType);
  assert(res8.isValid === false, '8.1. dayNumber com string rejeitado');
  assert(
    res8.errors.some((e) => e.code === 'INVALID_TYPE' && e.field.includes('dayNumber')),
    '8.2. Código INVALID_TYPE emitido para tipo primitivo incompatível'
  );

  // 9. Campos Extras quando a Política Determinar Rejeição (additionalProperties: false)
  const extraProps = getValidSampleItinerary();
  (extraProps as any).campoInesperadoHacker = 'dado_nao_solicitado';
  const res9 = validateItinerary(extraProps, { rejectExtraProperties: true });
  assert(res9.isValid === false, '9.1. Campo extra não reconhecido rejeitado');
  assert(
    res9.errors.some((e) => e.code === 'EXTRA_FIELDS_DISALLOWED'),
    '9.2. Código EXTRA_FIELDS_DISALLOWED emitido para propriedade invasiva'
  );

  // 10. Justificativa Prolixa (> 200 caracteres)
  const verboseRationale = getValidSampleItinerary();
  verboseRationale.days[0].activities[0].rationale =
    'Este é um texto deliberadamente gigante com mais de duzentos caracteres para testar a restrição de tamanho estrito da justificativa da atividade, pois o usuário deseja um roteiro conciso e direto sem floreios desnecessários nem parágrafos prolixos da inteligência artificial.'.slice(
      0,
      250
    );
  const res10 = validateItinerary(verboseRationale);
  assert(res10.isValid === false, '10.1. Justificativa prolixa rejeitada');
  assert(
    res10.errors.some((e) => e.code === 'STRING_LENGTH_OUT_OF_BOUNDS' && e.field.includes('rationale')),
    '10.2. Rejeição de rationale com mais de 200 caracteres'
  );

  // 11. Clima Inventado para Data com hasForecast: false
  const fakeWeather = getValidSampleItinerary();
  // Dia 2 tem hasForecast: false, mas recebe temperaturas inventadas
  fakeWeather.days[1].weather.hasForecast = false;
  fakeWeather.days[1].weather.tempMin = 20 as any;
  fakeWeather.days[1].weather.tempMax = 28 as any;
  const res11 = validateItinerary(fakeWeather);
  assert(res11.isValid === false, '11.1. Clima inventado para data sem modelo rejeitado');
  assert(
    res11.errors.some((e) => e.code === 'WEATHER_INVARIANT_VIOLATION'),
    '11.2. Código WEATHER_INVARIANT_VIOLATION emitido'
  );

  // 12. Qualidade dos Erros: Mensagens Seguras para Usuário e Detalhadas para Log
  const sampleError = res6.errors[0];
  assert(Boolean(sampleError.detail.includes('poi_fantasma')), '12.1. Log técnico detalhado contém o ID exato');
  assert(
    Boolean(sampleError.userMessage && !sampleError.userMessage.includes('undefined')),
    '12.2. userMessage amigável e segura para exibição ao usuário'
  );

  console.log(`\nResultado Final: ${passed} testes passaram, ${failed} falharam.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
