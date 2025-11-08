"use client";
import React from 'react';

interface BaseFieldProps {
  label: string;
  name: string;
  required?: boolean;
  disabled?: boolean;
}

interface SelectFieldProps extends BaseFieldProps {
  value: any;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  options: Array<{ value: string; label: string }>;
  error?: string;
}

export const Select: React.FC<SelectFieldProps> = ({ label, name, value, onChange, options, disabled, required, error }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium" htmlFor={name}>{label}{required && <span className="text-red-500"> *</span>}</label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
    >
      <option value="">-- Chọn --</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

export default Select;
