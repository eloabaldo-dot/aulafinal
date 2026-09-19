/**
 * Suíte de Testes Automatizados: Compartilhamento e Visibilidade de Viagem (SmartTrip)
 * Conforme especificado em docs/specs/trip-sharing-spec.md
 * 
 * CENÁRIOS OBRIGATÓRIOS:
 * 1. privado sem autenticação;
 * 2. privado com outro usuário;
 * 3. dono;
 * 4. link compartilhado;
 * 5. link revogado;
 * 6. público;
 * 7. troca public → private;
 * 8. cópia por usuário autenticado;
 * 9. cópia mantém original;
 * 10. cópia recebe novo owner;
 * 11. dados externos são marcados para revalidação.
 */

import { TripRepository } from './src/services/firebase/tripRepository';
import { DayItinerary } from './src/types/mvp';
import { CreateTripInput } from './src/types/firestore';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    failed++;
  }
}

console.log('=== TESTES: COMPARTILHAMENTO E VISIBILIDADE DE VIAGEM SMARTTRIP ===\n');

const repo = new TripRepository();

const USER_A = 'usr_alice_101';
const USER_B = 'usr_bob_202';

async function runSharingTests() {
  const sampleItinerary: DayItinerary[] = [
    {
      dayNumber: 1,
      date: '2026-11-10',
      theme: 'Cultura e Monumentos',
      activities: [
        {
          id: 'act_101',
          placeId: 'poi_colosseo',
          period: 'manha',
          time: '09:00',
          title: 'Coliseu',
          description: 'Tour guiado no anfiteatro Flávio.',
          locationName: 'Piazza del Colosseo',
          estimatedCost: '€18',
        },
        {
          id: 'act_102',
          placeId: 'poi_forum',
          period: 'tarde',
          time: '14:00',
          title: 'Fórum Romano',
          description: 'Caminhada pelas ruínas da Roma antiga.',
          locationName: 'Via della Salara Vecchia',
          estimatedCost: '€0',
        },
      ],
    },
  ];

  const tripInput: CreateTripInput = {
    destination: {
      name: 'Roma',
      country: 'Itália',
      latitude: 41.9028,
      longitude: 12.4964,
    },
    imageUrl: 'https://images.unsplash.com/rome.jpg',
    startDate: '2026-11-10',
    endDate: '2026-11-15',
    totalDays: 6,
    status: 'planejamento',
    itinerary: sampleItinerary,
    weatherSummary: {
      avgTempMax: 22,
      avgTempMin: 14,
      conditions: 'Sol com nuvens',
      fetchedAt: new Date().toISOString(),
    },
    visibility: 'private',
  };

  // Prepara Viagem do Usuário A (Alice)
  const tripA = await repo.createTrip(USER_A, USER_A, tripInput);
  assert(tripA.visibility === 'private', 'Setup: Viagem criada inicialmente como privada por Alice');

  // 1. Privado sem autenticação
  try {
    // Tentativa de leitura sem autenticação (currentAuthUid = null)
    await repo.getTripById(USER_A, null, tripA.id);
    assert(false, '1. Privado sem autenticação deve ser bloqueado com erro');
  } catch (err: any) {
    assert(
      err.message.includes('unauthenticated') || err.message.includes('permission-denied'),
      '1. Privado sem autenticação é bloqueado no repositório (não depende apenas de UI)',
      err.message
    );
  }

  // 2. Privado com outro usuário (User B tentando acessar viagem privada de Alice)
  try {
    await repo.getTripById(USER_A, USER_B, tripA.id);
    assert(false, '2. Privado com outro usuário deve disparar erro de permissão');
  } catch (err: any) {
    assert(
      err.message.includes('permission-denied'),
      '2. Privado com outro usuário é bloqueado com permission-denied (anti-IDOR)',
      err.message
    );
  }

  // 3. Dono (Alice acessa e edita sua própria viagem)
  try {
    const readByOwner = await repo.getTripById(USER_A, USER_A, tripA.id);
    const updatedByOwner = await repo.updateTrip(USER_A, USER_A, tripA.id, {
      isFavorite: true,
      status: 'confirmada',
    });

    assert(
      readByOwner !== null &&
      readByOwner.id === tripA.id &&
      updatedByOwner.isFavorite === true &&
      updatedByOwner.status === 'confirmada',
      '3. Dono tem acesso total de leitura e escrita a sua viagem'
    );
  } catch (err: any) {
    assert(false, '3. Dono deve conseguir ler e alterar sua própria viagem', err.message);
  }

  // 4. Link compartilhado (Alice gera link de compartilhamento)
  let sharedToken = '';
  try {
    const updatedToLink = await repo.changeTripVisibility(USER_A, USER_A, tripA.id, 'link');
    assert(updatedToLink.visibility === 'link', '4.1. Dono altera visibilidade para "link"');
    assert(Boolean(updatedToLink.shareToken), '4.2. Token seguro é gerado para o compartilhamento');
    sharedToken = updatedToLink.shareToken || '';

    // Acesso anônimo via token público
    const sharedData = await repo.getSharedTripByToken(sharedToken);
    assert(sharedData !== null, '4.3. Link compartilhado permite leitura via token');
    assert(
      sharedData?.destination.name === 'Roma' && sharedData?.itinerary.length === 1,
      '4.4. Dados do roteiro são retornados corretamente via link'
    );
    // Verificação de Zero PII Leakage
    const rawShared = sharedData as any;
    assert(
      rawShared.userId === undefined && rawShared.userNotes === undefined,
      '4.5. Projeção sanitizada estrita não vaza PII (sem userId, sem notas privadas)'
    );
  } catch (err: any) {
    assert(false, '4. Falha no acesso por link compartilhado', err.message);
  }

  // 5. Link revogado (Alice revoga o compartilhamento voltando para private)
  try {
    await repo.revokeShareLink(USER_A, USER_A, tripA.id);
    const afterRevokeOwner = await repo.getTripById(USER_A, USER_A, tripA.id);
    assert(afterRevokeOwner?.visibility === 'private', '5.1. Viagem revertida para visibilidade "private"');
    assert(afterRevokeOwner?.shareToken === undefined, '5.2. Token anterior é destruído');

    // Consulta com o token antigo após revogação
    const staleAccess = await repo.getSharedTripByToken(sharedToken);
    assert(staleAccess === null, '5.3. Link revogado retorna imediatamente null (404/indisponível)');
  } catch (err: any) {
    assert(false, '5. Falha no teste de revogação de link', err.message);
  }

  // 6. Público (Alice torna o roteiro público)
  const publicTripA = await repo.changeTripVisibility(USER_A, USER_A, tripA.id, 'public');
  assert(publicTripA.visibility === 'public', '6.1. Dono altera visibilidade para "public"');

  const publicList = await repo.listPublicTrips();
  const foundInPublic = publicList.some(p => p.id === tripA.id);
  assert(foundInPublic, '6.2. Viagem pública aparece na listagem global pública (Explore)');

  // Qualquer pessoa sem login pode ler a viagem pública via getTripById
  const publicUnauthRead = await repo.getTripById(USER_A, null, tripA.id);
  assert(
    publicUnauthRead !== null && publicUnauthRead.id === tripA.id,
    '6.3. Viagem pública pode ser lida diretamente mesmo sem autenticação'
  );

  // 7. Troca public → private
  await repo.changeTripVisibility(USER_A, USER_A, tripA.id, 'private');
  const publicListAfterPrivate = await repo.listPublicTrips();
  const stillInPublic = publicListAfterPrivate.some(p => p.id === tripA.id);
  assert(!stillInPublic, '7.1. Ao trocar public → private, viagem é imediatamente removida da listagem pública');

  try {
    await repo.getTripById(USER_A, null, tripA.id);
    assert(false, '7.2. Leitura não-autenticada deve ser bloqueada após conversão para private');
  } catch (err: any) {
    assert(
      err.message.includes('unauthenticated') || err.message.includes('permission-denied'),
      '7.2. Acesso sem auth é bloqueado imediatamente após conversão para private'
    );
  }

  // 8, 9, 10, 11: "Usar Este Roteiro" (forkTrip)
  // Deixa a viagem de Alice como pública ou com link para permitir clonagem
  await repo.changeTripVisibility(USER_A, USER_A, tripA.id, 'public');

  // Bob (usuário autenticado) decide usar o roteiro com novas datas
  const newStartDate = '2027-04-01';
  const newEndDate = '2027-04-07';

  // Tentativa de cópia sem autenticação deve ser rejeitada
  try {
    await repo.forkTrip('', tripA.id, { newStartDate, newEndDate });
    assert(false, '8.1. Cópia sem autenticação deve ser rejeitada');
  } catch (err: any) {
    assert(err.message.includes('permission-denied'), '8.1. Cópia sem autenticação bloqueada');
  }

  // 8. Cópia por usuário autenticado (Bob)
  const bobForkedTrip = await repo.forkTrip(USER_B, tripA.id, {
    newStartDate,
    newEndDate,
  });

  assert(Boolean(bobForkedTrip && bobForkedTrip.id), '8.2. Cópia criada com sucesso por usuário autenticado');
  assert(bobForkedTrip.id !== tripA.id, '8.3. Cópia recebe novo ID único e isolado');

  // 9. Cópia mantém original intacto
  const originalAfterFork = await repo.getTripById(USER_A, USER_A, tripA.id);
  assert(
    originalAfterFork?.userId === USER_A &&
    originalAfterFork?.startDate === '2026-11-10' &&
    originalAfterFork?.endDate === '2026-11-15' &&
    originalAfterFork?.visibility === 'public',
    '9. Cópia mantém original completamente inalterado (dono, datas e visibilidade originais intactos)'
  );

  // 10. Cópia recebe novo owner e começa estritamente privada
  assert(bobForkedTrip.userId === USER_B, '10.1. Cópia recebe Bob como novo owner (userId = USER_B)');
  assert(bobForkedTrip.visibility === 'private', '10.2. Nova viagem clonada começa estritamente como "private"');
  assert(bobForkedTrip.sourceTripId === tripA.id, '10.3. Referência sourceTripId aponta para o roteiro original');

  // Alice não pode acessar a cópia privada de Bob
  try {
    await repo.getTripById(USER_B, USER_A, bobForkedTrip.id);
    assert(false, '10.4. Alice não deve ter permissão de acessar a nova viagem privada de Bob');
  } catch (err: any) {
    assert(err.message.includes('permission-denied'), '10.4. Cópia privada de Bob é inacessível para Alice (anti-IDOR)');
  }

  // 11. Dados externos são marcados para revalidação
  assert(
    bobForkedTrip.revalidationRequired?.weather === true &&
    bobForkedTrip.revalidationRequired?.places === true,
    '11.1. revalidationRequired marca weather e places como pendentes de revalidação'
  );
  assert(
    bobForkedTrip.weatherSummary?.needsRevalidation === true,
    '11.2. weatherSummary possui flag explícita needsRevalidation: true'
  );

  console.log(`\n========================================`);
  console.log(`TOTAL DE TESTES: ${passed + failed}`);
  console.log(`PASSOU: ${passed}`);
  console.log(`FALHOU: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSharingTests().catch(err => {
  console.error('Erro fatal executando testes:', err);
  process.exit(1);
});
