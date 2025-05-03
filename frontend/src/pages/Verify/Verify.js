import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components'; // Keep Button import
import OtpInput from '../../components/OtpInput/OtpInput'; // ** Import OtpInput **
import { useSnackbarStore } from '../../stores/snackbarStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { MdOutlineKeyboardArrowLeft as BackIcon } from 'react-icons/md';
import styles from '../../styles/Verify.module.css'; // Adjust path if needed

const Verify = () => {
    const [code, setCode] = useState(''); // State now holds the 4-digit string
    const [email, setEmail] = useState('');
    const verifyCode = useAuthStore(state => state.verifyCode);
    const loading = useAuthStore(state => state.loading);
    const error = useAuthStore(state => state.error);
    const resendVerification = useAuthStore(state => state.resendVerification);
    // const loadingResend = useAuthStore(state => state.loadingResend); // Assuming this exists
    const { showSnackbar } = useSnackbarStore();
    const navigate = useNavigate();
    const location = useLocation();

    // Get email from location state or redirect
    useEffect(() => {
      const emailInState = location.state?.email;
      if (emailInState) {
        setEmail(emailInState);
      } else {
        // Use setTimeout to avoid state update during render
        setTimeout(() => {
          showSnackbar('Email information missing. Please start registration again.', 'error');
          navigate('/register', { replace: true });
        }, 0);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    // Effect to show errors from the store
    useEffect(() => {
        if (error) {
            // Check if the error message is already displayed to prevent duplicates
            // This requires adding an 'id' or similar check to your snackbar store/logic
            // For now, we just show it.
            showSnackbar(error.message || 'An error occurred', 'error');
            // Optionally reset error in store after showing:
            // useAuthStore.setState({ error: null });
        }
    }, [error, showSnackbar]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (code.length !== 4) {
          showSnackbar('Please enter the complete 4-digit code.', 'warning');
          return;
      }
      try {
        // Pass email along with code if needed by backend/service
        await verifyCode(code, email);
        showSnackbar('Email verified successfully! You can now login.', 'success');
        // Pass verification status to login page
        navigate('/login', { replace: true, state: { verified: true } });
      } catch (err) {
        // Error should be set in the store, handled by the useEffect above
        console.error("Verification submit error:", err);
        // Optionally show snackbar here as fallback if store error handling fails
        // if (!error) showSnackbar(err.message || 'Verification failed during submit', 'error');
      }
    };

    const handleResendCode = async () => {
      if (!email) {
          showSnackbar('Cannot resend code, email address is missing.', 'error');
          return;
      }
      try {
        await resendVerification(email);
        showSnackbar('Verification code resent successfully!', 'success');
      } catch (err) {
        // Error should be set in the store, handled by the useEffect above
        console.error("Resend code error:", err);
         // Optionally show snackbar here as fallback
        // if (!error) showSnackbar(err.message || 'Failed to resend code during submit', 'error');
      }
    };

    // Handler for OtpInput change
    const handleOtpChange = (newOtp) => {
        setCode(newOtp); // Update the state with the complete OTP string
    };

  return (
    <div className={`${styles.verifyContainer} min-h-screen p-5 flex flex-col items-center justify-center relative`}>
      <div className={styles.backButton}>
         <Button
            variant="text"
            onClick={() => navigate('/register')} // Navigate back to register
            className="btn btn-ghost p-1 flex items-center" // Use DaisyUI/Tailwind for button styling if Button component supports it
          >
            <BackIcon className="h-6 w-6" />
            Back
          </Button>
      </div>

      <div className="w-full max-w-md"> {/* Tailwind for max width and centering */}
        <h1 className={`${styles.title} text-3xl font-bold mb-2 text-center`}>Verify</h1>
        <p className={`${styles.subtitle} text-center text-sm mb-1`}>
          Enter 4 digit code
        </p>
        <p className={`${styles.subtitle} text-center mb-8 text-sm`}>
          A four-digit code was sent to your email address ({email}).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4"> {/* Tailwind for spacing */}
          {/* Label for accessibility */}
          <label htmlFor="verify-code" className={styles.otpLabel}>Verification Code</label>
          {/* Use OtpInput component */}
          <div className={styles.otpInputContainer}> {/* Optional wrapper */}
            <OtpInput
                length={4}
                value={code} // Pass current code state
                onChange={handleOtpChange} // Pass the handler
                disabled={loading} // Disable inputs when loading
            />
          </div>
          {/* Removed the old Input component */}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6"> {/* Tailwind for layout */}
            <Button
              type="submit"
              disabled={loading || code.length !== 4}
              // Use DaisyUI/Tailwind classes if Button component supports it
              className="btn btn-primary w-full sm:flex-1"
            >
              {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Confirm'}
            </Button>

            <Button
              type="button"
              variant="outlined" // Keep if Button component uses it
              onClick={() => navigate('/login')}
               // Use DaisyUI/Tailwind classes if Button component supports it
              className="btn btn-outline w-full sm:flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>

        {/* Resend Code Button */}
        <div className="text-center mt-6"> {/* Tailwind for centering */}
            <Button
                variant="text" // Keep if Button component uses it
                onClick={handleResendCode}
                // Use CSS module + Tailwind text size
                className={`${styles.resendLink} text-sm`}
                disabled={loading}
            >
                {/* DaisyUI loading spinner */}
                {/* {loadingResend ? <span className="loading loading-spinner loading-xs mr-1"></span> : null} */}
                Resend Code
            </Button>
        </div>

      </div>
    </div>
  );
};

export default Verify;
