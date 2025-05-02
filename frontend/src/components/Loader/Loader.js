import React from 'react';
import styles from '../../styles/Loader.module.css';
import { RiCodeSSlashFill } from 'react-icons/ri'; // The requested icon

const Loader = ({ message = "Loading..." }) => {
  return (
    <div className={styles.loaderOverlay}>
      <div className={styles.loaderContent}>
        <RiCodeSSlashFill className={styles.loaderIcon} />
        {/* Optional: Add a message below the icon */}
        {/* <p className={styles.loaderMessage}>{message}</p> */}
      </div>
    </div>
  );
};

export default Loader;
