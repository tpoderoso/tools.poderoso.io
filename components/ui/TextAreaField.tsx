import { useId, type CSSProperties, type KeyboardEvent } from "react";
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
  // <label htmlFor> e não <span>: sem a associação, o leitor de tela anuncia
  // "caixa de edição" e nada mais — o "// entrada" fica só na tela.
  const id = useId();

  return (
    <div className="field-col">
      {(label || labelRight) && (
        <div className={labelRight ? "label-row--between" : "label-row"}>
          {label && (
            <label className="mono-label" htmlFor={id}>
              {label}
            </label>
          )}
          {labelRight}
        </div>
      )}
      <LinedTextarea
        id={id}
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
