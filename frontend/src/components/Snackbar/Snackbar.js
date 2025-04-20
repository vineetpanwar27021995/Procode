import { useEffect } from 'react';
import { useSnackbarStore } from '../../stores/snackbarStore';

const Snackbar = () => {
  const { message, type, isVisible, hideSnackbar } = useSnackbarStore();

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        // hideSnackbar();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, hideSnackbar]);

  if (!isVisible) return null;

  const typeClasses = {
    success: 'alert-success',
    error: 'alert-error',
    info: 'alert-info',
    warning: 'alert-warning'
  };

  return (
    <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50">
      <div className={`alert shadow-lg ${typeClasses[type] || 'alert-info'} transition-all duration-300`}>
        <span>{message}</span>
        <button className="btn btn-sm btn-ghost ml-4" onClick={hideSnackbar}>✕</button>
      </div>
    </div>
  );
};

export default Snackbar;