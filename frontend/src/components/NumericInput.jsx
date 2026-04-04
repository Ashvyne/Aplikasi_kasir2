import React from 'react';

/**
 * NumericInput - A reusable input component for numbers with thousand separators
 * @param {number} value - The numeric value
 * @param {function} onChange - Callback function(number)
 * @param {string} prefix - Optional prefix (e.g. "Rp")
 * @param {string} placeholder - Input placeholder
 * @param {string} className - Additional CSS classes
 */
const NumericInput = ({ value, onChange, prefix, placeholder, className = "" }) => {
  
  // Format number to string with dots (e.g. 10000 -> "10.000")
  const formatDisplay = (val) => {
    if (val === null || val === undefined || val === '') return '';
    const num = val.toString().replace(/\D/g, '');
    if (!num) return '';
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleChange = (e) => {
    // Remove all non-numeric characters
    const rawValue = e.target.value.replace(/\D/g, '');
    const numericValue = rawValue === '' ? 0 : parseInt(rawValue, 10);
    onChange(numericValue);
  };

  return (
    <div className="relative w-full group">
      {prefix && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none transition-colors group-focus-within:text-accent-gold text-gray-400 font-bold text-sm">
          {prefix}
        </div>
      )}
      <input
        type="text"
        inputMode="numeric"
        className={`input-field w-full transition-all ${prefix ? 'pl-10' : 'pl-4'} ${className}`}
        placeholder={placeholder}
        value={formatDisplay(value)}
        onChange={handleChange}
      />
    </div>
  );
};

export default NumericInput;
