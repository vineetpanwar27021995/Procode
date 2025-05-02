import React, { useState, useRef, useEffect } from 'react';
import styles from '../../styles/OtpInput.module.css'; // We'll create this CSS module next

/**
 * A modern OTP input component with individual boxes.
 *
 * Props:
 * - length (number): The number of OTP digits (default: 4).
 * - value (string): The current OTP value.
 * - onChange (function): Callback function triggered when the OTP value changes.
 * Receives the complete OTP string as an argument.
 * - disabled (boolean): Whether the input fields are disabled.
 */
const OtpInput = ({ length = 4, value = '', onChange, disabled = false }) => {
  // Ensure the value length matches the specified length initially
  const initialOtp = value.padEnd(length, ' ').split('');
  const [otp, setOtp] = useState(initialOtp);
  const inputRefs = useRef([]);

  // Effect to update internal state if the external value prop changes
  useEffect(() => {
    setOtp(value.padEnd(length, ' ').split(''));
  }, [value, length]);

  // Effect to manage refs array size
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handleChange = (element, index) => {
    const newValue = element.value.replace(/[^0-9]/g, ''); // Allow only digits

    if (newValue.length > 1) {
        // If more than one digit entered (e.g., paste), handle paste logic
        handlePaste(newValue, index);
        return;
    }

    // Update the OTP array
    const newOtp = [...otp];
    newOtp[index] = newValue; // Use the single digit or empty string
    setOtp(newOtp);

    // Notify parent component
    onChange(newOtp.join('').trim()); // Send trimmed string without spaces

    // Move focus to the next input if a digit was entered
    if (newValue && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (event, index) => {
    // Move focus backward on backspace if the current input is empty
    if (event.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
    // Allow navigation with arrow keys (optional)
    else if (event.key === 'ArrowLeft' && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
    } else if (event.key === 'ArrowRight' && index < length - 1 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
    }
  };

   const handlePaste = (pastedData, startIndex) => {
        const digits = pastedData.replace(/[^0-9]/g, '').split('');
        const newOtp = [...otp];
        let currentDigitIndex = 0;

        for (let i = startIndex; i < length && currentDigitIndex < digits.length; i++) {
            newOtp[i] = digits[currentDigitIndex];
            currentDigitIndex++;
        }

        setOtp(newOtp);
        onChange(newOtp.join('').trim());

        // Focus the next empty box or the last box filled by the paste
        const nextFocusIndex = Math.min(startIndex + digits.length, length - 1);
         if (inputRefs.current[nextFocusIndex]) {
             // Focus after a short delay to allow state update
             setTimeout(() => {
                 inputRefs.current[nextFocusIndex].focus();
                  // Select the content if needed
                 inputRefs.current[nextFocusIndex].select();
             }, 0);
         }
    };

  return (
    <div className={styles.otpGroup}>
      {otp.map((data, index) => (
        <input
          key={index}
          type="text" // Use text initially to handle paste better, could be "tel"
          inputMode="numeric" // Hint for numeric keyboard
          pattern="[0-9]*" // Pattern for numeric input
          name="otp"
          className={`${styles.otpInput} ${data && data !== ' ' ? styles.filled : ''}`}
          value={data.trim()} // Display trimmed value
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onFocus={(e) => e.target.select()} // Select text on focus
          ref={(el) => (inputRefs.current[index] = el)}
          maxLength="1" // Each input holds one digit
          disabled={disabled}
          autoComplete="one-time-code" // Help password managers
        />
      ))}
    </div>
  );
};

export default OtpInput;
