import React from 'react';
import { useThemeStore } from '../../stores/themeStore';
import { lightTheme, darkTheme } from '../../styles/themes';

const Button = ({ 
  children, 
  variant = 'contained', 
  startIcon, 
  endIcon, 
  disabled, 
  onClick, 
  type = 'button',
  style,
  ...props 
}) => {
  const { darkMode } = useThemeStore();
  
  const baseStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 20px',
    borderRadius: 5,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 'bold',
    width: '100%',
    ...style
  };
  
  const containedStyle = {
    backgroundColor: darkMode ? darkTheme.buttonBg : lightTheme.buttonBg,
    color: darkMode ? darkTheme.buttonText : lightTheme.buttonText,
    border: 'none',
  };
  
  const outlinedStyle = {
    backgroundColor: 'transparent',
    color: darkMode ? darkTheme.buttonBg : lightTheme.buttonBg,
    border: `1px solid ${darkMode ? darkTheme.buttonBg : lightTheme.buttonBg}`,
  };
  
  const textStyle = {
    backgroundColor: 'transparent',
    color: darkMode ? darkTheme.buttonBg : lightTheme.buttonBg,
    border: 'none',
    textDecoration: 'underline',
  };
  
  const buttonStyle = variant === 'outlined' 
    ? { ...baseStyle, ...outlinedStyle } 
    : variant === 'text' 
      ? { ...baseStyle, ...textStyle } 
      : { ...baseStyle, ...containedStyle };
  
  return (
    <button
      type={type}
      style={buttonStyle}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {startIcon && <span style={{ marginRight: 8 }}>{startIcon}</span>}
      {children}
      {endIcon && <span style={{ marginLeft: 8 }}>{endIcon}</span>}
    </button>
  );
};

export default Button;