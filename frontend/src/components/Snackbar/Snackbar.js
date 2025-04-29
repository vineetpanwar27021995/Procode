import { useEffect } from 'react';
import { useSnackbarStore } from '../../stores/snackbarStore';
import { AiOutlineCheckCircle, AiOutlineInfoCircle, AiOutlineWarning, AiOutlineCloseCircle } from 'react-icons/ai';
import { MdErrorOutline } from 'react-icons/md';
import { IoClose } from 'react-icons/io5';

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

  const typeIcons = {
    success: <AiOutlineCheckCircle size={24} />,
    error: <MdErrorOutline size={24} />,
    info: <AiOutlineInfoCircle size={24} />,
    warning: <AiOutlineWarning size={24} />
  };

  return (
    <div className="fixed top-5 right-5 z-50 w-full max-w-xs">
      <div className={`alert ${typeClasses[type] || 'alert-info'} shadow-lg transition-all duration-300`}>
        <div className="flex-1 flex items-center gap-2">
          {typeIcons[type] || <AiOutlineInfoCircle size={24} />}
          <span>{message}</span>
        </div>
        <button className="btn btn-sm btn-ghost" onClick={hideSnackbar}>
          <IoClose size={20} />
        </button>
      </div>
    </div>
  );
};

export default Snackbar;
