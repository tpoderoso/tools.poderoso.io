import type { ButtonHTMLAttributes } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** Styled `<button>` that accepts all native button props/handlers as-is. */
export function PrimaryButton({ className, style, ...rest }: PrimaryButtonProps) {
  return <button type="button" className={`btn-primary ${className ?? ""}`} style={style} {...rest} />;
}
