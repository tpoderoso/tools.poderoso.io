import { format } from "sql-formatter";

/** Formats SQL with uppercase keywords, via the `sql-formatter` package. Throws on invalid input (caller is responsible for catching). */
export function fmtSQL(s: string): string {
  return format(s, { language: "sql", keywordCase: "upper" });
}
