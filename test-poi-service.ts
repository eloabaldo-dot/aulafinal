/**
 * Suíte de Testes Automatizados para o Serviço de Pontos de Interesse (POIs)
 * Valida:
 * 1. Coordenadas válidas (campos obrigatórios, categorias e cálculo de distância)
 * 2. Categorias distintas (filtro seletivo por categorias)
 * 3. Nenhum resultado (coordenadas remotas retornam array vazio sem crash)
 * 4. Lugares duplicados (deduplicação espacial em raio < 50m)
 * 5. Item sem endereço (tratamento gracioso com endereço estruturado de fallback)
 * 6. Item sem coordenadas (rejeição segura com POI_INCOMPLETE_RESPONSE)
 * 7. Timeout (cancelamento controlado com código POI_TIMEOUT)
 * 8. Rate limit (tratamento de limite HTTP 429 com POI_RATE_LIMITED)
 * 9. Erro do provedor (status 500 absorvido com hasError: true sem derrubar o app)
 * 10. Preservação de IDs estáveis
 * 11. Secrets permanecem server-side (sem chaves com prefixo VITE_)
 * 12. Rastreabilidade do Gemini até os lugares reais (grounding context)
 */

import { PoiService } from './src/services/poi/poiService';
import { MockPoiProvider } from './src/services/poi/providers/mockPoiProvider';
import { PoiServiceError } from './src/types/poi';
import { handlePoiApiRequest } from './src/server/api/pois';
import { validatePoiCoordinates } from './src/services/poi/normalizer';

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

console.log('=== TESTES: SERVIÇO DE PONTOS DE INTERESSE (POIs) SMARTTRIP ===\n');

async function runTests() {
  const mockProvider = new MockPoiProvider();
  const service = new PoiService({
    provider: mockProvider,
    timeoutMs: 300,
  });

  // 1. Coordenadas Válidas (Paris: 48.8566, 2.3522)
  try {
    const res = await service.searchPois({
      latitude: 48.8566,
      longitude: 2.3522,
      radiusMeters: 6000,
      limit: 10,
    });

    assert(!res.hasError, '1.1. Busca executada sem erros');
    assert(res.pois.length > 0, '1.2. Retornou POIs em Paris');
    const p1 = res.pois[0];
    assert(Boolean(p1.id), '1.3. POI possui ID canônico');
    assert(Boolean(p1.name), '1.4. POI possui nome factual');
    assert(Boolean(p1.address), '1.5. POI possui endereço');
    assert(typeof p1.latitude === 'number' && typeof p1.longitude === 'number', '1.6. Coordenadas numéricas confirmadas');
    assert(typeof p1.distanceMeters === 'number', '1.7. Distância do centro calculada');
  } catch (e: any) {
    assert(false, `1. Falha em coordenadas válidas: ${e.message}`);
  }

  // 2. Categorias Distintas (Filtro por 'museu')
  try {
    service.clearCache();
    const resMuseums = await service.searchPois({
      latitude: 48.8566,
      longitude: 2.3522,
      categories: ['museu'],
    });

    assert(resMuseums.pois.length > 0, '2.1. Encontrou museus');
    const allMuseums = resMuseums.pois.every((p) => p.category === 'museu');
    assert(allMuseums, '2.2. Todos os itens retornados pertencem estritamente à categoria "museu"');
  } catch (e: any) {
    assert(false, `2. Falha em categorias distintas: ${e.message}`);
  }

  // 3. Nenhum Resultado (Coordenadas remotas no meio do oceano: 0.0, 0.0)
  try {
    service.clearCache();
    const resEmpty = await service.searchPois({
      latitude: 0.0,
      longitude: 0.0,
      radiusMeters: 1000,
    });

    assert(!resEmpty.hasError, '3.1. Busca remota não gerou erro de sistema');
    assert(resEmpty.total === 0 && resEmpty.pois.length === 0, '3.2. Retornou total: 0 e lista vazia sem crash');
  } catch (e: any) {
    assert(false, `3. Falha em nenhum resultado: ${e.message}`);
  }

  // 4. Lugares Duplicados (Deduplicação Espacial < 50m)
  try {
    service.clearCache();
    mockProvider.setInjectDuplicate(true);
    const resWithDup = await service.searchPois({
      latitude: 48.8566,
      longitude: 2.3522,
    });

    // Conta quantos itens têm o nome base repetido
    const names = resWithDup.pois.map((p) => p.name);
    const louvreCount = names.filter((n) => n.includes('Louvre')).length;
    assert(louvreCount === 1, '4. Deduplicação espacial fundiu ou descartou o local duplicado a 11m');
  } catch (e: any) {
    assert(false, `4. Falha na deduplicação: ${e.message}`);
  } finally {
    mockProvider.setInjectDuplicate(false);
  }

  // 5. Item Sem Endereço (Fallback Gracioso)
  try {
    service.clearCache();
    mockProvider.setInjectMissingAddress(true);
    const resNoAddr = await service.searchPois({
      latitude: 48.8566,
      longitude: 2.3522,
    });

    const itemNoAddr = resNoAddr.pois.find((p) => p.name.includes('Sem Endereço'));
    assert(Boolean(itemNoAddr), '5.1. Item sem endereço original processado com sucesso');
    assert(
      Boolean(itemNoAddr?.address.includes('Coordenadas')),
      '5.2. Endereço estruturado de fallback baseado em coordenadas gerado'
    );
  } catch (e: any) {
    assert(false, `5. Falha em item sem endereço: ${e.message}`);
  } finally {
    mockProvider.setInjectMissingAddress(false);
  }

  // 6. Item Sem Coordenadas (Rejeição com POI_INCOMPLETE_RESPONSE)
  try {
    let caughtCoordError = false;
    try {
      validatePoiCoordinates(NaN, 2.35);
    } catch (err: any) {
      caughtCoordError = err instanceof PoiServiceError && err.code === 'POI_INCOMPLETE_RESPONSE';
    }
    assert(caughtCoordError, '6. Validador de coordenadas rejeita coordenadas ausentes ou NaN');
  } catch (e: any) {
    assert(false, `6. Falha em validação de coordenadas: ${e.message}`);
  }

  // 7. Timeout
  try {
    service.clearCache();
    mockProvider.setDelay(600); // 600ms vs timeout de 300ms
    let caughtTimeout = false;
    try {
      await service.searchPois(
        { latitude: 48.8566, longitude: 2.3522 },
        { throwOnError: true }
      );
    } catch (err: any) {
      caughtTimeout = err instanceof PoiServiceError && err.code === 'POI_TIMEOUT';
    }
    assert(caughtTimeout, '7.1. Lança POI_TIMEOUT quando provedor excede o limite em throwOnError');

    // Em modo normal, fallback seguro
    service.clearCache();
    const safeTimeout = await service.searchPois({ latitude: 48.8566, longitude: 2.3522 });
    assert(safeTimeout.hasError === true, '7.2. Modo padrão absorve timeout com fallback gracioso');
  } catch (e: any) {
    assert(false, `7. Falha no teste de timeout: ${e.message}`);
  } finally {
    mockProvider.setDelay(0);
  }

  // 8. Rate Limit (HTTP 429)
  try {
    service.clearCache();
    mockProvider.setForceError({ status: 429, message: 'Too Many Requests' });
    let caughtRateLimit = false;
    try {
      await service.searchPois(
        { latitude: 48.8566, longitude: 2.3522 },
        { throwOnError: true }
      );
    } catch (err: any) {
      caughtRateLimit = err instanceof PoiServiceError && err.code === 'POI_RATE_LIMITED';
    }
    assert(caughtRateLimit, '8. Provedor com status 429 mapeado para POI_RATE_LIMITED');
  } catch (e: any) {
    assert(false, `8. Falha em rate limit: ${e.message}`);
  } finally {
    mockProvider.setForceError(undefined);
  }

  // 9. Erro do Provedor (HTTP 500)
  try {
    service.clearCache();
    mockProvider.setForceError({ status: 500, message: 'Internal Server Error' });
    const fallback500 = await service.searchPois({ latitude: 48.8566, longitude: 2.3522 });
    assert(fallback500.hasError === true, '9.1. Falha 500 não derruba o app e retorna hasError: true');
    assert(fallback500.pois.length === 0, '9.2. Retorna lista vazia sem lançar exceção não tratada');
  } catch (e: any) {
    assert(false, `9. Erro 500 derrubou a aplicação: ${e.message}`);
  } finally {
    mockProvider.setForceError(undefined);
  }

  // 10. Preservação de IDs Estáveis
  try {
    service.clearCache();
    const rA = await service.searchPois({ latitude: 48.8566, longitude: 2.3522 });
    service.clearCache();
    const rB = await service.searchPois({ latitude: 48.8566, longitude: 2.3522 });
    assert(rA.pois[0].id === rB.pois[0].id, '10. O mesmo local mantém id idêntico entre chamadas');
  } catch (e: any) {
    assert(false, `10. Falha na preservação de IDs: ${e.message}`);
  }

  // 11. Secrets permanecem server-side
  const clientPlacesKey = Object.keys(process.env).filter((k) => k.startsWith('VITE_PLACES_'));
  assert(clientPlacesKey.length === 0, '11. Nenhuma chave privada de POIs ou Places exposta com prefixo VITE_');

  // 12. Rastreabilidade do Gemini até os Lugares Reais (Grounding)
  try {
    service.clearCache();
    const poisRes = await service.searchPois({ latitude: 48.8566, longitude: 2.3522 });
    const groundingContext = service.buildGeminiGroundingContext(poisRes.pois);
    const parsed = JSON.parse(groundingContext);
    assert(Array.isArray(parsed) && parsed.length > 0, '12.1. Grounding context é um JSON válido');
    assert(parsed[0].id === poisRes.pois[0].id, '12.2. ID do primeiro item rastreável ao lugar real');
    assert(parsed[0].name === poisRes.pois[0].name, '12.3. Nome factual preservado no grounding');
  } catch (e: any) {
    assert(false, `12. Falha no grounding do Gemini: ${e.message}`);
  }

  // 13. Endpoint HTTP /api/pois
  try {
    const resHttp = await handlePoiApiRequest({
      url: '/api/pois?latitude=48.8566&longitude=2.3522&radiusMeters=5000',
    });
    assert(resHttp.status === 200, '13.1. /api/pois retorna HTTP 200 para requisição válida');
    assert(resHttp.body.pois.length > 0, '13.2. /api/pois retorna array de POIs no corpo da resposta');

    const resHttpBad = await handlePoiApiRequest({
      url: '/api/pois?latitude=999.0&longitude=2.3522',
    });
    assert(resHttpBad.status === 400, '13.3. /api/pois retorna HTTP 400 para coordenadas inválidas');
  } catch (e: any) {
    assert(false, `13. Falha no handler HTTP /api/pois: ${e.message}`);
  }

  console.log(`\nResultado Final: ${passed} testes passaram, ${failed} falharam.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
