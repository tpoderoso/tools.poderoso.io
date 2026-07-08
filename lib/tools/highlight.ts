export type SqlTokenType = "keyword" | "string" | "number" | "comment" | "plain";
export interface SqlToken {
  text: string;
  type: SqlTokenType;
}

// ponytail: lista enxuta dos keywords comuns aos dialetos; adicione aqui se algo relevante sair sem cor
const KEYWORDS = new Set(
  (
    "SELECT FROM WHERE AND OR NOT NULL AS ON JOIN INNER LEFT RIGHT FULL OUTER CROSS " +
    "GROUP BY ORDER HAVING LIMIT OFFSET TOP DISTINCT UNION ALL EXCEPT INTERSECT " +
    "INSERT INTO VALUES UPDATE SET DELETE MERGE TRUNCATE " +
    "CREATE ALTER DROP TABLE VIEW INDEX SEQUENCE TRIGGER PROCEDURE FUNCTION RETURNS RETURN " +
    "PRIMARY FOREIGN KEY REFERENCES CONSTRAINT DEFAULT CHECK UNIQUE " +
    "CASE WHEN THEN ELSE END IF EXISTS BETWEEN IN LIKE IS ASC DESC " +
    "DECLARE BEGIN COMMIT ROLLBACK TRANSACTION WHILE LOOP FOR EACH ROW " +
    "WITH USING EXEC EXECUTE PRINT GRANT REVOKE OVER PARTITION " +
    "COUNT SUM MIN MAX AVG CAST CONVERT COALESCE ISNULL NVL NULLIF " +
    "SUBSTRING TRIM UPPER LOWER LENGTH LEN GETDATE NOW CURRENT_TIMESTAMP CURRENT_DATE " +
    "ROW_NUMBER RANK DENSE_RANK INT INTEGER BIGINT VARCHAR NVARCHAR CHAR TEXT DATE DATETIME " +
    "DECIMAL NUMERIC FLOAT BOOLEAN NUMBER"
  ).split(" ")
);

const TOKEN_RE =
  /(--[^\n]*|\/\*[\s\S]*?\*\/)|('(?:''|[^'])*'?)|([A-Za-z_@#][\w@#$]*)|(\d+(?:\.\d+)?)|([\s\S])/g;

/** Tokeniza SQL para syntax highlight: keywords, strings, números e comentários; o resto é `plain`. */
export function tokenizeSQL(s: string): SqlToken[] {
  const out: SqlToken[] = [];
  const push = (text: string, type: SqlTokenType) => {
    const last = out[out.length - 1];
    if (last && last.type === type) last.text += text;
    else out.push({ text, type });
  };
  for (const m of s.matchAll(TOKEN_RE)) {
    if (m[1]) push(m[1], "comment");
    else if (m[2]) push(m[2], "string");
    else if (m[3]) push(m[3], KEYWORDS.has(m[3].toUpperCase()) ? "keyword" : "plain");
    else if (m[4]) push(m[4], "number");
    else push(m[0], "plain");
  }
  return out;
}
