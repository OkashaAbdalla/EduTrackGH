/**
 * Shared Google sign-in success/error handling with role redirect.
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext, useToast } from '../context';
import { getRoleRedirectPath } from '../utils/loginHelpers';

export function useGoogleLoginHandler() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuthContext();
  const { showToast } = useToast();

  const handleGoogleCredential = useCallback(
    async (credential) => {
      const result = await loginWithGoogle(credential);

      if (result.success) {
        showToast('Signed in with Google. Redirecting…', 'success');
        navigate(getRoleRedirectPath(result.user.role), { replace: true });
        return;
      }

      if (result.code === 'ACCOUNT_NOT_FOUND') {
        showToast(
          result.message ||
            'No account found for this Google email. Create a parent account first, or ask your school to add you as staff.',
          'warning'
        );
        return;
      }

      if (result.code === 'MAINTENANCE') {
        showToast(result.message || 'The system is under maintenance.', 'warning');
        return;
      }

      if (result.code === 'GOOGLE_NOT_CONFIGURED') {
        showToast('Google sign-in is not configured yet.', 'error');
        return;
      }

      showToast(result.message || 'Google sign-in failed', 'error');
    },
    [loginWithGoogle, navigate, showToast]
  );

  const handleGoogleError = useCallback(
    (message) => {
      if (message && !message.toLowerCase().includes('cancelled')) {
        showToast(message, 'error');
      }
    },
    [showToast]
  );

  return { handleGoogleCredential, handleGoogleError };
}
