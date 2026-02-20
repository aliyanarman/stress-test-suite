import { SUPPORTED_COUNTRIES } from '@/utils/marketData';

interface Props {
  value: string;
  onChange: (code: string) => void;
}

export default function CountrySelector({ value, onChange }: Props) {
  return (
    <select
      className="glass-select"
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ width: 'auto', padding: '10px 35px 10px 16px' }}
    >
      {SUPPORTED_COUNTRIES.map(c => (
        <option key={c.code} value={c.code}>{c.name}</option>
      ))}
    </select>
  );
}
