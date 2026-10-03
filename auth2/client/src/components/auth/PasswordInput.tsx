import React, { useState } from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function PasswordInput({ label, error, ...props }: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          {...props}
          type={show ? 'text' : 'password'}
          className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 pr-10 ${
            error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
          } ${props.className || ''}`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs select-none"
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
