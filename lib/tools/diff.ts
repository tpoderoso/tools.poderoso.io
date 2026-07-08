export function stripLeadingWhitespace(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/^[ \t]+/, ""))
    .join("\n");
}

export type DiffLineType = "same" | "add" | "remove" | "info";

export interface DiffLine {
  type: DiffLineType;
  text: string;
}

/**
 * Line-based diff via LCS dynamic programming — O(lines_left × lines_right) time and memory,
 * mas só sobre o miolo que difere: prefixo/sufixo comuns são descartados antes.
 * Bails out com uma linha "info" se o miolo passar de 16M células (~4000×4000 linhas
 * totalmente diferentes); arquivos grandes com mudanças localizadas passam em qualquer tamanho.
 */
export function computeDiff(left: string, right: string): DiffLine[] {
  const lLines = left.split("\n");
  const rLines = right.split("\n");

  let start = 0;
  while (start < lLines.length && start < rLines.length && lLines[start] === rLines[start]) start++;
  let endL = lLines.length;
  let endR = rLines.length;
  while (endL > start && endR > start && lLines[endL - 1] === rLines[endR - 1]) {
    endL--;
    endR--;
  }

  const l = endL - start;
  const r = endR - start;
  // ponytail: LCS quadrático com corte em 16M células; Myers O(n·d) se precisar de mais
  if (l * r > 16_000_000) {
    return [{ type: "info", text: "// Texto muito longo para diff completo." }];
  }

  // interna linhas como ids numéricos: comparação no DP vira int === int
  const ids = new Map<string, number>();
  const intern = (s: string) => {
    let id = ids.get(s);
    if (id === undefined) {
      id = ids.size;
      ids.set(s, id);
    }
    return id;
  };
  const lIds = new Int32Array(l);
  const rIds = new Int32Array(r);
  for (let i = 0; i < l; i++) lIds[i] = intern(lLines[start + i]);
  for (let j = 0; j < r; j++) rIds[j] = intern(rLines[start + j]);

  const w = r + 1;
  const dp = new Uint32Array((l + 1) * w);
  for (let i = 1; i <= l; i++) {
    for (let j = 1; j <= r; j++) {
      dp[i * w + j] =
        lIds[i - 1] === rIds[j - 1]
          ? dp[(i - 1) * w + j - 1] + 1
          : Math.max(dp[(i - 1) * w + j], dp[i * w + j - 1]);
    }
  }

  const middle: DiffLine[] = [];
  let i = l;
  let j = r;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && lIds[i - 1] === rIds[j - 1]) {
      middle.unshift({ type: "same", text: lLines[start + i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i * w + j - 1] >= dp[(i - 1) * w + j])) {
      middle.unshift({ type: "add", text: rLines[start + j - 1] });
      j--;
    } else {
      middle.unshift({ type: "remove", text: lLines[start + i - 1] });
      i--;
    }
  }

  return [
    ...lLines.slice(0, start).map((text): DiffLine => ({ type: "same", text })),
    ...middle,
    ...lLines.slice(endL).map((text): DiffLine => ({ type: "same", text })),
  ];
}

export interface DiffPair {
  left: DiffLine | null;
  right: DiffLine | null;
}

/** Groups runs of remove/add lines into aligned left/right pairs for side-by-side rendering. */
export function pairSideBySide(lines: DiffLine[]): DiffPair[] {
  const pairs: DiffPair[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.type !== "remove" && line.type !== "add") {
      pairs.push({ left: line, right: line });
      i++;
      continue;
    }
    const removes: DiffLine[] = [];
    while (i < lines.length && lines[i].type === "remove") removes.push(lines[i++]);
    const adds: DiffLine[] = [];
    while (i < lines.length && lines[i].type === "add") adds.push(lines[i++]);
    const max = Math.max(removes.length, adds.length);
    for (let k = 0; k < max; k++) {
      pairs.push({ left: removes[k] ?? null, right: adds[k] ?? null });
    }
  }
  return pairs;
}
