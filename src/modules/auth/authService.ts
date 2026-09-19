import { UserProfileDocument, UserRole } from '../../types/auth';

export interface AuthError {
  code: string;
  message: string;
}

export function mapFirebaseAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'O formato do e-mail inserido é inválido.';
    case 'auth/user-disabled':
      return 'Esta conta de usuário foi temporariamente desativada.';
    case 'auth/user-not-found':
      return 'Nenhum usuário cadastrado com este e-mail.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.';
    case 'auth/email-already-in-use':
      return 'Este endereço de e-mail já está em uso por outra conta.';
    case 'auth/weak-password':
      return 'A senha deve conter no mínimo 6 caracteres.';
    case 'auth/popup-closed-by-user':
      return 'O login com o Google foi cancelado antes da conclusão.';
    case 'auth/network-request-failed':
      return 'Falha de conexão. Verifique sua internet e tente novamente.';
    default:
      return 'Ocorreu um erro inesperado durante a autenticação. Tente novamente.';
  }
}

/**
 * Criação idempotente do perfil sob /users/{uid}.
 * A role NUNCA é aceita do cliente: é forçada internamente como 'user'.
 */
export function buildInitialUserProfile(
  uid: string,
  email: string,
  displayName: string,
  photoURL?: string
): UserProfileDocument {
  if (!uid || !email) {
    throw new Error('UID e E-mail são mandatórios para provisionar o perfil.');
  }

  const name = displayName.trim() || 'Viajante SmartTrip';
  return {
    uid,
    email: email.toLowerCase().trim(),
    displayName: name,
    photoURL: photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0d9488,14b8a6,059669`,
    role: 'user', // Forçado estritamente pelo sistema (Anti-Autoelevação)
    preferences: {
      travelStyle: 'cultura',
      budgetLevel: 'moderado',
      pace: 'tranquilo',
      dietaryRestrictions: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
