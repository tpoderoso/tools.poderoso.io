"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Line {
  text: string;
  color?: string;
}

const HELP: Line[] = [
  { text: "  help      — este menu" },
  { text: "  ls        — o que sobrou por aqui" },
  { text: "  whoami    — crise existencial rápida" },
  { text: "  cd ~      — voltar pra home" },
  { text: "  coffee    — ☕" },
  { text: "  sudo      — tente a sorte" },
  { text: "  clear     — limpar a tela" },
];

/** Easter egg: mini-shell que responde a comandos digitados, com poucos atalhos reais (cd ~, clear) */
export function RecoveryTerminal() {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([
    { text: "Recovery shell iniciado. Você está preso no /404.", color: "var(--foreground-muted)" },
    { text: "Digite 'help' para ver os comandos disponíveis.", color: "var(--foreground-subtle)" },
  ]);
  const [input, setInput] = useState("");
  const [coffeeCount, setCoffeeCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function push(entries: Line[]) {
    setLines((prev) => [...prev, ...entries].slice(-60));
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }

  function run(raw: string) {
    const cmd = raw.trim();
    if (!cmd) return;
    const low = cmd.toLowerCase();
    const out: Line[] = [{ text: `tools@404 % ${cmd}`, color: "var(--foreground-subtle)" }];

    if (low === "help") {
      out.push(...HELP);
    } else if (low === "ls" || low === "ls -la") {
      out.push(
        { text: "total 404", color: "var(--foreground-subtle)" },
        { text: "drwxr-xr-x  ferramentas/", color: "var(--accent-blue)" },
        { text: "-rw-r--r--  pagina_que_voce_procurava.html.bak  (0 bytes)" },
        { text: "-rw-------  top-secrets.txt  (permission denied)", color: "var(--accent-red)" },
      );
    } else if (low === "whoami") {
      out.push({
        text: "visitante_perdido... Se precisar de ajuda entre em contato.",
        color: "var(--accent-yellow)",
      });
    } else if (low === "cd ~" || low === "cd" || low === "cd .." || low === "home") {
      out.push({ text: "Redirecionando pra home…", color: "var(--primary)" });
      push(out);
      setTimeout(() => router.push("/"), 900);
      return;
    } else if (low === "coffee" || low === "café" || low === "cafe") {
      const n = coffeeCount + 1;
      setCoffeeCount(n);
      out.push({
        text:
          n < 3
            ? `☕ Café servido. (${n}/3 pra desbloquear o modo Tech Lead)`
            : '☕☕☕ MODO TECH LEAD ATIVADO: "isso resolve em uma daily".',
        color: n < 3 ? "var(--accent-yellow)" : "var(--primary)",
      });
    } else if (low.startsWith("sudo")) {
      out.push({
        text: "tools não está no arquivo sudoers. Este incidente será reportado… pra ninguém, porque a página é 404. :(",
        color: "var(--accent-red)",
      });
    } else if (low === "clear") {
      setLines([]);
      return;
    } else if (low === "exit") {
      out.push({ text: "Não há saída. Só a home: digite cd ~", color: "var(--accent)" });
    } else if (low === "rm -rf /" || low.startsWith("rm ")) {
      out.push({ text: "Boa tentativa. Aqui só se deleta débito técnico.", color: "var(--accent-pink)" });
    } else {
      out.push({ text: `command not found: ${cmd} — digite 'help'`, color: "var(--accent-red)" });
    }
    push(out);
  }

  return (
    <div id="not-found-terminal" style={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column" }}>
      <div
        style={{
          marginBottom: 10,
          flexShrink: 0,
          fontSize: 11,
          letterSpacing: "0.14em",
          color: "var(--foreground-subtle)",
          textTransform: "uppercase",
        }}
      >
        terminal de recuperação — digite <span style={{ color: "var(--accent-yellow)" }}>help</span>
      </div>
      <div
        onClick={() => inputRef.current?.focus()}
        className="not-found-terminal-card"
        style={{
          display: "flex",
          flex: 1,
          minHeight: 80,
          maxHeight: 420,
          flexDirection: "column",
          overflow: "hidden",
          cursor: "text",
          boxShadow: "0 18px 44px -14px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            alignItems: "center",
            gap: 11,
            borderBottom: "1px solid var(--border-subtle)",
            padding: "12px 18px",
            fontSize: 12,
            color: "var(--foreground-subtle)",
          }}
        >
          <span style={{ color: "var(--accent)" }}>❯</span> recovery-shell{" "}
          <span style={{ marginLeft: "auto" }}>bash-5.2</span>
        </div>
        <div
          ref={scrollRef}
          style={{ minHeight: 0, flex: 1, overflowX: "hidden", overflowY: "auto", padding: "16px 18px", fontSize: 13, lineHeight: 1.75 }}
        >
          {lines.map((line, i) => (
            <div key={i} style={{ whiteSpace: "pre-wrap", color: line.color ?? "var(--foreground)" }}>
              {line.text}
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--primary)" }}>tools</span>
            <span style={{ color: "var(--foreground-subtle)" }}>@</span>
            <span style={{ color: "var(--accent-blue)" }}>404</span>
            <span style={{ color: "var(--accent)" }}>%</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                const v = input;
                setInput("");
                run(v);
              }}
              spellCheck={false}
              autoComplete="off"
              style={{
                minWidth: 0,
                flex: 1,
                background: "transparent",
                border: "none",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                color: "var(--foreground)",
                caretColor: "var(--primary)",
                outline: "none",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
