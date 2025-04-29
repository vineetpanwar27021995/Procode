import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Button, Input } from '../../components';
import { useNavigate } from 'react-router-dom';
import { useSnackbarStore } from '../../stores/snackbarStore';
import styles from '../../styles/Register.module.css'; 
import { MdOutlineKeyboardArrowLeft } from 'react-icons/md'; 

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const { register, loading, error } = useAuthStore();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbarStore();

  // useEffect(() => {
  //   if (error) {
  //     console.log(error)
  //     showSnackbar(error.message || 'Registration failed', 'error');
  //   }
  // }, [error, showSnackbar]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agree) {
      showSnackbar('Please agree to the terms and conditions', 'error');
      return;
    }

    try {
      await register(name, email, password);
      showSnackbar('Registration successful! Verification email sent.', 'success');
      navigate('/verify', { state: { email } });
    } catch (err) {
       console.error("Registration submit error:", err);
       if (!error) {
           showSnackbar(err.message || 'Registration failed during submit', 'error');
       }
    }
  };

  return (
    <div className={`${styles.registerContainer} min-h-screen p-5 flex flex-col items-center`}>

      <div className={`${styles.backButton}`}>
         <Button
            variant="text" 
            onClick={() => navigate('/')}
            className="btn btn-ghost text-sm p-2 flex items-center self-start"
          >
            <MdOutlineKeyboardArrowLeft className="mr-1 h-4 w-4" /> 
            Back
          </Button>
      </div>


      <div className="w-full max-w-md">
        <h1 className={`${styles.title} text-3xl font-bold mb-2 text-center`}>Sign Up</h1>
        <p className={`${styles.subtitle} text-center mb-8`}>Please create a new account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            id="register-name"
            className={styles.inputField} 
          />

          <Input
            label="Email"
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            id="register-email"
            className={styles.inputField}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            id="register-password"
            className={styles.inputField}
          />

          <div className="flex items-center mt-4"> 
            <input
              type="checkbox"
              id="agree-checkbox"
              className="checkbox checkbox-primary mr-2"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <label htmlFor="agree-checkbox" className={`${styles.checkboxLabel} text-sm cursor-pointer`}>
              Agree the terms of use and privacy policy
            </label>
          </div>

          <Button
            type="submit"
            disabled={loading || !agree}
            className="btn btn-primary w-full mt-6"
          >
            {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Sign up'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Register;
