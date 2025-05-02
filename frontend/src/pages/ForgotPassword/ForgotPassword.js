import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Button, Input } from '../../components'; 
import { useNavigate } from 'react-router-dom';
import { useSnackbarStore } from '../../stores/snackbarStore'; 
import { MdOutlineKeyboardArrowLeft as BackIcon } from 'react-icons/md'; 
import styles from '../../styles/ForgotPassword.module.css'; 

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const { forgotPassword, loading, error } = useAuthStore();
  const { showSnackbar } = useSnackbarStore(); 
  const navigate = useNavigate();

  // useEffect(() => {
  //   if (error) {
  //       showSnackbar(error.message || 'Failed to send reset email', 'error');
  //   }
  // }, [error, showSnackbar]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        await forgotPassword(email);
        showSnackbar('Password reset email sent successfully!', 'success');
        navigate('/login');
    } catch (err) {
        console.error("Forgot password submit error:", err);
         if (!error) { 
            showSnackbar(err.message || 'Failed to send reset email during submit', 'error');
        }
    }
  };

  return (
    <div className={`${styles.forgotPasswordContainer} min-h-screen p-5 flex flex-col items-center justify-center relative`}>

      <div className={styles.backButton}>
         <Button
            variant="text" 
            onClick={() => navigate('/login')}
            className="btn btn-ghost p-1 flex items-center" 
          >
            <BackIcon className="h-6 w-6" />
            Back
          </Button>
      </div>

      <div className="w-full max-w-md">
        <h1 className={`${styles.title} text-3xl font-bold mb-2 text-center`}>Forgot password</h1>
        <p className={`${styles.subtitle} text-center mb-8 text-sm`}>
          Enter your email for the verification process, we will send code to your email
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email" 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            id="forgot-email"
            className={styles.inputField}
          />

          <Button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full mt-6"
          >
            {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
