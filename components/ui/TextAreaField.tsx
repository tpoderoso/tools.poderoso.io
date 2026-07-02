import type { CSSProperties } from "react";

interface TextAreaFieldProps {
  label?: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  rows?: number;
  focusColor?: "primary" | "danger";
  style?: CSSProperties;
  labelRight?: React.ReactNode;
}

/** Labeled `<textarea>`. Omitting `onChange` renders it read-only (used for output-only fields). */
export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows,
  focusColor = "primary",
  style,
  labelRight,
}: TextAreaFieldProps) {
  return (
    <div className="field-col">
      {(label || labelRight) && (
        <div className={labelRight ? "label-row--between" : "label-row"}>
          {label && <span className="mono-label">{label}</span>}
          {labelRight}
        </div>
      )}
      <textarea
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={!onChange}
        placeholder={placeholder}
        rows={rows}
        className={`surface textarea ${focusColor === "danger" ? "surface--danger" : ""}`}
        style={style}
      />
    </div>
  );
}
