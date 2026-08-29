"use client";

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Select do tema (mesma caixa dos botões: 34px, borda `--color-line`, fundo alt).
 * `placeholder` é o rótulo da opção vazia — omita para um select sem opção vazia.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder,
  title,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  title?: string;
}) {
  return (
    <select
      className="select-field"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title={title}
      aria-label={title}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
