import React, { useState } from 'react';
import { useThemeStore } from '../../stores/themeStore';
import { lightTheme, darkTheme } from '../../styles/themes';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Input = ({
  type = 'text',
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  style,
  ...props
}) => {
  const { darkMode } = useThemeStore();
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const baseStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '5px',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    outline: 'none',
    ...style
  };

  const lightModeStyles = {
    backgroundColor: lightTheme.inputBg,
    color: lightTheme.inputText,
    border: `1px solid ${lightTheme.inputBorder || '#DDDDDD'}`,
  };

  const darkModeStyles = {
    backgroundColor: darkTheme.inputBg,
    color: darkTheme.inputText,
    border: `1px solid ${darkTheme.inputBorder || '#444444'}`,
  };

  const focusStyle = {
    borderColor: darkMode ? darkTheme.buttonBg : lightTheme.buttonBg,
    boxShadow: `0 0 0 2px ${(darkMode ? darkTheme.buttonBg : lightTheme.buttonBg)}20`
  };

  const errorStyle = {
    borderColor: '#E53E3E',
    boxShadow: '0 0 0 2px #E53E3E20'
  };

  const inputStyle = {
    ...baseStyle,
    ...(darkMode ? darkModeStyles : lightModeStyles),
    ...(error ? errorStyle : {}),
    ':focus': focusStyle
  };

  const inputWithToggleStyle = type === 'password' ? {
    ...inputStyle,
    paddingRight: '40px' 
  } : inputStyle;

  return (
    <div style={{ marginBottom: '16px', width: '100%', position: 'relative' }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          color: darkMode ? darkTheme.text : lightTheme.text
        }}>
          {label}
        </label>
      )}
      
      <div style={{ position: 'relative' }}>
        <input
          type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          style={inputWithToggleStyle}
          {...props}
        />
        
        {type === 'password' && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: darkMode ? darkTheme.text : lightTheme.text,
              padding: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {!showPassword ? (
              <FaEyeSlash size={16} color='#4280EF'/>
            ) : (
              <FaEye size={16} color='#4280EF' />
            )}
          </button>
        )}
      </div>
      
      {error && (
        <span style={{
          display: 'block',
          marginTop: '4px',
          fontSize: '12px',
          color: '#E53E3E'
        }}>
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;