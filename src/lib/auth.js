import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase';

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function mapUser(user) {
  if (!user) {
    return null;
  }

  return {
    userId: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'Grubed Member',
    email: user.email || '',
  };
}

function formatAuthError(error) {
  const code = error?.code ?? '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email is already attached to a Grubed account.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/missing-password':
      return 'Enter your password.';
    case 'auth/weak-password':
      return 'Use a password with at least 6 characters.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts right now. Wait a minute and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/password auth is not enabled in this Firebase project yet.';
    default:
      return error instanceof Error ? error.message : 'Authentication failed.';
  }
}

function createAuthFailure(error) {
  const failure = new Error(formatAuthError(error));
  failure.code = error?.code ?? 'auth/unknown';
  return failure;
}

function validateCredentials({ email, password }) {
  if (!normalizeEmail(email)) {
    throw new Error('Enter an email address.');
  }

  if (!password?.trim()) {
    throw new Error('Enter a password.');
  }
}

export function loadSession() {
  return mapUser(auth.currentUser);
}

export function observeSession(callback) {
  return onAuthStateChanged(auth, (user) => {
    callback(mapUser(user));
  });
}

export async function registerAccount({ displayName, email, password }) {
  validateCredentials({ email, password });

  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      normalizeEmail(email),
      password,
    );
    const nextDisplayName =
      displayName.trim() || normalizeEmail(email).split('@')[0];

    if (nextDisplayName) {
      await updateProfile(credential.user, {
        displayName: nextDisplayName,
      });
    }

    return mapUser({
      ...credential.user,
      displayName: nextDisplayName,
    });
  } catch (error) {
    throw createAuthFailure(error);
  }
}

export async function loginAccount({ email, password }) {
  validateCredentials({ email, password });

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      normalizeEmail(email),
      password,
    );
    return mapUser(credential.user);
  } catch (error) {
    throw createAuthFailure(error);
  }
}

export async function logoutAccount() {
  await signOut(auth);
  return null;
}
