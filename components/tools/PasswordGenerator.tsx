"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { CenteredColumn } from "@/components/ui/CenteredColumn";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { CopyButton } from "@/components/ui/CopyButton";
import { genPassword } from "@/lib/tools/password";
import { useOnActivate } from "@/lib/hooks/useOnActivate";

export function PasswordGenerator({ active }: { active: boolean }) {
  const [len, setLen] = useState(16);
  const [sym, setSym] = useState(false);
  const [upper, setUpper] = useState(true);
  const [num, setNum] = useState(true);
  const [value, setValue] = useState("");

  useOnActivate(active, () => setValue(genPassword(len, sym, upper, num)));

  return (
    <ToolPanel path="~/generate/senha" description="gera senhas seguras com opções">
      <CenteredColumn style={{ padding: "32px 0" }}>
        <div className="pwd-value-box">{value}</div>
        <div className="pwd-controls">
          <div>
            <div className="pwd-slider-row">
              <span>comprimento</span>
              <span className="pwd-slider-value">{len} caracteres</span>
            </div>
            <input
              type="range"
              min={8}
              max={64}
              value={len}
              onChange={(e) => {
                const l = parseInt(e.target.value, 10);
                setLen(l);
                setValue(genPassword(l, sym, upper, num));
              }}
              className="pwd-slider"
            />
          </div>
          <div className="pwd-toggle-grid">
            <ToggleButton
              active={upper}
              onClick={() => {
                const u = !upper;
                setUpper(u);
                setValue(genPassword(len, sym, u, num));
              }}
            >
              Maiúsculas
            </ToggleButton>
            <ToggleButton
              active={num}
              onClick={() => {
                const n = !num;
                setNum(n);
                setValue(genPassword(len, sym, upper, n));
              }}
            >
              Números
            </ToggleButton>
            <ToggleButton
              active={sym}
              onClick={() => {
                const sy = !sym;
                setSym(sy);
                setValue(genPassword(len, sy, upper, num));
              }}
            >
              Símbolos
            </ToggleButton>
          </div>
        </div>
        <div className="gen-actions">
          <PrimaryButton
            style={{ padding: "11px 22px" }}
            onClick={() => setValue(genPassword(len, sym, upper, num))}
          >
            <RotateCcw size={13} style={{ verticalAlign: -2, marginRight: 6 }} />
            Gerar nova
          </PrimaryButton>
          <CopyButton variant="text" text={value} />
        </div>
      </CenteredColumn>
    </ToolPanel>
  );
}
