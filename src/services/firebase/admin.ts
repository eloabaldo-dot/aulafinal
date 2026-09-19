/**
 * Configuração e credenciais de conta de serviço (Server-Side Only)
 */
export interface FirebaseAdminConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

export interface FirebaseAdminInstance {
  name: string;
  projectId: string;
  isPrivileged: boolean;
}

let adminInstance: FirebaseAdminInstance | null = null;

/**
 * Lê e valida as variáveis privadas de servidor para o Firebase Admin SDK.
 * ATENÇÃO: Este módulo NUNCA deve ser importado em componentes ou rotas do cliente.
 */
export function getFirebaseAdminConfig(): FirebaseAdminConfig {
  // Verificação defensiva de ambiente de execução
  if (typeof window !== 'undefined') {
    throw new Error(
      '[Firebase Security Alert] O módulo Firebase Admin SDK foi importado no ambiente do navegador! ' +
      'Credenciais administrativas e chaves privadas jamais devem ser expostas no cliente.'
    );
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  const missing: string[] = [];
  if (!projectId) missing.push('FIREBASE_PROJECT_ID');
  if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
  if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');

  if (missing.length > 0 || !projectId || !clientEmail || !privateKey) {
    throw new Error(
      `[Firebase Admin] Configuração de servidor ausente: ${missing.join(', ')}. ` +
      `Configure as credenciais administrativas em seu arquivo de ambiente seguro no backend.`
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };
}

/**
 * Inicialização Singleton do Firebase Admin SDK Server-Side
 */
export function getFirebaseAdmin(): FirebaseAdminInstance {
  if (adminInstance) {
    return adminInstance;
  }

  const config = getFirebaseAdminConfig();

  adminInstance = {
    name: '[ADMIN_DEFAULT]',
    projectId: config.projectId,
    isPrivileged: true,
  };

  return adminInstance;
}

/**
 * Utilitário de reset exclusivo para testes de backend
 */
export function _resetFirebaseAdminForTesting(): void {
  adminInstance = null;
}
