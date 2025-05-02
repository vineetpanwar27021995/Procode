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

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading, error } = useAuthStore();
    const { showSnackbar } = useSnackbarStore();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
      if (location.state?.verified) {
        showSnackbar('Email verified successfully! You can now login.', 'success');
        navigate('.', { replace: true, state: {} });
      }
    }, [location, navigate, showSnackbar]);

    useEffect(() => {
        if (error) {
            showSnackbar(error.message || 'Login failed', 'error');
        }
    }, [error, showSnackbar]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await login(email, password);
        showSnackbar('Login successful!', 'success');
        navigate('/home');
      } catch (err) {
        console.error("Login submit error:", err);
        if (!error) {
            showSnackbar(err.message || 'Login failed during submit', 'error');
        }
      }
    };

    const handleGoogleLogin = () => {
        showSnackbar('Google login not implemented yet.', 'info');
    };

    const handleFacebookLogin = () => {
        showSnackbar('Facebook login not implemented yet.', 'info');
    };

  return (
    <div className={`${styles.loginContainer} min-h-screen p-5 flex flex-col items-center justify-center relative`}>

      <div className={styles.backButton}>
         <Button
            variant="text"
            onClick={() => navigate('/')}
            className="btn btn-ghost p-1 flex items-center"
          >
            <BackIcon className="h-6 w-6" />
            Back
          </Button>
      </div>

      <div className="w-full max-w-md">
        <h1 className={`${styles.title} text-3xl font-bold mb-2 text-center`}>Login</h1>
        <p className={`${styles.subtitle} text-center mb-8`}>Please log in into your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            id="login-email"
            className={styles.inputField}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            id="login-password"
            className={styles.inputField}
          />

          <div className="text-right">
             <Button
                variant="text"
                onClick={() => navigate('/forgot-password')}
                className={`${styles.forgotPasswordLink} text-sm`}
              >
                Forgot password?
              </Button>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full mt-6"
          >
            {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Sign in'}
          </Button>
        </form>


        <div className="space-y-3 mt-3">
          <Button
            variant="outlined"
            onClick={handleGoogleLogin}
            className={`btn btn-outline w-full flex items-center justify-center gap-2 ${styles.googleButton}`}
          >
            <img src={GoogleIcon} alt='google'/>
            Sign in with Google
          </Button>

          <Button
            variant="outlined"
            onClick={handleFacebookLogin}
            className={`btn btn-outline w-full flex items-center justify-center gap-2 ${styles.facebookButton}`}
          >            
          <img src={FacebookIcon} alt='facebook'/>
            Sign in with Facebook
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
