// WebAuthn / MacBook Touch ID Biometric Authentication Service

export interface BiometricAuthResult {
  success: boolean;
  cancelled?: boolean;
  error?: string;
  isPlatformSupported?: boolean;
}

/**
 * Checks whether the current device supports platform biometrics (e.g. MacBook Touch ID / Windows Hello)
 */
export async function isTouchIDSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;

  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch (e) {
    console.warn('Error checking platform authenticator:', e);
  }

  return false;
}

/**
 * Prompts native MacBook Touch ID / Fingerprint verification via WebAuthn
 */
export async function authenticateWithMacTouchID(
  reason = 'Verify your MacBook fingerprint (Touch ID) to stop the Friday class timer'
): Promise<BiometricAuthResult> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return {
      success: false,
      error: 'Web Authentication (Touch ID) is not supported in this browser.',
      isPlatformSupported: false,
    };
  }

  try {
    const isAvailable = await isTouchIDSupported();

    // Generate random 32-byte challenge for WebAuthn
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    // Call platform authenticator (Touch ID)
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Pope Saweros Online Scoring System',
          id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
        },
        user: {
          id: new Uint8Array([19, 84, 111, 117, 99, 104, 73, 68]),
          name: 'servant@pope-saweros.church',
          displayName: reason || 'Church Servant',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Triggers macOS Touch ID
          userVerification: 'required', // Enforces biometric fingerprint
          requireResidentKey: false,
        },
        timeout: 60000,
      },
    });

    if (credential) {
      return { success: true, isPlatformSupported: isAvailable };
    }

    return {
      success: false,
      error: 'Biometric verification did not complete.',
      isPlatformSupported: isAvailable,
    };
  } catch (err: unknown) {
    console.warn('Touch ID authentication error:', err);

    if (err instanceof Error) {
      if (err.name === 'NotAllowedError') {
        return {
          success: false,
          cancelled: true,
          error: 'Touch ID was cancelled or fingerprint was not recognized.',
        };
      }

      // SecurityError / InvalidStateError or non-secure origin fallback
      return {
        success: false,
        error: err.message || 'Fingerprint verification failed.',
      };
    }

    return {
      success: false,
      error: 'Failed to verify MacBook fingerprint.',
    };
  }
}
