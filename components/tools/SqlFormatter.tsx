"use client";

import { useState } from "react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { SplitPane } from "@/components/ui/SplitPane";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { OutputPane } from "@/components/ui/OutputPane";
import { toastError } from "@/components/ui/Toaster";
import { fmtSQL } from "@/lib/tools/sql";

const INITIAL_INPUT =
  "select u.id, u.nome, p.titulo from usuarios u inner join perfis p on p.id = u.perfil_id where u.ativo = 1 order by u.nome";

export function SqlFormatter() {
  const [input, setInput] = useState(INITIAL_INPUT);
  const [output, setOutput] = useState("");

  const format = () => {
    try {
      setOutput(fmtSQL(input));
    } catch (e) {
      toastError("Erro ao formatar SQL: " + (e as Error).message);
    }
  };

  return (
    <ToolPanel
      path="~/format/sql"
      description="formata queries SQL com quebras de linha"
    >
      <SplitPane>
        <div className="field-col">
          <TextAreaField label="// entrada" value={input} onChange={setInput} />
          <PrimaryButton onClick={format}>Formatar →</PrimaryButton>
        </div>
        <OutputPane
          label="// saída"
          text={output || "-- o sql formatado aparecerá aqui"}
          copyText={output}
          color="var(--color-accent-yellow)"
        />
      </SplitPane>
    </ToolPanel>
  );
}
