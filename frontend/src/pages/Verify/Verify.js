import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
// Removed useThemeStore and theme object imports
import { Button, Input } from '../../components'; // Assuming these accept className
import { useSnackbarStore } from '../../stores/snackbarStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { MdOutlineKeyboardArrowLeft as BackIcon } from 'react-icons/md'; // Import back icon
import styles from '../../styles/Verify.module.css'; // Import CSS Module
 
const Verify = () => {
    const [code, setCode] = useState('');
    const [email, setEmail] = useState(''); // Store email for resend
    const verifyCode = useAuthStore(state => state.verifyCode);
const loading = useAuthStore(state => state.loading);
const error = useAuthStore(state => state.error);
const resendVerification = useAuthStore(state => state.resendVerification);
const loadingResend = useAuthStore(state => state.loadingResend);
    const { showSnackbar } = useSnackbarStore();
    const navigate = useNavigate();
    const location = useLocation();

    // Get email from location state or redirect
    useEffect(() => {
      const emailInState = location.state?.email;
    
      if (emailInState) {
        setEmail(emailInState);
      } else {
        // Wrap inside setTimeout to avoid triggering rerenders inside effect directly
        setTimeout(() => {
          showSnackbar('Email information missing. Please start registration again.', 'error');
          navigate('/register', { replace: true });
        }, 0);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Effect to show errors from the store
    useEffect(() => {
        if (error) {
            showSnackbar(error.message || 'An error occurred', 'error');
            // Optionally reset error in store: useAuthStore.setState({ error: null });
        }
    }, [error, showSnackbar]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (code.length !== 4) { // Basic validation
          showSnackbar('Please enter the 4-digit code.', 'warning');
          return;
      }
      try {
        await verifyCode(code, email); // Assuming verifyCode only needs the code
        showSnackbar('Email verified successfully! You can now login.', 'success');
        // Pass verification status to login page
        navigate('/login', { replace: true, state: { verified: true } });
      } catch (err) {
        // Error display is likely handled by the useEffect above
        console.error("Verification submit error:", err);
        if (!error) { // Show only if not already handled by error state effect
           showSnackbar(err.message || 'Verification failed during submit', 'error');
        }
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
        // Error display is likely handled by the useEffect above
        console.error("Resend code error:", err);
         if (!error) { // Show only if not already handled by error state effect
            showSnackbar(err.message || 'Failed to resend code during submit', 'error');
        }
      }
    };

  return (
    // Main container using CSS module for theme and Tailwind for layout
    <div className={`${styles.verifyContainer} min-h-screen p-5 flex flex-col items-center justify-center relative`}>

      {/* Back Button - Positioned absolutely via CSS module */}
      <div className={styles.backButton}>
         <Button
            variant="text"
            onClick={() => navigate('/register')}
            className="btn btn-ghost p-1 flex items-center" // Minimal styling
          >
            <BackIcon className="h-6 w-6" />
            Back
          </Button>
      </div>

      {/* Form Container */}
      <div className="w-full max-w-md">
        {/* Heading using CSS module class */}
        <h1 className={`${styles.title} text-3xl font-bold mb-2 text-center`}>Verify</h1>
        {/* Subtitles using CSS module class and Tailwind text size */}
        <p className={`${styles.subtitle} text-center text-sm mb-1`}>
          Enter 4 digit code
        </p>
        <p className={`${styles.subtitle} text-center mb-8 text-sm`}>
          A four-digit code should have come to your email address ({email}).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Custom Input component */}
          <Input
            label="Verification Code" // Add label
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} // Allow only 4 digits
            placeholder="----" // Placeholder for 4 digits
            maxLength={4}
            id="verify-code"
            inputMode="numeric" // Hint for numeric keyboard on mobile
            className={styles.inputField} // Apply module styles
            // Optional: Add text-center class if Input component accepts it
            // className={`${styles.inputField} text-center tracking-[1em]`} // Example for centered, spaced digits
          />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              type="submit"
              disabled={loading || code.length !== 4}
              className="btn btn-primary w-full sm:flex-1" // Primary action
            >
              {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Confirm'}
            </Button>

            <Button
              type="button" // Important: prevent form submission
              variant="outlined" // Keep variant if used
              onClick={() => navigate('/login')} // Navigate to login on cancel
              className="btn btn-outline w-full sm:flex-1" // Secondary action
              disabled={loading} // Disable if primary is loading
            >
              Cancel
            </Button>
          </div>
        </form>

        {/* Resend Code Button */}
        <div className="text-center mt-6">
            <Button
                variant="text"
                onClick={handleResendCode}
                className={`${styles.resendLink} text-sm`} // Apply module style
                disabled={loadingResend || loading} // Disable if either action is loading
            >
                {loadingResend ? <span className="loading loading-spinner loading-xs mr-1"></span> : null}
                Resend Code
            </Button>
        </div>

      </div>
    </div>
  );
};

export default Verify;