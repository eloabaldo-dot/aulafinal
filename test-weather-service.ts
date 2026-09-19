/**
 * Suíte de Testes Automatizados para o Serviço Meteorológico e /api/weather
 * Valida:
 * 1. Coordenadas válidas (previsão completa, min/max, chuva, WMO decodificado)
 * 2. Coordenadas inválidas (rejeição com WEATHER_INVALID_COORDINATES)
 * 3. Período disponível dentro do horizonte (hasForecast: true)
 * 4. Período futuro sem previsão (hasForecast: false, tempMin: null, SEM INVENÇÃO)
 * 5. Erro HTTP (simulação 500 cai em fallback seguro com hasError: true sem crash)
 * 6. Timeout (cancelamento controlado com código WEATHER_TIMEOUT)
 * 7. Resposta parcial (dados corrompidos em um dia tratados sem quebrar outros dias)
 * 8. Provider unavailable (resiliência total sem derrubar o aplicativo)
 * 9. Handler HTTP /api/weather (validação de endpoint server-side)
 * 10. Verificação de segurança (chave somente server-side)
 */

import { WeatherService } from './src/services/weather/weatherService';
import { MockWeatherProvider } from './src/services/weather/providers/mockWeatherProvider';
import { WeatherServiceError } from './src/types/weather';
import { handleWeatherApiRequest } from './src/server/api/weather';

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

console.log('=== TESTES: SERVIÇO METEOROLÓGICO E /api/weather SMARTTRIP ===\n');

async function runTests() {
  const mockProvider = new MockWeatherProvider();
  // Congela a data de referência para '2026-10-01' para testes determinísticos de horizonte
  const fixedReferenceDate = new Date('2026-10-01T00:00:00Z');
  mockProvider.setReferenceDate(fixedReferenceDate);

  const service = new WeatherService({
    provider: mockProvider,
    timeoutMs: 300,
  });

  // 1. Coordenadas Válidas e Período Disponível (Paris, 05 a 09 de Outubro de 2026 - dentro dos 16 dias de 01/10)
  try {
    const context = await service.getDestinationWeather({
      latitude: 48.8566,
      longitude: 2.3522,
      startDate: '2026-10-05',
      endDate: '2026-10-09',
    });

    assert(!context.hasError, '1.1. Contexto meteorológico retornado sem erro');
    assert(context.period.totalDays === 5, '1.2. Período de 5 dias calculado corretamente');
    assert(context.daily.length === 5, '1.3. Array diário com 5 previsões');
    assert(context.summary.hasAnyForecast, '1.4. Resumo com hasAnyForecast: true');

    const day1 = context.daily[0];
    assert(day1.hasForecast, '1.5. Primeiro dia possui hasForecast: true');
    assert(typeof day1.tempMin === 'number' && typeof day1.tempMax === 'number', '1.6. Temperaturas min/max numéricas');
    assert(day1.tempMax! >= day1.tempMin!, '1.7. tempMax >= tempMin');
    assert(day1.condition !== 'Desconhecido', '1.8. Condição decodificada com sucesso');
  } catch (e: any) {
    assert(false, `1. Falha em coordenadas válidas: ${e.message}`);
  }

  // 2. Coordenadas Inválidas (Rejeição Estrita)
  try {
    await service.getDestinationWeather({
      latitude: 120.0, // Inválido: > 90
      longitude: 200.0, // Inválido: > 180
      startDate: '2026-10-05',
      endDate: '2026-10-09',
    });
    assert(false, '2. Coordenadas fora dos limites deveriam falhar');
  } catch (e: any) {
    assert(
      e instanceof WeatherServiceError && e.code === 'WEATHER_INVALID_COORDINATES',
      '2. Rejeição de coordenadas inválidas com WEATHER_INVALID_COORDINATES'
    );
  }

  // 3. Período Futuro Sem Previsão (> 16 dias além do horizonte: 2026-12-01 a 2026-12-05)
  // REGRA FUNDAMENTAL: NENHUMA INVENÇÃO DE CLIMA
  try {
    service.clearCache();
    const futureContext = await service.getDestinationWeather({
      latitude: 48.8566,
      longitude: 2.3522,
      startDate: '2026-12-01',
      endDate: '2026-12-05',
    });

    assert(!futureContext.summary.hasAnyForecast, '3.1. hasAnyForecast é false para datas além do horizonte');
    const allUnavailable = futureContext.daily.every(
      (d) => !d.hasForecast && d.status === 'unavailable' && d.tempMin === null && d.tempMax === null
    );
    assert(allUnavailable, '3.2. Todas as datas além do horizonte têm tempMin: null e status: unavailable');
    assert(
      futureContext.daily[0].condition === 'Desconhecido',
      '3.3. Condição é "Desconhecido" (NENHUM dado inventado)'
    );
  } catch (e: any) {
    assert(false, `3. Falha em período futuro: ${e.message}`);
  }

  // 4. Erro HTTP (Provedor retorna 500)
  // REGRA: Falhas não podem derrubar o aplicativo (Fallback seguro gracioso)
  try {
    service.clearCache();
    mockProvider.setForceError({ status: 500, message: 'Open-Meteo Server Outage 500' });
    const fallbackContext = await service.getDestinationWeather({
      latitude: 48.8566,
      longitude: 2.3522,
      startDate: '2026-10-05',
      endDate: '2026-10-07',
    });

    assert(fallbackContext.hasError === true, '4.1. hasError marcado como true após falha do provedor');
    assert(fallbackContext.daily.length === 3, '4.2. Estrutura diária mantida para não quebrar a UI');
    assert(fallbackContext.daily[0].status === 'unavailable', '4.3. Dias marcados como unavailable');
  } catch (e: any) {
    assert(false, `4. Erro 500 derrubou a aplicação: ${e.message}`);
  } finally {
    mockProvider.setForceError(undefined);
  }

  // 5. Timeout
  try {
    service.clearCache();
    mockProvider.setDelay(600); // Demora 600ms (timeout configurado em 300ms)
    // Com throwOnError = true, valida se a exceção tipada é lançada
    let caughtTimeout = false;
    try {
      await service.getDestinationWeather(
        {
          latitude: 48.8566,
          longitude: 2.3522,
          startDate: '2026-10-05',
          endDate: '2026-10-07',
        },
        { throwOnError: true }
      );
    } catch (err: any) {
      caughtTimeout = err instanceof WeatherServiceError && err.code === 'WEATHER_TIMEOUT';
    }
    assert(caughtTimeout, '5.1. Lança WEATHER_TIMEOUT quando exceder limite em modo de erro');

    // Em modo normal (sem throwOnError), valida fallback gracioso sem crash
    service.clearCache();
    const safeTimeout = await service.getDestinationWeather({
      latitude: 48.8566,
      longitude: 2.3522,
      startDate: '2026-10-05',
      endDate: '2026-10-07',
    });
    assert(safeTimeout.hasError === true, '5.2. Modo normal absorve timeout retornando fallback seguro');
  } catch (e: any) {
    assert(false, `5. Falha no teste de timeout: ${e.message}`);
  } finally {
    mockProvider.setDelay(0);
  }

  // 6. Resposta Parcial (Algum dia com dados corrompidos)
  try {
    service.clearCache();
    mockProvider.setForcePartial(true);
    const partialContext = await service.getDestinationWeather({
      latitude: 48.8566,
      longitude: 2.3522,
      startDate: '2026-10-05',
      endDate: '2026-10-07',
    });

    assert(partialContext.daily[0].hasForecast === true, '6.1. Dia 1 normal permanece intacto');
    assert(partialContext.daily[1].hasForecast === false, '6.2. Dia 2 corrompido marcado como hasForecast: false');
    assert(partialContext.daily[1].tempMin === null, '6.3. Dia 2 com tempMin: null sem quebrar cálculo');
    assert(partialContext.daily[2].hasForecast === true, '6.4. Dia 3 normal permanece intacto');
  } catch (e: any) {
    assert(false, `6. Falha em resposta parcial: ${e.message}`);
  } finally {
    mockProvider.setForcePartial(false);
  }

  // 7. Provider Unavailable (Queda total de conexão)
  try {
    service.clearCache();
    mockProvider.setForceError({ status: 503, message: 'Service Unavailable' });
    const context503 = await service.getDestinationWeather({
      latitude: 48.8566,
      longitude: 2.3522,
      startDate: '2026-10-05',
      endDate: '2026-10-07',
    });
    assert(context503.hasError === true, '7.1. Tratamento de 503 com hasError: true');
    assert(Boolean(context503.errorMessage), '7.2. Mensagem amigável de erro fornecida');
  } catch (e: any) {
    assert(false, `7. Falha em provider unavailable: ${e.message}`);
  } finally {
    mockProvider.setForceError(undefined);
  }

  // 8. Handler HTTP /api/weather
  try {
    // 8.1. Chamada Válida
    const res = await handleWeatherApiRequest({
      url: '/api/weather?latitude=48.8566&longitude=2.3522&startDate=2026-10-05&endDate=2026-10-09',
    });
    assert(res.status === 200, '8.1. /api/weather retorna status 200 para consulta válida');
    assert(res.body.daily.length === 5, '8.2. /api/weather retorna 5 dias no corpo da resposta');

    // 8.2. Chamada com Parâmetro Ausente
    const resBad = await handleWeatherApiRequest({
      url: '/api/weather?latitude=48.8566',
    });
    assert(resBad.status === 400, '8.3. /api/weather retorna 400 para parâmetros ausentes');
  } catch (e: any) {
    assert(false, `8. Falha no handler /api/weather: ${e.message}`);
  }

  // 9. Verificação de Segurança (Chave somente Server-Side)
  // Nenhuma chave de clima deve conter prefixo VITE_ ou vazar para o cliente
  const clientEnvKeys = Object.keys(process.env).filter((k) => k.startsWith('VITE_WEATHER_'));
  assert(clientEnvKeys.length === 0, '9. Nenhuma chave meteorológica privada exposta com prefixo VITE_');

  // 10. Cache em Memória
  service.clearCache();
  await service.getDestinationWeather({
    latitude: 48.8566,
    longitude: 2.3522,
    startDate: '2026-10-05',
    endDate: '2026-10-09',
  });
  const cacheCount1 = service.getCacheSize();
  await service.getDestinationWeather({
    latitude: 48.8566,
    longitude: 2.3522,
    startDate: '2026-10-05',
    endDate: '2026-10-09',
  });
  assert(cacheCount1 === 1 && service.getCacheSize() === 1, '10. Cache LRU retornou resultado sem duplicar');

  console.log(`\nResultado Final: ${passed} testes passaram, ${failed} falharam.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
