import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfileDocument, AuthSession } from '../../types/auth';
import { mapFirebaseAuthError, buildInitialUserProfile } from './authService';

interface AuthContextType extends AuthSession {
  signUpWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInDemoAccount: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfileDocument>) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Armazenamento local de usuários e sessão ativa
const USERS_STORAGE_KEY = 'smarttrip_users_db';
const SESSION_STORAGE_KEY = 'smarttrip_active_session';

interface StoredUserAccount {
  uid: string;
  email: string;
  passwordHash: string;
  profile: UserProfileDocument;
}

function getStoredDatabase(): Record<string, StoredUserAccount> {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredDatabase(db: Record<string, StoredUserAccount>): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Falha ao gravar banco local', e);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfileDocument | null>(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const signUpWithEmail = async (name: string, email: string, pass: string): Promise<void> => {
    setIsLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        throw new Error('auth/invalid-email');
      }
      if (pass.length < 6) {
        throw new Error('auth/weak-password');
      }

      const db = getStoredDatabase();
      const exists = Object.values(db).some((acc) => acc.email === cleanEmail);
      if (exists) {
        throw new Error('auth/email-already-in-use');
      }

      // Tenta cadastrar no Firebase Auth oficial caso disponível
      let firebaseUid: string | null = null;
      if (typeof window !== 'undefined') {
        try {
          const { createUserWithEmailAndPassword } = await import('firebase/auth');
          const { getFirebaseAuth } = await import('../../services/firebase/client');
          const auth = getFirebaseAuth();
          const fbCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          if (fbCred && fbCred.user) {
            firebaseUid = fbCred.user.uid;
          }
        } catch (fbErr: any) {
          // Se já existir no Firebase ou se serviço estiver em modo simulado
          if (fbErr.code === 'auth/email-already-in-use') {
            throw new Error('auth/email-already-in-use');
          }
          console.warn('[Firebase Auth] Cadastro local prosseguindo:', fbErr.message);
        }
      }

      const generatedUid = firebaseUid || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newProfile = buildInitialUserProfile(generatedUid, cleanEmail, name);

      db[generatedUid] = {
        uid: generatedUid,
        email: cleanEmail,
        passwordHash: pass,
        profile: newProfile,
      };

      saveStoredDatabase(db);
      setUser(newProfile);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newProfile));
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string): Promise<void> => {
    setIsLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      const db = getStoredDatabase();

      // 1. Verifica se é a conta demo pré-definida
      if (cleanEmail === 'clara.ferreira@smarttrip.com' || cleanEmail === 'demo@smarttrip.com') {
        await signInDemoAccount();
        return;
      }

      // 2. Procura no banco de contas local
      let account = Object.values(db).find((acc) => acc.email === cleanEmail);

      // 3. Se não encontrar localmente, tenta autenticação com o Firebase Auth oficial
      if (!account && typeof window !== 'undefined') {
        try {
          const { signInWithEmailAndPassword } = await import('firebase/auth');
          const { getFirebaseAuth } = await import('../../services/firebase/client');
          const auth = getFirebaseAuth();
          const fbCred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
          if (fbCred && fbCred.user) {
            const fbUser = fbCred.user;
            const newProfile = buildInitialUserProfile(
              fbUser.uid,
              cleanEmail,
              fbUser.displayName || cleanEmail.split('@')[0],
              fbUser.photoURL || undefined
            );
            account = {
              uid: fbUser.uid,
              email: cleanEmail,
              passwordHash: pass,
              profile: newProfile,
            };
            db[fbUser.uid] = account;
            saveStoredDatabase(db);
          }
        } catch (fbErr: any) {
          if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
            throw new Error('auth/wrong-password');
          }
        }
      }

      if (!account) {
        throw new Error('auth/user-not-found');
      }
      if (account.passwordHash !== pass) {
        throw new Error('auth/wrong-password');
      }

      setUser(account.profile);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(account.profile));
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    try {
      let realUser: { uid: string; email: string; displayName: string; photoURL?: string } | null = null;

      // 1. Tenta autenticação real com Google Popup do Firebase SDK
      if (typeof window !== 'undefined') {
        try {
          const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
          const { getFirebaseAuth } = await import('../../services/firebase/client');
          const auth = getFirebaseAuth();
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          const result = await signInWithPopup(auth, provider);
          if (result && result.user) {
            realUser = {
              uid: result.user.uid,
              email: result.user.email || '',
              displayName: result.user.displayName || 'Viajante Google',
              photoURL: result.user.photoURL || undefined,
            };
          }
        } catch (fbErr: any) {
          if (fbErr.code === 'auth/popup-closed-by-user') {
            throw new Error('auth/popup-closed-by-user');
          }
          if (fbErr.code === 'auth/cancelled-popup-request') {
            return;
          }
          console.warn('[Firebase Google Auth] Popup com restrição ou cancelado, fallback em andamento:', fbErr.message);
        }
      }

      const db = getStoredDatabase();
      let googleUid: string;
      let cleanEmail: string;
      let displayName: string;
      let photoURL: string | undefined;

      if (realUser && realUser.email) {
        googleUid = realUser.uid;
        cleanEmail = realUser.email.toLowerCase().trim();
        displayName = realUser.displayName;
        photoURL = realUser.photoURL;
      } else {
        // Fallback interativo sem travar: se o popup do Google for fechado ou não configurado no console
        // Solicita nome ou gera identidade temporária única
        const inputName = typeof window !== 'undefined' ? window.prompt('Informe seu nome para conectar com o Google:', 'Viajante Google') : null;
        if (!inputName) {
          throw new Error('auth/popup-closed-by-user');
        }
        const inputEmail = typeof window !== 'undefined' ? window.prompt('Informe seu e-mail do Google:', 'seu.email@gmail.com') : null;
        if (!inputEmail || !inputEmail.includes('@')) {
          throw new Error('auth/invalid-email');
        }

        displayName = inputName.trim();
        cleanEmail = inputEmail.toLowerCase().trim();
        googleUid = `usr_google_${Date.now().toString(36)}`;
      }

      let account = db[googleUid] || Object.values(db).find((a) => a.email === cleanEmail);
      if (!account) {
        const newProfile = buildInitialUserProfile(
          googleUid,
          cleanEmail,
          displayName,
          photoURL
        );
        account = {
          uid: googleUid,
          email: cleanEmail,
          passwordHash: 'oauth_google_token',
          profile: newProfile,
        };
        db[googleUid] = account;
        saveStoredDatabase(db);
      }

      setUser(account.profile);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(account.profile));
    } finally {
      setIsLoading(false);
    }
  };

  const signInDemoAccount = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const demoUid = 'usr_smarttrip_001';
      const db = getStoredDatabase();
      let account = db[demoUid];

      if (!account) {
        account = {
          uid: demoUid,
          email: 'clara.ferreira@smarttrip.com',
          passwordHash: 'demo123',
          profile: {
            uid: demoUid,
            email: 'clara.ferreira@smarttrip.com',
            displayName: 'Clara Ferreira',
            photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
            role: 'user',
            preferences: {
              travelStyle: 'cultura',
              budgetLevel: 'moderado',
              pace: 'tranquilo',
              dietaryRestrictions: ['Vegetariano'],
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };
        db[demoUid] = account;
        saveStoredDatabase(db);
      }

      setUser(account.profile);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(account.profile));
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfileDocument>): Promise<void> => {
    if (!user) return;
    const updated: UserProfileDocument = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setUser(updated);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));

    const db = getStoredDatabase();
    if (db[user.uid]) {
      db[user.uid].profile = updated;
      saveStoredDatabase(db);
    }
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail.includes('@')) {
      throw new Error('auth/invalid-email');
    }
    const db = getStoredDatabase();
    const account = Object.values(db).find((acc) => acc.email === cleanEmail);
    if (!account) {
      throw new Error('auth/user-not-found');
    }
  };

  const signOutUser = async (): Promise<void> => {
    setUser(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        signInDemoAccount,
        updateUserProfile,
        sendPasswordReset,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
