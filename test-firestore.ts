/**
 * Suíte de Testes Automatizados da Camada de Persistência Firestore
 * Valida:
 * 1. Criar perfil, folga e viagem
 * 2. Ler dados próprios com sucesso
 * 3. Atualizar preferências e itinerário
 * 4. Excluir período e viagem com integridade
 * 5. Isolamento estrito: Usuário A versus Usuário B (tentativas de leitura, edição e exclusão cruzada)
 * 6. Tratamento de documento inexistente (not-found)
 * 7. Rejeição de dados inválidos (datas invertidas, campos faltando)
 */

import { UserRepository } from './src/services/firebase/userRepository';
import { VacationRepository } from './src/services/firebase/vacationRepository';
import { TripRepository } from './src/services/firebase/tripRepository';
import { buildInitialUserProfile } from './src/modules/auth/authService';

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

console.log('=== TESTES AUTOMATIZADOS: PERSISTÊNCIA FIRESTORE SMARTTRIP ===\n');

const userRepo = new UserRepository();
const vacationRepo = new VacationRepository();
const tripRepo = new TripRepository();

const CLARA_UID = 'uid_clara_100';
const LUCAS_UID = 'uid_lucas_200';

async function runTests() {
  // Configuração inicial de usuários
  const claraProfile = buildInitialUserProfile(CLARA_UID, 'clara@smarttrip.com', 'Clara Ferreira');
  const lucasProfile = buildInitialUserProfile(LUCAS_UID, 'lucas@smarttrip.com', 'Lucas Toledo');
  userRepo._setSeedUser(claraProfile);
  userRepo._setSeedUser(lucasProfile);

  // 1. Teste: Criar e Ler Perfil
  try {
    const profile = await userRepo.getUserProfile(CLARA_UID, CLARA_UID);
    assert(profile?.displayName === 'Clara Ferreira', '1.1. Leitura de perfil próprio realizada com sucesso');
  } catch (e: any) {
    assert(false, `1.1. Falha ao ler perfil: ${e.message}`);
  }

  // 2. Teste: Atualizar Preferências
  try {
    await userRepo.updateUserPreferences(CLARA_UID, CLARA_UID, {
      travelStyle: 'gastronomia',
      budgetLevel: 'luxo',
      pace: 'intenso',
      dietaryRestrictions: ['Sem Glúten'],
    });
    const updated = await userRepo.getUserProfile(CLARA_UID, CLARA_UID);
    assert(updated?.preferences.travelStyle === 'gastronomia', '2.1. Preferências atualizadas com sucesso');
  } catch (e: any) {
    assert(false, `2.1. Falha ao atualizar preferências: ${e.message}`);
  }

  // 3. Teste: Criar Período de Folga
  let claraVacationId = '';
  try {
    const vac = await vacationRepo.createVacation(CLARA_UID, CLARA_UID, {
      title: 'Férias de Julho',
      startDate: '2026-07-10',
      endDate: '2026-07-20',
    });
    claraVacationId = vac.id;
    assert(vac.totalDays === 11, '3.1. Folga criada com cálculo correto de dias');
    const list = await vacationRepo.listVacations(CLARA_UID, CLARA_UID);
    assert(list.length === 1 && list[0].id === vac.id, '3.2. Listagem de folgas da subcoleção retornada');
  } catch (e: any) {
    assert(false, `3. Falha em folgas: ${e.message}`);
  }

  // 4. Teste: Criar Viagem com Itinerário Embutido
  let claraTripId = '';
  try {
    const trip = await tripRepo.createTrip(CLARA_UID, CLARA_UID, {
      destination: {
        name: 'Lisboa',
        country: 'Portugal',
        latitude: 38.72,
        longitude: -9.13,
      },
      imageUrl: 'https://images.unsplash.com/photo-lisboa',
      startDate: '2026-10-12',
      endDate: '2026-10-18',
      totalDays: 7,
      status: 'confirmada',
      itinerary: [
        {
          dayNumber: 1,
          date: '2026-10-12',
          theme: 'Chegada',
          activities: [
            {
              id: 'act_1',
              period: 'manha',
              time: '09:00',
              title: 'Caminhada Baixa',
              description: 'Passeio inicial',
              locationName: 'Baixa',
            },
          ],
        },
      ],
    });
    claraTripId = trip.id;
    assert(trip.destination === 'Lisboa', '4.1. Viagem criada na subcoleção /users/{userId}/trips');
    assert(trip.itinerary[0].activities.length === 1, '4.2. Itinerário embutido salvo sem queries secundárias');
  } catch (e: any) {
    assert(false, `4. Falha ao criar viagem: ${e.message}`);
  }

  // 5. Teste: Atualizar Itinerário (Controle Editorial)
  try {
    await tripRepo.updateTripItinerary(CLARA_UID, CLARA_UID, claraTripId, [
      {
        dayNumber: 1,
        date: '2026-10-12',
        theme: 'Chegada & Relax',
        activities: [
          {
            id: 'act_1',
            period: 'manha',
            time: '10:30',
            title: 'Caminhada Baixa - Horário Ajustado',
            description: 'Passeio revisado',
            locationName: 'Baixa Pombalina',
          },
        ],
      },
    ]);
    const readTrip = await tripRepo.getTripById(CLARA_UID, CLARA_UID, claraTripId);
    assert(
      readTrip?.itinerary[0].theme === 'Chegada & Relax',
      '5.1. Itinerário atualizado por controle editorial'
    );
  } catch (e: any) {
    assert(false, `5. Falha ao atualizar itinerário: ${e.message}`);
  }

  // 6. Teste: Usuário A vs Usuário B (Tentativas de Invasão de Subcoleções)
  // 6.1 Lucas tenta ler a viagem de Clara
  try {
    await tripRepo.getTripById(CLARA_UID, LUCAS_UID, claraTripId);
    assert(false, '6.1. Lucas deveria ser bloqueado de ler viagem de Clara');
  } catch (e: any) {
    assert(e.message.includes('permission-denied'), '6.1. Bloqueio de leitura de viagem de outro usuário (permission-denied)');
  }

  // 6.2 Lucas tenta excluir o período de folga de Clara
  try {
    await vacationRepo.deleteVacation(CLARA_UID, LUCAS_UID, claraVacationId);
    assert(false, '6.2. Lucas deveria ser bloqueado de excluir folga de Clara');
  } catch (e: any) {
    assert(e.message.includes('permission-denied'), '6.2. Bloqueio de exclusão cruzada de folgas (permission-denied)');
  }

  // 6.3 Lucas tenta alterar as preferências de Clara
  try {
    await userRepo.updateUserPreferences(CLARA_UID, LUCAS_UID, {
      travelStyle: 'aventura',
      budgetLevel: 'economico',
      pace: 'intenso',
      dietaryRestrictions: [],
    });
    assert(false, '6.3. Lucas deveria ser bloqueado de alterar preferências de Clara');
  } catch (e: any) {
    assert(e.message.includes('permission-denied'), '6.3. Bloqueio de mutação cruzada de preferências (permission-denied)');
  }

  // 7. Teste: Documento Inexistente (not-found)
  try {
    const nonExistent = await tripRepo.getTripById(CLARA_UID, CLARA_UID, 'trip_fantasma_999');
    assert(nonExistent === null, '7.1. Leitura de viagem inexistente retorna null sem quebrar');
    await tripRepo.deleteTrip(CLARA_UID, CLARA_UID, 'trip_fantasma_999');
    assert(false, '7.2. Excluir documento inexistente deve lançar not-found');
  } catch (e: any) {
    assert(e.message.includes('not-found'), '7.2. Erro claro de documento inexistente (not-found)');
  }

  // 8. Teste: Rejeição de Dados Inválidos
  // 8.1 Datas invertidas
  try {
    await vacationRepo.createVacation(CLARA_UID, CLARA_UID, {
      title: 'Data Invertida',
      startDate: '2026-12-30',
      endDate: '2026-12-20', // Anterior à de início
    });
    assert(false, '8.1. Datas invertidas deveriam ser bloqueadas');
  } catch (e: any) {
    assert(e.message.includes('invalid-argument'), '8.1. Rejeição de datas invertidas (invalid-argument)');
  }

  // 8.2 Campos obrigatórios ausentes
  try {
    await userRepo.updateUserPreferences(CLARA_UID, CLARA_UID, {} as any);
    assert(false, '8.2. Preferências vazias deveriam falhar');
  } catch (e: any) {
    assert(e.message.includes('invalid-argument'), '8.2. Rejeição de objeto incompleto (invalid-argument)');
  }

  // 9. Teste: Excluir com Sucesso
  try {
    await tripRepo.deleteTrip(CLARA_UID, CLARA_UID, claraTripId);
    const afterDelete = await tripRepo.getTripById(CLARA_UID, CLARA_UID, claraTripId);
    assert(afterDelete === null, '9.1. Exclusão de viagem realizada com sucesso');

    await vacationRepo.deleteVacation(CLARA_UID, CLARA_UID, claraVacationId);
    const vacListAfter = await vacationRepo.listVacations(CLARA_UID, CLARA_UID);
    assert(vacListAfter.length === 0, '9.2. Exclusão de período de folga realizada com sucesso');
  } catch (e: any) {
    assert(false, `9. Falha na exclusão: ${e.message}`);
  }

  console.log(`\nResultado Final: ${passed} testes passaram, ${failed} falharam.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
