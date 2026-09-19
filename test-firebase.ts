/**
 * Script de verificação automatizada da camada Firebase do SmartTrip
 * Executado via Node.js / tsx para certificar conformidade com a SPEC técnica.
 */
import {
  getFirebaseClientConfig,
  getFirebaseClient,
  _resetFirebaseClientForTesting,
} from './src/services/firebase/client';
import {
  getFirebaseAdminConfig,
  getFirebaseAdmin,
  _resetFirebaseAdminForTesting,
} from './src/services/firebase/admin';

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

console.log('=== TESTES AUTOMATIZADOS: CAMADA FIREBASE DO SMARTTRIP ===\n');

// 1. Teste: Client SDK detecta ausência de variáveis obrigatórias
try {
  _resetFirebaseClientForTesting();
  delete process.env.VITE_FIREBASE_API_KEY;
  delete process.env.VITE_FIREBASE_AUTH_DOMAIN;
  delete process.env.VITE_FIREBASE_PROJECT_ID;
  delete process.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  delete process.env.VITE_FIREBASE_APP_ID;

  getFirebaseClientConfig();
  assert(false, '1. Deve lançar erro quando chaves públicas do Firebase estiverem ausentes');
} catch (e: any) {
  assert(
    e.message.includes('Configuração obrigatória ausente no ambiente'),
    '1. Client SDK lança erro claro quando variáveis obrigatórias estão ausentes'
  );
}

// 2. Teste: Client SDK inicializa corretamente com variáveis fornecidas
try {
  _resetFirebaseClientForTesting();
  process.env.VITE_FIREBASE_API_KEY = 'test-api-key';
  process.env.VITE_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
  process.env.VITE_FIREBASE_PROJECT_ID = 'smarttrip-mvp-test';
  process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = '123456789';
  process.env.VITE_FIREBASE_APP_ID = '1:123456789:web:abcdef';

  const client1 = getFirebaseClient();
  assert(client1.app.options.projectId === 'smarttrip-mvp-test', '2.1. Client SDK configurado com sucesso');

  // 3. Teste: Singleton anti-duplicação de instâncias
  const client2 = getFirebaseClient();
  assert(client1 === client2, '2.2. Inicialização Singleton: getFirebaseClient retorna a mesma instância');
} catch (e: any) {
  assert(false, `2. Falha na inicialização do Client SDK: ${e.message}`);
}

// 4. Teste: Admin SDK bloqueia execução em ambiente browser
try {
  _resetFirebaseAdminForTesting();
  // @ts-ignore
  global.window = {} as any;
  getFirebaseAdminConfig();
  assert(false, '3. Deve bloquear execução do Admin SDK se window estiver definido');
} catch (e: any) {
  assert(
    e.message.includes('Firebase Security Alert'),
    '3. Admin SDK bloqueia execução no ambiente do navegador com erro de segurança'
  );
} finally {
  // @ts-ignore
  delete global.window;
}

// 5. Teste: Admin SDK detecta ausência de credenciais privadas de servidor
try {
  _resetFirebaseAdminForTesting();
  delete process.env.FIREBASE_PROJECT_ID;
  delete process.env.FIREBASE_CLIENT_EMAIL;
  delete process.env.FIREBASE_PRIVATE_KEY;

  getFirebaseAdminConfig();
  assert(false, '4. Deve lançar erro se credenciais de servidor estiverem ausentes');
} catch (e: any) {
  assert(
    e.message.includes('Configuração de servidor ausente'),
    '4. Admin SDK lança erro claro quando chaves privadas estão ausentes'
  );
}

// 6. Teste: Admin SDK inicializa Singleton no backend
try {
  _resetFirebaseAdminForTesting();
  process.env.FIREBASE_PROJECT_ID = 'smarttrip-admin-test';
  process.env.FIREBASE_CLIENT_EMAIL = 'admin@smarttrip-test.iam.gserviceaccount.com';
  process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC\\n-----END PRIVATE KEY-----';

  const admin1 = getFirebaseAdmin();
  assert(admin1.projectId === 'smarttrip-admin-test', '5.1. Admin SDK configurado no servidor');
  const admin2 = getFirebaseAdmin();
  assert(admin1 === admin2, '5.2. Admin SDK retorna a mesma instância Singleton');
} catch (e: any) {
  assert(false, `5. Falha no Admin SDK: ${e.message}`);
}

console.log(`\nResumo: ${passed} testes passaram, ${failed} falharam.`);
if (failed > 0) {
  process.exit(1);
}
