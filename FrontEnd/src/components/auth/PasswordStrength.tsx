import React from 'react';

interface Props {
  password: string;
}

function getStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: 'bg-black/10 dark:bg-white/10' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

  if (score === 1) return { score, label: 'Weak (8+ characters, uppercase, number & symbol required)', color: 'bg-red-500' };
  if (score === 2) return { score, label: 'Fair (add number or symbol)', color: 'bg-amber-500' };
  if (score === 3) return { score, label: 'Good (add special symbol)', color: 'bg-blue-500' };
  if (score === 4) return { score, label: 'Strong (Tour Grade)', color: 'bg-emerald-500' };
  return { score: 0, label: '', color: 'bg-black/10 dark:bg-white/10' };
}

export const PasswordStrength: React.FC<Props> = ({ password }) => {
  const { score, label, color } = getStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2.5">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              s <= score ? color : 'bg-black/10 dark:bg-white/10'
            }`}
          />
        ))}
      </div>
      {label && (
        <p
          className={`text-[11px] mt-1.5 font-medium ${
            score === 1
              ? 'text-red-500'
              : score === 2
              ? 'text-amber-500'
              : score === 3
              ? 'text-blue-500'
              : 'text-emerald-500 font-semibold'
          }`}
        >
          {label}
        </p>
      )}
    </div>
  );
};

export default PasswordStrength;
