import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Button, Input } from '../../components';
// import { FaGoogle as GoogleIcon, FaFacebook as FacebookIcon } from 'react-icons/fa';
import { MdOutlineKeyboardArrowLeft as BackIcon } from 'react-icons/md';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSnackbarStore } from '../../stores/snackbarStore';
import styles from '../../styles/Login.module.css';
import GoogleIcon from '../../assets/icons/google.png'
import FacebookIcon from '../../assets/icons/facebook.png'
import { FiLoader } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // --- MODIFIED: Get new actions from store ---
  const { login, loginWithGoogle, loginWithFacebook, loading, error } = useAuthStore();
  const { showSnackbar } = useSnackbarStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Show success message after email verification redirect
  useEffect(() => {
    if (location.state?.verified) {
      showSnackbar('Email verified successfully! You can now login.', 'success');
      navigate('.', { replace: true, state: {} }); // Clear state
    }
  }, [location, navigate, showSnackbar]);

  // Show login errors
  useEffect(() => {
      if (error) {
          // Display error only if it's relevant to login actions (optional check)
          // Check error message content if needed
          showSnackbar(error || 'Login failed', 'error');
           // Optionally clear error state in store after showing
           // useAuthStore.setState({ error: null });
      }
  }, [error, showSnackbar]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      showSnackbar('Login successful!', 'success');
      navigate('/home'); // Navigate to home on success
    } catch (err) {
      // Error is handled by the useEffect hook above
      console.error("Email login failed:", err);
    }
  };

  // --- NEW: Social Login Handlers ---
  const handleGoogleLogin = async () => {
      try {
          await loginWithGoogle();
          showSnackbar('Google Sign-In successful!', 'success');
          navigate('/home'); // Navigate to home on success
      } catch (err) {
          // Error is handled by the useEffect hook above
           console.error("Google login failed:", err);
      }
  };

  const handleFacebookLogin = async () => {
       try {
          await loginWithFacebook();
          showSnackbar('Facebook Sign-In successful!', 'success');
          navigate('/home'); // Navigate to home on success
      } catch (err) {
           // Error is handled by the useEffect hook above
           console.error("Facebook login failed:", err);
      }
  };

return (
  <div className={`${styles.loginContainer} min-h-screen p-5 flex flex-col items-center justify-center relative`}>
    <div className={styles.backButton}>
       <Button
          variant="text"
          onClick={() => navigate('/')} // Go to Welcome page
          className="btn btn-ghost p-1 flex items-center"
        >
          <BackIcon className="h-6 w-6" /> Back
        </Button>
    </div>

    <div className="w-full max-w-md">
      <h1 className={`${styles.title} text-3xl font-bold mb-2 text-center`}>Login</h1>
      <p className={`${styles.subtitle} text-center mb-8`}>Please log in into your account</p>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <Input
          label="Email" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email" id="login-email"
          className={styles.inputField} disabled={loading}
        />
        <Input
          label="Password" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password" id="login-password"
          className={styles.inputField} disabled={loading}
        />
        <div className="text-right">
           <Button
              variant="text" onClick={() => navigate('/forgot-password')}
              className={`${styles.forgotPasswordLink} text-sm`} disabled={loading}
            > Forgot password? </Button>
        </div>
        <Button type="submit" disabled={loading} className="btn btn-primary w-full mt-6">
          {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Sign in'}
        </Button>
      </form>

      <div className="divider my-6 text-sm">OR</div>

      {/* --- MODIFIED: Social Login Buttons --- */}
      <div className="space-y-3">
        <Button
          variant="outlined" onClick={handleGoogleLogin} disabled={loading}
          className={`btn btn-outline w-full flex items-center justify-center gap-2 ${styles.googleButton}`}
        >
          {loading ? <FiLoader className="animate-spin"/> : <img src={GoogleIcon} alt="Google" />}
          Sign in with Google
        </Button>
        <Button
          variant="outlined" onClick={handleFacebookLogin} disabled={loading}
          className={`btn btn-outline w-full flex items-center justify-center gap-2 ${styles.facebookButton}`}
        >
           {loading ? <FiLoader className="animate-spin"/> : <img src={FacebookIcon} alt="facebook" />}
          Sign in with Facebook
        </Button>
      </div>
    </div>
  </div>
);
};

export default Login;
