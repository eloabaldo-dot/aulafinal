/**
 * Suíte de Testes Automatizados para o Serviço de Busca e Normalização de Destinos
 * Valida:
 * 1. Cidade conhecida (normalização completa, coordenadas, país, id canônico)
 * 2. Nomes ambíguos (resolução de homônimos como "Santiago" com desambiguação clara)
 * 3. Consulta vazia ou menor que 3 caracteres (rejeição sem chamada de rede)
 * 4. Nenhum resultado (retorno de array vazio sem crash ou exceção não tratada)
 * 5. Timeout (cancelamento com código GEO_TIMEOUT quando provedor excede limite)
 * 6. Erro do provedor (tratamento de HTTP 500 / instabilidade externa)
 * 7. Resposta incompleta (rejeição de payloads defeituosos sem coordenadas)
 * 8. Caracteres acentuados (busca insensível a diacríticos: "sao paulo", "São Paulo")
 */

import { DestinationService } from './src/services/destination/destinationService';
import { MockDestinationProvider } from './src/services/destination/providers/mockDestinationProvider';
import { DestinationServiceError } from './src/types/destination';
import {
  sanitizeSearchQuery,
  validateCoordinates,
  createNormalizedDestination,
} from './src/services/destination/normalizer';

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

console.log('=== TESTES: SERVIÇO DE DESTINO E NORMALIZAÇÃO GEOGRÁFICA ===\n');

async function runTests() {
  const mockProvider = new MockDestinationProvider();
  const service = new DestinationService({
    provider: mockProvider,
    timeoutMs: 300, // Timeout curto para testes ágeis
  });

  // 1. Cidade Conhecida (ex: "Paris")
  try {
    const results = await service.searchDestinations('Paris');
    assert(results.length > 0, '1.1. Encontrou resultados para cidade conhecida Paris');
    const paris = results[0];
    assert(paris.name === 'Paris', '1.2. Nome normalizado como Paris');
    assert(paris.address.country === 'França', '1.3. País normalizado como França');
    assert(paris.address.countryCode === 'FR', '1.4. Código ISO normalizado como FR');
    assert(paris.coordinates.latitude > 48 && paris.coordinates.latitude < 49, '1.5. Latitude válida');
    assert(paris.coordinates.longitude > 2 && paris.coordinates.longitude < 3, '1.6. Longitude válida');
    assert(paris.id.startsWith('dest_fr_paris'), '1.7. ID canônico gerado no padrão dest_fr_paris_*');
  } catch (e: any) {
    assert(false, `1. Falha ao buscar cidade conhecida: ${e.message}`);
  }

  // 2. Nomes Ambíguos (ex: "Santiago")
  try {
    service.clearCache();
    const results = await service.searchDestinations('Santiago');
    assert(results.length >= 2, '2.1. Retornou múltiplos candidatos para nome ambíguo Santiago');
    const chile = results.find((r) => r.address.countryCode === 'CL');
    const spain = results.find((r) => r.address.countryCode === 'ES');
    assert(Boolean(chile), '2.2. Inclui Santiago do Chile (CL)');
    assert(Boolean(spain), '2.3. Inclui Santiago de Compostela na Espanha (ES)');
    assert(Boolean(chile?.displayName.includes('Chile')), '2.4. Subtítulo geopolítico claro para desambiguação');
  } catch (e: any) {
    assert(false, `2. Falha na desambiguação: ${e.message}`);
  }

  // 3. Consulta Vazia ou Menor que 3 Caracteres
  try {
    const emptyResult1 = await service.searchDestinations('');
    const emptyResult2 = await service.searchDestinations('   ');
    const shortResult = await service.searchDestinations('Pa'); // Apenas 2 letras
    assert(emptyResult1.length === 0, '3.1. String vazia retorna array vazio imediatamente');
    assert(emptyResult2.length === 0, '3.2. Apenas espaços retorna array vazio');
    assert(shortResult.length === 0, '3.3. Menos de 3 caracteres (< 3) não dispara busca externa');
  } catch (e: any) {
    assert(false, `3. Falha no tratamento de entrada vazia: ${e.message}`);
  }

  // 4. Nenhum Resultado (Destino Inexistente)
  try {
    service.clearCache();
    const results = await service.searchDestinations('CidadeInexistente999XYZ');
    assert(results.length === 0, '4.1. Destino inexistente retorna array vazio sem lançar erro');
  } catch (e: any) {
    assert(false, `4. Falha ao processar destino inexistente: ${e.message}`);
  }

  // 5. Timeout
  try {
    service.clearCache();
    mockProvider.setDelay(600); // Demora 600ms enquanto o timeout do serviço é de 300ms
    await service.searchDestinations('Lisboa');
    assert(false, '5.1. Deveria ter lançado erro de timeout');
  } catch (e: any) {
    assert(
      e instanceof DestinationServiceError && e.code === 'GEO_TIMEOUT',
      '5.1. Lançou DestinationServiceError com código GEO_TIMEOUT'
    );
  } finally {
    mockProvider.setDelay(0);
  }

  // 6. Erro do Provedor (ex: 500 / Indisponibilidade Externa)
  try {
    service.clearCache();
    mockProvider.setForceError({ status: 500, message: 'Internal Server Error' });
    await service.searchDestinations('Roma');
    assert(false, '6.1. Deveria ter capturado erro do provedor');
  } catch (e: any) {
    assert(
      e instanceof DestinationServiceError && e.code === 'GEO_PROVIDER_UNAVAILABLE',
      '6.1. Erro do provedor mapeado para código GEO_PROVIDER_UNAVAILABLE'
    );
  } finally {
    mockProvider.setForceError(undefined);
  }

  // 7. Resposta Incompleta (Corrupção de dados ou coordenadas ausentes)
  try {
    // 7.1. Validador direto de coordenadas
    let caughtCoordError = false;
    try {
      validateCoordinates(NaN, 10);
    } catch (err: any) {
      caughtCoordError = err instanceof DestinationServiceError && err.code === 'GEO_INCOMPLETE_RESPONSE';
    }
    assert(caughtCoordError, '7.1. Validador de coordenadas rejeita NaN com GEO_INCOMPLETE_RESPONSE');

    // 7.2. Normalizador direto com payload sem país
    let caughtMissingCountry = false;
    try {
      createNormalizedDestination({
        name: 'Cidade Sem Pais',
        displayName: 'Cidade Sem Pais',
        coordinates: { latitude: 10, longitude: 20 },
        address: { city: 'Cidade Sem Pais', stateOrRegion: '', country: '', countryCode: '' },
        sourceProvider: 'test',
      });
    } catch (err: any) {
      caughtMissingCountry = err instanceof DestinationServiceError && err.code === 'GEO_INCOMPLETE_RESPONSE';
    }
    assert(caughtMissingCountry, '7.2. Criação sem país rejeitada com GEO_INCOMPLETE_RESPONSE');
  } catch (e: any) {
    assert(false, `7. Falha ao validar resposta incompleta: ${e.message}`);
  }

  // 8. Caracteres Acentuados e Diacríticos
  try {
    service.clearCache();
    // Busca sem acento para destino acentuado
    const r1 = await service.searchDestinations('sao paulo');
    assert(r1.length > 0 && r1[0].name === 'São Paulo', '8.1. "sao paulo" localiza "São Paulo"');

    // Busca com acento para destino acentuado
    const r2 = await service.searchDestinations('São Paulo');
    assert(r2.length > 0 && r2[0].name === 'São Paulo', '8.2. "São Paulo" preserva grafia correta');

    // Busca sem acento para "Florianópolis"
    const r3 = await service.searchDestinations('florianopolis');
    assert(r3.length > 0 && r3[0].name === 'Florianópolis', '8.3. "florianopolis" localiza "Florianópolis"');

    // Busca "toquio" sem acento
    const r4 = await service.searchDestinations('toquio');
    assert(r4.length > 0 && r4[0].name === 'Tóquio', '8.4. "toquio" localiza "Tóquio"');
  } catch (e: any) {
    assert(false, `8. Falha em caracteres acentuados: ${e.message}`);
  }

  // 9. Sanitização contra Scripts e Tags
  const malicious = '<script>alert("xss")</script>  Roma   ';
  const clean = sanitizeSearchQuery(malicious);
  assert(clean === 'Roma', '9. Sanitização removeu tags scripts e excesso de espaços');

  // 10. Cache LRU Funcional
  service.clearCache();
  await service.searchDestinations('Lisboa');
  const cacheSizeBefore = service.getCacheSize();
  await service.searchDestinations('Lisboa'); // Segunda chamada repetida
  assert(cacheSizeBefore === 1 && service.getCacheSize() === 1, '10. Cache LRU retornou resultado sem duplicar');

  console.log(`\nResultado Final: ${passed} testes passaram, ${failed} falharam.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
