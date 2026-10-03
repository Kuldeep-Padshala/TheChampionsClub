interface Props {
  password: string;
}

function getStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: 'bg-gray-200' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

  if (score === 1) return { score, label: 'Weak', color: 'bg-red-400' };
  if (score === 2) return { score, label: 'Fair', color: 'bg-yellow-400' };
  if (score === 3) return { score, label: 'Good', color: 'bg-blue-400' };
  if (score === 4) return { score, label: 'Strong', color: 'bg-green-500' };
  return { score: 0, label: '', color: 'bg-gray-200' };
}

export default function PasswordStrength({ password }: Props) {
  const { score, label, color } = getStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              s <= score ? color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      {label && (
        <p className={`text-xs mt-1 font-medium ${
          score === 1 ? 'text-red-500' : score === 2 ? 'text-yellow-600' : score === 3 ? 'text-blue-500' : 'text-green-600'
        }`}>
          {label}
        </p>
      )}
    </div>
  );
}
