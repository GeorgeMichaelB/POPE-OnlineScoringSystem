// WebAuthn / Universal Biometric & Screen Lock Authentication Service
// Supports: iPhone Face ID/Touch ID/Phone Passcode, Android Fingerprint/Face/Screen Lock PIN/Pattern, MacBook Touch ID/Password, Windows Hello

export interface BiometricAuthResult {
  success: boolean;
  cancelled?: boolean;
  error?: string;
  isPlatformSupported?: boolean;
}

/**
 * Checks whether the current device supports platform biometrics or screen lock verification
 */
export async function isBiometricsOrScreenLockSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;

  try {
    if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch (e) {
    console.warn('Error checking platform authenticator:', e);
  }

  return false;
}

export const isTouchIDSupported = isBiometricsOrScreenLockSupported;

/**
 * Returns user-friendly name of the biometric / screen lock hardware for current device
 */
export function getDeviceBiometricLabel(customUA?: string): string {
  if (typeof window === 'undefined' && !customUA) return 'Biometrics or Screen Lock (بصمة أو قفل الشاشة)';
  const ua = (customUA || (typeof navigator !== 'undefined' ? navigator.userAgent : '')).toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) {
    return 'iPhone Face ID / Touch ID / Phone Passcode';
  }
  if (/android/.test(ua)) {
    return 'Phone Fingerprint / Face / Screen Lock PIN';
  }
  if (/macintosh|mac os x/.test(ua)) {
    return 'MacBook Touch ID / Mac Password';
  }
  if (/windows/.test(ua)) {
    return 'Windows Hello / PIN / Biometrics';
  }
  return 'Device Biometrics or Screen Lock';
}

/**
 * Prompts native Phone / Laptop Biometrics (Face ID, Fingerprint, Touch ID) or Device Screen Lock (Passcode / PIN)
 */
export async function authenticateWithBiometricsOrScreenLock(
  reason = 'Verify device biometrics (Fingerprint / Face ID) or screen lock to stop Friday class timer'
): Promise<BiometricAuthResult> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return {
      success: false,
      error: 'Platform biometrics / WebAuthn is not supported in this browser.',
      isPlatformSupported: false,
    };
  }

  try {
    const isAvailable = await isBiometricsOrScreenLockSupported();

    // Generate random 32-byte challenge for WebAuthn
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    // Call platform authenticator (Face ID / Fingerprint / Screen Lock PIN / Touch ID)
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
          displayName: reason || 'Church Servant Verification',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Triggers device platform authenticator (phone biometrics / screen lock / touch id)
          userVerification: 'required', // Enforces biometric or device screen lock
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
      error: 'Biometric or screen lock verification did not complete.',
      isPlatformSupported: isAvailable,
    };
  } catch (err: unknown) {
    console.warn('Biometric/Screenlock authentication error:', err);

    if (err instanceof Error) {
      if (err.name === 'NotAllowedError') {
        return {
          success: false,
          cancelled: true,
          error: 'Verification was cancelled or biometric / screen lock was not recognized.',
        };
      }

      return {
        success: false,
        error: err.message || 'Biometric or screen lock verification failed.',
      };
    }

    return {
      success: false,
      error: 'Failed to verify device biometrics or screen lock.',
    };
  }
}

// Backward-compatibility alias
export const authenticateWithMacTouchID = authenticateWithBiometricsOrScreenLock;
