import { useCallback } from 'react';
import { formatWithCommas } from '@/utils/formatters';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  formatCommas?: boolean;
  placeholder?: string;
}

export default function CalculatorInput({
  label, value, onChange, prefix, suffix, formatCommas = false, placeholder,
}: Props) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (formatCommas) {
      onChange(formatWithCommas(raw));
    } else {
      onChange(raw);
    }
  }, [onChange, formatCommas]);

  return (
    <div className="mb-8">
      <label className="block text-[15px] font-medium text-foreground mb-2.5 tracking-tight">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[17px] font-medium text-foreground pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type="text"
          inputMode="numeric"
          className={`glass-input ${prefix ? 'pl-9' : ''} ${suffix ? 'pr-14' : ''}`}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
        />
        {suffix && (
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[17px] font-medium text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
