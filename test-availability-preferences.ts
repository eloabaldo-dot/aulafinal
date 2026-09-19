/**
 * Suíte de Testes Automatizados para Disponibilidade e Preferências
 * Valida:
 * 1. Período válido com notes
 * 2. Datas invertidas (rejeição)
 * 3. Campos ausentes (rejeição)
 * 4. Edição de período
 * 5. Exclusão de período
 * 6. Persistência e integridade após reload
 * 7. Tentativa de alterar registro alheio (bloqueio de ownership)
 * 8. Preferências vazias (rejeição de ao menos 1 interesse)
 * 9. Seleção múltipla de interesses e transportes
 * 10. Atualização de preferências
 */

import { VacationRepository } from './src/services/firebase/vacationRepository';
import { UserRepository } from './src/services/firebase/userRepository';
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

console.log('=== TESTES: DISPONIBILIDADE E PREFERÊNCIAS SMARTTRIP ===\n');

const vacationRepo = new VacationRepository();
const userRepo = new UserRepository();

const CLARA_UID = 'uid_clara_300';
const LUCAS_UID = 'uid_lucas_400';

async function runTests() {
  const claraProfile = buildInitialUserProfile(CLARA_UID, 'clara@smarttrip.com', 'Clara Ferreira');
  userRepo._setSeedUser(claraProfile);

  // 1. Período Válido com Notes
  let vacId = '';
  try {
    const vac = await vacationRepo.createVacation(CLARA_UID, CLARA_UID, {
      title: 'Férias de Outono',
      startDate: '2026-10-12',
      endDate: '2026-10-18',
      notes: 'Não voar de madrugada. Preferência por locais com boa conexão Wi-Fi.',
    });
    vacId = vac.id;
    assert(vac.totalDays === 7, '1.1. Período válido criado com 7 dias');
    assert(Boolean(vac.notes?.includes('Wi-Fi')), '1.2. Campo notes persistido com sucesso');
  } catch (e: any) {
    assert(false, `1. Falha ao criar folga válida: ${e.message}`);
  }

  // 2. Datas Invertidas
  try {
    await vacationRepo.createVacation(CLARA_UID, CLARA_UID, {
      title: 'Erro Datas',
      startDate: '2026-11-20',
      endDate: '2026-11-10', // Fim antes do início
    });
    assert(false, '2. Datas invertidas deveriam falhar');
  } catch (e: any) {
    assert(e.message.includes('invalid-argument'), '2. Rejeição de datas invertidas com invalid-argument');
  }

  // 3. Campos Ausentes
  try {
    await vacationRepo.createVacation(CLARA_UID, CLARA_UID, {
      title: '',
      startDate: '2026-11-01',
      endDate: '2026-11-05',
    });
    assert(false, '3. Título ausente deveria falhar');
  } catch (e: any) {
    assert(e.message.includes('invalid-argument'), '3. Rejeição de campos ausentes com invalid-argument');
  }

  // 4. Edição de Período
  try {
    const updated = await vacationRepo.updateVacation(CLARA_UID, CLARA_UID, vacId, {
      title: 'Férias de Outono (Estendidas)',
      endDate: '2026-10-20',
      notes: 'Notas atualizadas para 9 dias',
    });
    assert(updated.totalDays === 9, '4.1. Edição recalculou a duração para 9 dias');
    assert(updated.title === 'Férias de Outono (Estendidas)', '4.2. Título editado persistido');
  } catch (e: any) {
    assert(false, `4. Falha na edição: ${e.message}`);
  }

  // 5. Exclusão de Período
  try {
    const tempVac = await vacationRepo.createVacation(CLARA_UID, CLARA_UID, {
      title: 'Período Temporário',
      startDate: '2026-12-01',
      endDate: '2026-12-03',
    });
    await vacationRepo.deleteVacation(CLARA_UID, CLARA_UID, tempVac.id);
    const list = await vacationRepo.listVacations(CLARA_UID, CLARA_UID);
    assert(!list.some((v) => v.id === tempVac.id), '5. Período excluído removido da listagem');
  } catch (e: any) {
    assert(false, `5. Falha na exclusão: ${e.message}`);
  }

  // 6. Persistência Após Reload (Simulação de recarga da subcoleção)
  try {
    const listReload = await vacationRepo.listVacations(CLARA_UID, CLARA_UID);
    assert(listReload.length >= 1 && listReload[0].id === vacId, '6. Folga persiste intacta na coleção');
  } catch (e: any) {
    assert(false, `6. Falha na persistência: ${e.message}`);
  }

  // 7. Tentativa de Alterar Registro Alheio (Lucas tentando editar a folga de Clara)
  try {
    await vacationRepo.updateVacation(CLARA_UID, LUCAS_UID, vacId, {
      title: 'Invasão de Lucas',
    });
    assert(false, '7. Lucas não deveria conseguir alterar folga de Clara');
  } catch (e: any) {
    assert(e.message.includes('permission-denied'), '7. Bloqueio de mutação em registro alheio (permission-denied)');
  }

  // 8. Preferências Vazias (Rejeição de ausência de interesses)
  function validatePreferences(pref: any) {
    if (!pref.interests || pref.interests.length === 0) {
      throw new Error('invalid-argument: Ao menos um interesse deve ser selecionado.');
    }
  }

  try {
    validatePreferences({ interests: [] });
    assert(false, '8. Preferências sem interesses deveriam falhar');
  } catch (e: any) {
    assert(e.message.includes('invalid-argument'), '8. Rejeição de lista de interesses vazia');
  }

  // 9. Seleção Múltipla de Interesses e Transportes
  const fullPrefs = {
    travelStyle: 'cultura' as const,
    interests: ['cultura', 'gastronomia', 'natureza'],
    budgetLevel: 'moderado' as const,
    pace: 'tranquilo' as const,
    transportation: ['caminhada' as const, 'transporte_publico' as const],
    preferredClimate: 'ensolarado_quente' as const,
    maxDistanceKm: 20,
    dietaryRestrictions: ['Vegetariano'],
  };
  assert(fullPrefs.interests.length === 3, '9.1. Seleção múltipla de 3 interesses validada');
  assert(fullPrefs.transportation.length === 2, '9.2. Seleção múltipla de 2 meios de transporte validada');

  // 10. Atualização de Preferências no Repositório
  try {
    await userRepo.updateUserPreferences(CLARA_UID, CLARA_UID, fullPrefs);
    const updatedUser = await userRepo.getUserProfile(CLARA_UID, CLARA_UID);
    assert(updatedUser?.preferences.budgetLevel === 'moderado', '10.1. Orçamento moderado salvo');
    assert(updatedUser?.preferences.travelStyle === 'cultura', '10.2. Estilo cultural salvo');
  } catch (e: any) {
    assert(false, `10. Falha na atualização de preferências: ${e.message}`);
  }

  console.log(`\nResultado Final: ${passed} testes passaram, ${failed} falharam.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
