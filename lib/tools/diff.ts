export type DiffLineType = "same" | "add" | "remove" | "info";

export interface DiffLine {
  type: DiffLineType;
  text: string;
}

/**
 * Line-based diff via LCS dynamic programming — O(lines_left × lines_right) time and memory.
 * Bails out with a single "info" line above ~1200 combined lines to avoid locking up the tab.
 */
export function computeDiff(left: string, right: string): DiffLine[] {
  const lLines = left.split("\n");
  const rLines = right.split("\n");
  if (lLines.length + rLines.length > 1200) {
    return [{ type: "info", text: "// Texto muito longo para diff completo." }];
  }
  const l = lLines.length;
  const r = rLines.length;
  const dp: number[][] = Array(l + 1)
    .fill(null)
    .map(() => Array(r + 1).fill(0));
  for (let i = 1; i <= l; i++) {
    for (let j = 1; j <= r; j++) {
      dp[i][j] = lLines[i - 1] === rLines[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const result: DiffLine[] = [];
  let i = l;
  let j = r;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && lLines[i - 1] === rLines[j - 1]) {
      result.unshift({ type: "same", text: lLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "add", text: rLines[j - 1] });
      j--;
    } else {
      result.unshift({ type: "remove", text: lLines[i - 1] });
      i--;
    }
  }
  return result;
}
