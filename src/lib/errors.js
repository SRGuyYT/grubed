/** Predefined error codes and metadata */
export const ERROR_DEFINITIONS = {
  'VID-001': {
    title: 'Video playback failed',
    message:
      'The embedded provider did not advance playback reliably. Reload the player or try the external provider view.',
    tone: 'error',
    help:
      'If the player freezes after a few seconds, the host may be blocking playback or expecting a popup flow.',
  },
  'VID-002': {
    title: 'Popup-dependent host flow blocked',
    message:
      'This host appears to rely on a blocked popup or redirect. Grubed keeps those blocked for safety.',
    tone: 'warning',
    help:
      'If playback stalls, keep popup blocking on if possible and switch providers. As a last resort, temporarily allow popups for the provider.',
  },
  'AUTH-001': {
    title: 'Authentication failed',
    message: 'The account action could not be completed.',
    tone: 'error',
    help: 'Check the email, password, and network connection, then try again.',
  },
  'AUTH-002': {
    title: 'Auth configuration missing',
    message:
      'Firebase Authentication is not fully configured for this app or current domain.',
    tone: 'error',
    help:
      'Enable Email/Password sign-in in Firebase Auth and confirm the current domain is authorized.',
  },
  'NET-001': {
    title: 'Network request failed',
    message: 'A required request could not be completed.',
    tone: 'error',
    help: 'Check connectivity and try again.',
  },
  'CFG-001': {
    title: 'Firebase config incomplete',
    message: 'One or more Firebase client settings are missing.',
    tone: 'error',
    help: 'Verify API key, auth domain, project ID, and app ID values.',
  },
};

/** Generate a unique error ID */
function buildId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Creates a structured app error
 * @param {string} code - Error code
 * @param {object} overrides - Optional overrides (e.g., details)
 * @returns {object} Structured error object
 */
export function createAppError(code, overrides = {}) {
  const definition = ERROR_DEFINITIONS[code] ?? ERROR_DEFINITIONS['NET-001'];

  return {
    id: buildId(),
    code,
    ...definition,
    ...overrides,
  };
}

/**
 * Maps Firebase Auth errors to structured app errors
 * @param {Error} error - Original error from Firebase Auth
 * @returns {object} App error object
 */
export function mapAuthError(error) {
  const code = error?.code ?? '';

  if (code === 'auth/configuration-not-found' || code === 'auth/operation-not-allowed') {
    return createAppError('AUTH-002', {
      details: error instanceof Error ? error.message : 'Authentication configuration missing.',
    });
  }

  return createAppError('AUTH-001', {
    details: error instanceof Error ? error.message : 'Authentication failed.',
  });
}

/**
 * Maps network-related errors to structured app errors
 * @param {Error} error - Original error
 * @param {object} overrides - Optional overrides
 * @returns {object} App error object
 */
export function mapNetworkError(error, overrides = {}) {
  return createAppError('NET-001', {
    details: error instanceof Error ? error.message : 'Network request failed.',
    ...overrides,
  });
}
