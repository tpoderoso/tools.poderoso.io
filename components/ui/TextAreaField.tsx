import type { CSSProperties, KeyboardEvent } from "react";
import { LinedTextarea } from "./LinedTextarea";

interface TextAreaFieldProps {
  label?: string;
  value: string;
  onChange?: (value: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
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
  onKeyDown,
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
      <LinedTextarea
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        onKeyDown={onKeyDown}
        readOnly={!onChange}
        placeholder={placeholder}
        rows={rows}
        className={`surface textarea ${focusColor === "danger" ? "surface--danger" : ""}`}
        style={style}
      />
    </div>
  );
}
