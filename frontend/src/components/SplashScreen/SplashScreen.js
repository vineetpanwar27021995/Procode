import React from 'react';
import splashImage from '../../assets/SplashScreen.jpg';

const SplashScreen = () => {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-white overflow-hidden">
      <img
        src={splashImage}
        alt="Splash"
        className="
          w-auto h-auto 
          max-w-full max-h-full
          sm:w-full sm:h-full sm:object-cover
        "
      />
    </div>
  );
};

export default SplashScreen;