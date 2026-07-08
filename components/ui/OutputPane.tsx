import type { CSSProperties } from "react";
import { CopyButton } from "./CopyButton";

interface OutputPaneProps {
  label: string;
  labelColor?: string;
  text: string;
  copyText?: string;
  color: string;
  style?: CSSProperties;
}

/** Read-only `<pre>` output block with a labeled header and copy button. `copyText` overrides `text` for clipboard when the two should differ (e.g. displaying an error but nothing to copy). */
export function OutputPane({ label, labelColor, text, copyText, color, style }: OutputPaneProps) {
  return (
    <div className="field-col">
      <div className="label-row--between">
        <span className="mono-label" style={labelColor ? { color: labelColor } : undefined}>
          {label}
        </span>
        <CopyButton text={copyText ?? text} />
      </div>
      <pre
        className="surface"
        style={{
          flex: 1,
          padding: 14,
          fontSize: 12,
          lineHeight: 1.65,
          overflow: "auto",
          margin: 0,
          minHeight: 380,
          // conteúdo grande não pode inflar o painel — dimensiona como se vazio e rola por dentro
          contain: "size",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          color,
          ...style,
        }}
      >
        {text}
      </pre>
    </div>
  );
}
