import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

/**
 * Interface declarativa para a configuração pública do Firebase Client SDK
 */
export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface FirebaseClientInstance {
  app: { name: string; options: FirebaseClientConfig };
  auth: { currentUser: null | { uid: string; email: string }; name: string };
  db: { type: string; projectId: string };
}

// Armazenamento singleton em memória para garantir instância única
let clientInstance: FirebaseClientInstance | null = null;
let nativeAppInstance: FirebaseApp | null = null;
let nativeAnalyticsInstance: Analytics | null = null;

/**
 * Configuração canônica de fallback do projeto Firebase do SmartTrip
 */
export const smartTripFirebaseConfig: FirebaseClientConfig = {
  apiKey: "AIzaSyDoDhgG5FimVM3fbZ2QhdmUyl1g4PDm2pU",
  authDomain: "antigravity-bdf39.firebaseapp.com",
  projectId: "antigravity-bdf39",
  storageBucket: "antigravity-bdf39.firebasestorage.app",
  messagingSenderId: "457588635574",
  appId: "1:457588635574:web:981713e363a935de27b317",
  measurementId: "G-E5TC1V2970"
};

/**
 * Lê e valida as variáveis de ambiente obrigatórias do Firebase Client SDK.
 * Lança erro explícito se alguma variável obrigatória estiver ausente.
 */
export function getFirebaseClientConfig(): FirebaseClientConfig {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (process.env as any || {});
  
  const apiKey = env.VITE_FIREBASE_API_KEY;
  const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = env.VITE_FIREBASE_PROJECT_ID;
  const storageBucket = env.VITE_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = env.VITE_FIREBASE_APP_ID;
  const measurementId = env.VITE_FIREBASE_MEASUREMENT_ID;

  const missingKeys: string[] = [];
  if (!apiKey) missingKeys.push('VITE_FIREBASE_API_KEY');
  if (!authDomain) missingKeys.push('VITE_FIREBASE_AUTH_DOMAIN');
  if (!projectId) missingKeys.push('VITE_FIREBASE_PROJECT_ID');
  if (!messagingSenderId) missingKeys.push('VITE_FIREBASE_MESSAGING_SENDER_ID');
  if (!appId) missingKeys.push('VITE_FIREBASE_APP_ID');

  if (missingKeys.length > 0) {
    throw new Error(
      `[Firebase Client] Configuração obrigatória ausente no ambiente: ${missingKeys.join(', ')}. ` +
      `Por favor, configure estas variáveis em seu arquivo .env.local baseado no .env.example.`
    );
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    measurementId,
  };
}

/**
 * Inicialização Singleton da camada Firebase Client (contrato interno SmartTrip)
 * Previne duplicidade de instâncias garantindo uma única referência global.
 */
export function getFirebaseClient(): FirebaseClientInstance {
  if (clientInstance) {
    return clientInstance;
  }

  const config = getFirebaseClientConfig();

  clientInstance = {
    app: {
      name: '[DEFAULT]',
      options: config,
    },
    auth: {
      currentUser: null,
      name: 'SmartTripAuthClient',
    },
    db: {
      type: 'FirestoreClient',
      projectId: config.projectId,
    },
  };

  return clientInstance;
}

/**
 * Retorna a instância nativa do Firebase App SDK do Google (Singleton seguro contra HMR)
 */
export function getFirebaseNativeApp(): FirebaseApp {
  if (nativeAppInstance) {
    return nativeAppInstance;
  }

  if (getApps().length > 0) {
    nativeAppInstance = getApp();
    return nativeAppInstance;
  }

  let config: FirebaseClientConfig;
  try {
    config = getFirebaseClientConfig();
  } catch {
    config = smartTripFirebaseConfig;
  }

  nativeAppInstance = initializeApp(config);
  return nativeAppInstance;
}

/**
 * Retorna a instância do Firebase Auth oficial
 */
export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseNativeApp());
}

/**
 * Retorna a instância do Cloud Firestore oficial
 */
export function getFirebaseFirestore(): Firestore {
  return getFirestore(getFirebaseNativeApp());
}

/**
 * Inicializa e retorna o Google Analytics oficial quando suportado no browser
 */
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (nativeAnalyticsInstance) {
    return nativeAnalyticsInstance;
  }

  if (typeof window !== 'undefined') {
    try {
      const supported = await isSupported();
      if (supported) {
        nativeAnalyticsInstance = getAnalytics(getFirebaseNativeApp());
        return nativeAnalyticsInstance;
      }
    } catch {
      // Ignora erro em ambientes sem suporte a analytics (ex: restrição de storage ou headless)
    }
  }

  return null;
}

/**
 * Utilitário de reset exclusivo para cenários de testes automatizados
 */
export function _resetFirebaseClientForTesting(): void {
  clientInstance = null;
  nativeAppInstance = null;
  nativeAnalyticsInstance = null;
}
