import React from 'react';
import { Check } from 'lucide-react';

interface HardwareToggleProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

export const HardwareToggle: React.FC<HardwareToggleProps> = ({
  id,
  label,
  description,
  checked,
  onChange,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 py-2 min-h-[44px]">
      <label htmlFor={id} className="cursor-pointer select-none">
        <div className="text-sm font-medium text-white leading-tight">{label}</div>
        {description && (
          <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#8B949E] mt-0.5">
            {description}
          </div>
        )}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10E66A] ${
          checked
            ? 'bg-[#10E66A] border-[#10E66A]'
            : 'bg-[#1E2638] border-white/15'
        }`}
      >
        <span
          className={`pointer-events-none flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform duration-150 ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        >
          {/* Tactile friction notches */}
          <span className="flex gap-[2px]">
            <span className="h-2.5 w-[1.5px] rounded-full bg-[#0D1117]/40" />
            <span className="h-2.5 w-[1.5px] rounded-full bg-[#0D1117]/40" />
          </span>
        </span>
      </button>
    </div>
  );
};

interface HardwareCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

export const HardwareCheckbox: React.FC<HardwareCheckboxProps> = ({
  id,
  label,
  checked,
  onChange,
}) => {
  return (
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 min-h-[44px] py-1.5 text-left group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10E66A] rounded"
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] border transition-colors duration-150 ${
          checked
            ? 'bg-[#10E66A] border-[#10E66A] text-[#0D1117]'
            : 'bg-[#161B26] border-white/25 text-transparent group-hover:border-white/50'
        }`}
      >
        <Check className="h-3.5 w-3.5 stroke-[3]" />
      </span>
      <span className="text-sm font-medium text-[#dfe2eb] group-hover:text-white transition-colors">
        {label}
      </span>
    </button>
  );
};

interface SelectorChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export const SelectorChip: React.FC<SelectorChipProps> = ({
  label,
  selected,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 min-h-[36px] sm:min-h-[32px] items-center gap-2 rounded-full px-3.5 font-mono text-xs uppercase tracking-[0.06em] whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10E66A] ${
        selected
          ? 'border border-[#10E66A] bg-[#10E66A]/12 text-[#10E66A] font-semibold'
          : 'border border-white/10 bg-white/[0.03] text-[#8B949E] hover:text-white hover:border-white/25'
      }`}
    >
      {selected && (
        <span className="h-1 w-1 rounded-full bg-[#10E66A]" aria-hidden="true" />
      )}
      <span>{label}</span>
    </button>
  );
};
