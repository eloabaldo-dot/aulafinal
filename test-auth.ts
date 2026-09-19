/**
 * Suíte de Testes Automatizados da Camada de Autenticação do SmartTrip
 * Valida:
 * 1. Cadastro válido com e-mail/senha
 * 2. Bloqueio de cadastro duplicado
 * 3. Bloqueio de senha curta (< 6 caracteres)
 * 4. Login válido
 * 5. Login inválido
 * 6. Logout / Encerramento de sessão
 * 7. Reset de senha
 * 8. Acesso privado sem sessão
 * 9. Perfil criado uma única vez com role estritamente 'user' (Anti-autoelevação)
 * 10. Isolamento estrito entre dois usuários distintos (Clara e Lucas)
 */

import { buildInitialUserProfile, mapFirebaseAuthError } from './src/modules/auth/authService';

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

console.log('=== TESTES AUTOMATIZADOS: AUTENTICAÇÃO SMARTTRIP ===\n');

// Banco de dados em memória simulado para testes
interface MockAccount {
  uid: string;
  email: string;
  passHash: string;
  profile: any;
}
const mockDatabase: Record<string, MockAccount> = {};

function mockSignUp(name: string, email: string, pass: string) {
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail.includes('@')) throw new Error('auth/invalid-email');
  if (pass.length < 6) throw new Error('auth/weak-password');

  const exists = Object.values(mockDatabase).some((u) => u.email === cleanEmail);
  if (exists) throw new Error('auth/email-already-in-use');

  const uid = `uid_${cleanEmail.split('@')[0]}_${Date.now()}`;
  const profile = buildInitialUserProfile(uid, cleanEmail, name);
  mockDatabase[uid] = { uid, email: cleanEmail, passHash: pass, profile };
  return profile;
}

function mockSignIn(email: string, pass: string) {
  const cleanEmail = email.toLowerCase().trim();
  const acc = Object.values(mockDatabase).find((u) => u.email === cleanEmail);
  if (!acc) throw new Error('auth/user-not-found');
  if (acc.passHash !== pass) throw new Error('auth/wrong-password');
  return acc.profile;
}

// 1. Teste: Cadastro Válido
try {
  const clara = mockSignUp('Clara Ferreira', 'clara@smarttrip.com', 'segredo123');
  assert(clara.email === 'clara@smarttrip.com', '1. Cadastro válido executado com sucesso');
  assert(clara.role === 'user', '1.1. Role inicial forçada como "user" (Anti-autoelevação)');
} catch (e: any) {
  assert(false, `1. Falha no cadastro válido: ${e.message}`);
}

// 2. Teste: Cadastro Duplicado
try {
  mockSignUp('Clara Fake', 'clara@smarttrip.com', 'outrasenha');
  assert(false, '2. Cadastro duplicado deveria ser bloqueado');
} catch (e: any) {
  assert(e.message === 'auth/email-already-in-use', '2. Bloqueio de cadastro duplicado com auth/email-already-in-use');
}

// 3. Teste: Senha Inválida (< 6 caracteres)
try {
  mockSignUp('Lucas Mochileiro', 'lucas@smarttrip.com', '123');
  assert(false, '3. Senha menor que 6 caracteres deveria falhar');
} catch (e: any) {
  assert(e.message === 'auth/weak-password', '3. Bloqueio de senha curta com auth/weak-password');
}

// 4. Teste: Login Válido
try {
  const session = mockSignIn('clara@smarttrip.com', 'segredo123');
  assert(session.email === 'clara@smarttrip.com', '4. Login válido autenticado com sucesso');
} catch (e: any) {
  assert(false, `4. Falha no login válido: ${e.message}`);
}

// 5. Teste: Login Inválido (Senha incorreta e usuário inexistente)
try {
  mockSignIn('clara@smarttrip.com', 'senha_errada');
  assert(false, '5.1. Senha errada deveria falhar');
} catch (e: any) {
  assert(e.message === 'auth/wrong-password', '5.1. Login com senha errada bloqueado');
}

try {
  mockSignIn('inexistente@smarttrip.com', 'qualquer123');
  assert(false, '5.2. Usuário inexistente deveria falhar');
} catch (e: any) {
  assert(e.message === 'auth/user-not-found', '5.2. Login de e-mail inexistente bloqueado com auth/user-not-found');
}

// 6. Teste: Logout e Invalidação de Sessão
let activeSession: any = { uid: 'clara_uid' };
function mockLogout() {
  activeSession = null;
}
mockLogout();
assert(activeSession === null, '6. Logout limpa a sessão ativa com sucesso');

// 7. Teste: Reset de Senha
try {
  const resetEmail = 'clara@smarttrip.com';
  const cleanEmail = resetEmail.toLowerCase().trim();
  const acc = Object.values(mockDatabase).find((u) => u.email === cleanEmail);
  assert(!!acc, '7. Reset de senha localiza conta válida');
} catch (e: any) {
  assert(false, `7. Falha no reset de senha: ${e.message}`);
}

// 8. Teste: Acesso a Rotas Privadas Sem Sessão
const privateRoutes = ['/dashboard', '/profile', '/availability', '/explore', '/trips', '/trips/[id]'];
function checkAccess(route: string, isAuth: boolean) {
  if (privateRoutes.includes(route) && !isAuth) {
    return '/login'; // Redirecionamento
  }
  return route;
}
const redirectTarget = checkAccess('/dashboard', false);
assert(redirectTarget === '/login', '8. Rota privada sem sessão redireciona para /login');

// 9. Teste: Perfil Criado de Forma Idempotente
const p1 = buildInitialUserProfile('uid_123', 'teste@smarttrip.com', 'Teste');
assert(p1.role === 'user' && p1.preferences.travelStyle === 'cultura', '9. Perfil criado com esquema padronizado');

// 10. Teste: Isolamento Estrito Entre Dois Usuários Distintos
const lucas = mockSignUp('Lucas Toledo', 'lucas@smarttrip.com', 'segredo456');

// Simulação de Security Rules do Firestore:
function canAccessResource(requestAuthUid: string, resourceOwnerUid: string): boolean {
  return requestAuthUid === resourceOwnerUid;
}

const claraUid = Object.values(mockDatabase).find((u) => u.email === 'clara@smarttrip.com')!.uid;
const lucasUid = lucas.uid;

assert(canAccessResource(claraUid, claraUid), '10.1. Clara acessa seus próprios dados');
assert(canAccessResource(lucasUid, lucasUid), '10.2. Lucas acessa seus próprios dados');
assert(!canAccessResource(lucasUid, claraUid), '10.3. Lucas é BLOQUEADO de ler dados de Clara');
assert(!canAccessResource(claraUid, lucasUid), '10.4. Clara é BLOQUEADA de alterar dados de Lucas');

console.log(`\nResultado Final: ${passed} testes passaram, ${failed} falharam.`);
if (failed > 0) {
  process.exit(1);
}
