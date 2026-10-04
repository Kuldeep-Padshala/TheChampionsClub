import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const PasswordInput: React.FC<Props> = ({ label, error, ...props }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="mb-4">
      <label className="block text-xs uppercase font-semibold tracking-wider text-[#1D1D1F] dark:text-gray-200 mb-1.5 font-display">
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          type={show ? 'text' : 'password'}
          className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all pr-11 bg-white/80 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
            error
              ? 'border-red-400/80 bg-red-50/50 dark:bg-red-950/20'
              : 'border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 focus:border-[#B89047] focus:ring-2 focus:ring-[#B89047]/20 shadow-sm'
          } ${props.className || ''}`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#B89047] dark:hover:text-[#EAD29A] transition-colors p-1 cursor-pointer select-none"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
};

export default PasswordInput;
