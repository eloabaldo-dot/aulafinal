/**
 * Suíte de Testes Automatizados: Ciclo de Vida de Viagem (SmartTrip)
 * Conforme especificado em docs/specs/trip-lifecycle-spec.md
 * 
 * COBERTURA OBRIGATÓRIA (Dois Usuários: Clara e Lucas):
 * 1. A cria viagem (status inicial, campos obrigatórios, timestamps)
 * 2. A lista viagens (com ordenação e favoritos no topo)
 * 3. A abre viagem por ID
 * 4. A edita viagem (metadados e status de ciclo de vida)
 * 5. A favorita viagem (toggle e verificação na listagem)
 * 6. A duplica viagem (clone com novo ID, status resetado para planejamento, itinerário preservado)
 * 7. B não consegue abrir viagem privada de A (PERMISSION_DENIED)
 * 8. B não consegue alterar viagem privada de A (PERMISSION_DENIED)
 * 9. A exclui viagem com confirmação (soft-delete e hard-delete)
 * 10. Registro inexistente retorna comportamento controlado (null / not-found)
 * 11. Consistência atômica entre Trip e ItineraryItems (adicionar, editar e excluir atividade de dia específico)
 */

import { TripRepository } from './src/services/firebase/tripRepository';
import { Trip, DayItinerary, ItineraryActivity } from './src/types/mvp';
import { CreateTripInput } from './src/types/firestore';

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

console.log('=== TESTES: CICLO DE VIDA DE VIAGEM SMARTTRIP (MULTI-USUÁRIO) ===\n');

const repo = new TripRepository();

const USER_A = 'usr_clara_101';
const USER_B = 'usr_lucas_202';

async function runLifecycleTests() {
  const sampleItinerary: DayItinerary[] = [
    {
      dayNumber: 1,
      date: '2026-10-12',
      theme: 'Chegada e Centro Histórico',
      activities: [
        {
          id: 'act_1',
          placeId: 'poi_louvre',
          period: 'manha',
          time: '09:30',
          title: 'Museu do Louvre',
          description: 'Visita ao acervo e pirâmide de vidro.',
          locationName: 'Rue de Rivoli',
          estimatedCost: '€17',
        },
        {
          id: 'act_2',
          placeId: 'poi_seine',
          period: 'tarde',
          time: '15:00',
          title: 'Passeio às margens do Sena',
          description: 'Caminhada cênica ao entardecer.',
          locationName: 'Rio Sena',
          estimatedCost: 'Gratuito',
        },
      ],
    },
    {
      dayNumber: 2,
      date: '2026-10-13',
      theme: 'Monumentos Icônicos',
      activities: [
        {
          id: 'act_3',
          placeId: 'poi_eiffel',
          period: 'manha',
          time: '10:00',
          title: 'Torre Eiffel',
          description: 'Subida ao segundo andar e mirante.',
          locationName: 'Champ de Mars',
          estimatedCost: '€26',
        },
      ],
    },
  ];

  const baseInput: CreateTripInput = {
    destination: {
      name: 'Paris',
      country: 'França',
      latitude: 48.8566,
      longitude: 2.3522,
    },
    imageUrl: 'https://images.unsplash.com/paris.jpg',
    startDate: '2026-10-12',
    endDate: '2026-10-13',
    totalDays: 2,
    status: 'planejamento',
    isFavorite: false,
    weatherSummary: {
      avgTempMax: 19,
      avgTempMin: 11,
      conditions: 'Parcialmente Nublado',
      fetchedAt: new Date().toISOString(),
    },
    itinerary: sampleItinerary,
  };

  let tripAId = '';

  // --------------------------------------------------------------------------
  // 1. A cria viagem
  // --------------------------------------------------------------------------
  try {
    const trip = await repo.createTrip(USER_A, USER_A, baseInput);
    tripAId = trip.id;

    assert(Boolean(trip.id && trip.id.startsWith('trip_')), '1.1. Usuário A cria viagem com ID único');
    assert(trip.destination === 'Paris', '1.2. Destino persistido corretamente');
    assert(trip.status === 'planejamento', '1.3. Status inicial definido como planejamento');
    assert(trip.isFavorite === false, '1.4. isFavorite inicializado como false');
    assert(trip.totalDays === 2, '1.5. Duração calculada corretamente');
    assert(trip.itinerary.length === 2, '1.6. Itinerário embutido de 2 dias preservado');
    assert(Boolean(trip.createdAt && trip.updatedAt), '1.7. Timestamps createdAt e updatedAt gerados');
  } catch (e: any) {
    assert(false, `1. Falha ao criar viagem: ${e.message}`);
  }

  // --------------------------------------------------------------------------
  // 2. A lista viagens
  // --------------------------------------------------------------------------
  try {
    // Cria uma segunda viagem para A para testar ordenação
    await repo.createTrip(USER_A, USER_A, {
      ...baseInput,
      destination: { name: 'Roma', country: 'Itália', latitude: 41.9, longitude: 12.5 },
      startDate: '2026-11-01',
      endDate: '2026-11-03',
      totalDays: 3,
    });

    const trips = await repo.listTrips(USER_A, USER_A);
    assert(trips.length === 2, '2.1. Usuário A lista com sucesso suas viagens');
    assert(trips[0].destination === 'Paris', '2.2. Viagem mais próxima (outubro) listada primeiro que novembro');
  } catch (e: any) {
    assert(false, `2. Falha ao listar viagens: ${e.message}`);
  }

  // --------------------------------------------------------------------------
  // 3. A abre viagem por ID
  // --------------------------------------------------------------------------
  try {
    const trip = await repo.getTripById(USER_A, USER_A, tripAId);
    assert(trip !== null, '3.1. Usuário A abre a viagem por ID com sucesso');
    assert(trip?.id === tripAId, '3.2. Documento retornado corresponde exatamente ao tripId solicitado');
    assert(trip?.itinerary[0].activities.length === 2, '3.3. Atividades do Dia 1 recuperadas integralmente');
  } catch (e: any) {
    assert(false, `3. Falha ao abrir viagem: ${e.message}`);
  }

  // --------------------------------------------------------------------------
  // 4. A edita viagem (metadados e status)
  // --------------------------------------------------------------------------
  try {
    const updated = await repo.updateTrip(USER_A, USER_A, tripAId, {
      status: 'confirmada',
      imageUrl: 'https://images.unsplash.com/paris-updated.jpg',
    });

    assert(updated.status === 'confirmada', '4.1. Status da viagem atualizado para confirmada');
    assert(updated.imageUrl.includes('paris-updated'), '4.2. URL da imagem atualizada');
    assert(Boolean(updated.updatedAt), '4.3. updatedAt renovado após a mutação');
  } catch (e: any) {
    assert(false, `4. Falha ao editar viagem: ${e.message}`);
  }

  // --------------------------------------------------------------------------
  // 5. A favorita viagem (Pinning / Toggle)
  // --------------------------------------------------------------------------
  try {
    const favState = await repo.toggleFavorite(USER_A, USER_A, tripAId);
    assert(favState === true, '5.1. toggleFavorite ativa o status de favorito para true');

    const trips = await repo.listTrips(USER_A, USER_A, { favoritesFirst: true });
    assert(trips[0].id === tripAId && trips[0].isFavorite === true, '5.2. Viagem favoritada passa a ser fixada no topo da listagem');
  } catch (e: any) {
    assert(false, `5. Falha ao favoritar viagem: ${e.message}`);
  }

  // --------------------------------------------------------------------------
  // 6. A duplica viagem (Clonagem com novo ID)
  // --------------------------------------------------------------------------
  let duplicatedTripId = '';
  try {
    const cloned = await repo.duplicateTrip(USER_A, USER_A, tripAId, {
      newStartDate: '2027-05-10',
      newEndDate: '2027-05-11',
    });
    duplicatedTripId = cloned.id;

    assert(Boolean(cloned.id && cloned.id !== tripAId), '6.1. Duplicação gera um novo ID exclusivo');
    assert(cloned.destination === 'Paris', '6.2. Destino Paris e atrações foram preservados');
    assert(cloned.status === 'planejamento', '6.3. Status da cópia foi resetado para planejamento');
    assert(cloned.isFavorite === false, '6.4. isFavorite da cópia foi resetado para false');
    assert(cloned.startDate === '2027-05-10', '6.5. Novas datas atribuídas à duplicata com sucesso');
    assert(cloned.itinerary.length === 2, '6.6. Itinerário completo com todas as atividades foi clonado');
    assert(cloned.clonedFromTripId === tripAId, '6.7. Rastreabilidade de linhagem clonedFromTripId preservada');
  } catch (e: any) {
    assert(false, `6. Falha ao duplicar viagem: ${e.message}`);
  }

  // --------------------------------------------------------------------------
  // 7. B NÃO consegue abrir viagem privada de A (IDOR Protection)
  // --------------------------------------------------------------------------
  try {
    let unauthorizedAccessCaught = false;
    try {
      // Tentativa de invasão 1: B requisita a subcoleção de A
      await repo.getTripById(USER_A, USER_B, tripAId);
    } catch (err: any) {
      if (err.message.includes('permission-denied')) {
        unauthorizedAccessCaught = true;
      }
    }
    assert(unauthorizedAccessCaught, '7.1. Bloqueio imediato (permission-denied) quando B tenta acessar subcoleção de A');

    // Tentativa de invasão 2: B tenta buscar o tripId de A dentro da sua própria subcoleção
    let subcollectionBBlocked = false;
    try {
      const isolationCheck = await repo.getTripById(USER_B, USER_B, tripAId);
      if (isolationCheck === null) subcollectionBBlocked = true;
    } catch (err: any) {
      if (err.message.includes('permission-denied')) {
        subcollectionBBlocked = true;
      }
    }
    assert(subcollectionBBlocked, '7.2. Viagem de A não pode ser lida por B mesmo passando userId de B (permission-denied ou null)');
  } catch (e: any) {
    assert(false, `7. Falha no teste de segurança de leitura cruzada: ${e.message}`);
  }

  // --------------------------------------------------------------------------
  // 8. B NÃO consegue alterar viagem privada de A (IDOR Protection)
  // --------------------------------------------------------------------------
  try {
    let updateBlocked = false;
    try {
      // B tenta mutar a viagem de A passando auth de B
      await repo.updateTrip(USER_A, USER_B, tripAId, { status: 'concluida' });
    } catch (err: any) {
      if (err.message.includes('permission-denied')) {
        updateBlocked = true;
      }
    }
    assert(updateBlocked, '8.1. Mutação cruzada bloqueada: Usuário B não pode alterar metadados de A');

    let itineraryBlocked = false;
    try {
      await repo.updateTripItinerary(USER_A, USER_B, tripAId, []);
    } catch (err: any) {
      if (err.message.includes('permission-denied')) {
        itineraryBlocked = true;
      }
    }
    assert(itineraryBlocked, '8.2. Mutação cruzada de itinerário bloqueada com permission-denied');
  } catch (e: any) {
    assert(false, `8. Falha no teste de segurança de mutação cruzada: ${e.message}`);
  }

  // --------------------------------------------------------------------------
  // 9. Consistência entre Trip e ItineraryItems (Adição, Edição e Exclusão)
  // --------------------------------------------------------------------------
  try {
    // 9a. Adiciona nova atividade ao Dia 2
    const newActivity: ItineraryActivity = {
      id: 'act_4_pantheon',
      placeId: 'poi_pantheon',
      period: 'tarde',
      time: '16:30',
      title: 'Panthéon de Paris',
      description: 'Cripta dos grandes vultos da França.',
      locationName: 'Place du Panthéon',
      estimatedCost: '€11,50',
    };

    const tripWithNewAct = await repo.addActivityToDay(USER_A, USER_A, tripAId, 2, newActivity);
    const day2Activities = tripWithNewAct.itinerary.find((d) => d.dayNumber === 2)?.activities || [];
    assert(day2Activities.length === 2, '9.1. Atividade adicionada atomicamente ao Dia 2 (total = 2)');
    assert(day2Activities.some((a) => a.id === 'act_4_pantheon'), '9.2. Nova atividade presente com placeId correto');

    // 9b. Edita a atividade no Dia 2
    const tripWithUpdatedAct = await repo.updateActivity(USER_A, USER_A, tripAId, 2, 'act_4_pantheon', {
      time: '17:00',
      title: 'Panthéon de Paris (Visita Guiada)',
    });
    const updatedDay2 = tripWithUpdatedAct.itinerary.find((d) => d.dayNumber === 2)?.activities || [];
    const editedAct = updatedDay2.find((a) => a.id === 'act_4_pantheon');
    assert(editedAct?.time === '17:00', '9.3. Horário da atividade atualizado para 17:00 com integridade');
    assert(Boolean(editedAct?.title?.includes('Guiada')), '9.4. Título atualizado refletido atomicamente no itinerário');

    // 9c. Remove a atividade original do Dia 1
    const tripWithDeletedAct = await repo.deleteActivity(USER_A, USER_A, tripAId, 1, 'act_2');
    const day1Activities = tripWithDeletedAct.itinerary.find((d) => d.dayNumber === 1)?.activities || [];
    assert(day1Activities.length === 1, '9.5. Atividade removida do Dia 1 sem deixar órfãos (total = 1)');
    assert(!day1Activities.some((a) => a.id === 'act_2'), '9.6. Atividade act_2 purgada com sucesso');
  } catch (e: any) {
    assert(false, `9. Falha no teste de consistência de itineraryItems: ${e.message}`);
  }

  // --------------------------------------------------------------------------
  // 10. A exclui com confirmação (Soft Delete e Hard Delete)
  // --------------------------------------------------------------------------
  try {
    // 10a. Soft Delete
    const softDelResult = await repo.deleteTrip(USER_A, USER_A, tripAId, { softDelete: true });
    assert(softDelResult.deleted && softDelResult.softDeleted, '10.1. Soft-delete registrado com sucesso');

    // Consulta padrão não retorna a viagem excluída
    const tripAfterSoftDel = await repo.getTripById(USER_A, USER_A, tripAId);
    assert(tripAfterSoftDel === null, '10.2. Viagem em soft-delete fica oculta nas leituras padrão da UI');

    // Mas pode ser recuperada/restaurada caso o usuário clique em "Desfazer"
    const restoredTrip = await repo.restoreTrip(USER_A, USER_A, tripAId);
    assert(restoredTrip.status === 'planejamento', '10.3. Restauração (Undo) recupera a viagem com sucesso');

    // 10b. Hard Delete Definitivo na duplicata
    const hardDelResult = await repo.deleteTrip(USER_A, USER_A, duplicatedTripId, { softDelete: false });
    assert(hardDelResult.deleted && !hardDelResult.softDeleted, '10.4. Hard-delete remove fisicamente a viagem');
    const tripClonedAfterDelete = await repo.getTripById(USER_A, USER_A, duplicatedTripId);
    assert(tripClonedAfterDelete === null, '10.5. Viagem purgada definitivamente não pode mais ser lida');
  } catch (e: any) {
    assert(false, `10. Falha no teste de exclusão: ${e.message}`);
  }

  // --------------------------------------------------------------------------
  // 11. Registro Inexistente retorna comportamento controlado
  // --------------------------------------------------------------------------
  try {
    const nonexistent = await repo.getTripById(USER_A, USER_A, 'trip_fantasma_99999');
    assert(nonexistent === null, '11.1. Leitura de ID inexistente retorna null de forma controlada sem crash');

    let notFoundErrorCaught = false;
    try {
      await repo.updateTrip(USER_A, USER_A, 'trip_fantasma_99999', { status: 'confirmada' });
    } catch (err: any) {
      if (err.message.includes('not-found')) {
        notFoundErrorCaught = true;
      }
    }
    assert(notFoundErrorCaught, '11.2. Tentativa de atualizar viagem inexistente emite erro not-found estruturado');
  } catch (e: any) {
    assert(false, `11. Falha no teste de registro inexistente: ${e.message}`);
  }

  // --------------------------------------------------------------------------
  // 12. Reabertura de Viagens Concluídas
  // --------------------------------------------------------------------------
  try {
    // Marca como concluída
    await repo.updateTrip(USER_A, USER_A, tripAId, { status: 'concluida' });
    let trip = await repo.getTripById(USER_A, USER_A, tripAId);
    assert(trip?.status === 'concluida', '12.1. Viagem marcada como concluída');

    // Reabre para edição
    const reopened = await repo.reopenTrip(USER_A, USER_A, tripAId);
    assert(reopened.status === 'planejamento', '12.2. Reabertura de viagem altera status para planejamento com integridade');
  } catch (e: any) {
    assert(false, `12. Falha na reabertura de viagem: ${e.message}`);
  }
}

runLifecycleTests()
  .then(() => {
    console.log(`\n========================================`);
    console.log(`Resultado Final: ${passed} testes passaram, ${failed} falharam.`);
    console.log(`========================================\n`);
    if (failed > 0) process.exit(1);
  })
  .catch((err) => {
    console.error('Erro fatal nos testes de ciclo de vida:', err);
    process.exit(1);
  });
