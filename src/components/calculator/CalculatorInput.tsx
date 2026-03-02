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
    <div className="mb-6 sm:mb-8">
      <label className="block text-[13px] sm:text-[15px] font-medium text-foreground mb-2 sm:mb-2.5 tracking-tight">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-[15px] sm:text-[17px] font-medium text-foreground pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type="text"
          inputMode="numeric"
          className={`glass-input ${prefix ? 'pl-8 sm:pl-9' : ''} ${suffix ? 'pr-12 sm:pr-14' : ''}`}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
        />
        {suffix && (
          <span className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-[13px] sm:text-[17px] font-medium text-muted-foreground pointer-events-none truncate max-w-[80px] sm:max-w-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
