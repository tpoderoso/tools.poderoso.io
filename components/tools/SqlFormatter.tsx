"use client";

import { useMemo, useState } from "react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { SplitPane } from "@/components/ui/SplitPane";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { OutputPane } from "@/components/ui/OutputPane";
import { toastError } from "@/components/ui/Toaster";
import { fmtSQL } from "@/lib/tools/sql";
import { tokenizeSQL, type SqlTokenType } from "@/lib/tools/highlight";

const TOKEN_COLORS: Partial<Record<SqlTokenType, string>> = {
  keyword: "var(--color-accent-pink)",
  string: "var(--color-accent-yellow)",
  number: "var(--color-secondary)",
  comment: "var(--color-muted)",
};

// ponytail: acima disso vira texto puro — dezenas de milhares de spans travam o DOM
const HIGHLIGHT_MAX_CHARS = 200_000;

function highlightSQL(sql: string) {
  if (sql.length > HIGHLIGHT_MAX_CHARS) return sql;
  return tokenizeSQL(sql).map((t, i) =>
    t.type === "plain" ? (
      t.text
    ) : (
      <span key={i} style={{ color: TOKEN_COLORS[t.type] }}>
        {t.text}
      </span>
    )
  );
}

const INITIAL_INPUT =
  "select u.id, u.nome, p.titulo from usuarios u inner join perfis p on p.id = u.perfil_id where u.ativo = 1 order by u.nome";

export function SqlFormatter() {
  const [input, setInput] = useState(INITIAL_INPUT);
  const [output, setOutput] = useState("");
  const displayText = output || "-- o sql formatado aparecerá aqui";
  const highlighted = useMemo(() => highlightSQL(displayText), [displayText]);

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
          text={displayText}
          copyText={output}
          color="var(--color-fg)"
        >
          {highlighted}
        </OutputPane>
      </SplitPane>
    </ToolPanel>
  );
}
