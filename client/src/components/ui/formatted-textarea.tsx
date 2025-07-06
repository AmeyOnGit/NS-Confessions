import React from 'react';

interface FormattedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  className?: string;
}

export function FormattedTextarea({
  value,
  onChange,
  placeholder = "Share your thoughts anonymously...",
  maxLength = 500,
  rows = 3,
  className = ""
}: FormattedTextareaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={rows}
      className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none resize-none transition-all duration-200 ${className}`}
    />
  );
}