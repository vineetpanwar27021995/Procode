import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogIn, FiUserPlus } from 'react-icons/fi'; 
import styles from '../../styles/Welcome.module.css';
import Logo from '../../assets/icons/logo.png'

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${styles.welcomeContainer}`}>


      <h1 className={styles.welcomeTitle}>Welcome</h1>

      <p className={styles.welcomeSubtitle}>Let's get started</p>

      <img src={Logo}/>
      <p className={styles.getStarted}>Existing  customer / Get started </p>
      <button
        onClick={() => navigate('/login')}
        className={styles.signInButton}
      >
        Sign in
      </button>

      <button
        onClick={() => navigate('/register')}
        className={styles.createAccountButton} 
      >
        <span>New customer?</span> Create new account
      </button>

    </div>
  );
};

export default Welcome;
