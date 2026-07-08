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

function makePush<T extends string>(out: { text: string; type: T }[]) {
  return (text: string, type: T) => {
    const last = out[out.length - 1];
    if (last && last.type === type) last.text += text;
    else out.push({ text, type });
  };
}

/** Tokeniza SQL para syntax highlight: keywords, strings, números e comentários; o resto é `plain`. */
export function tokenizeSQL(s: string): SqlToken[] {
  const out: SqlToken[] = [];
  const push = makePush(out);
  for (const m of s.matchAll(TOKEN_RE)) {
    if (m[1]) push(m[1], "comment");
    else if (m[2]) push(m[2], "string");
    else if (m[3]) push(m[3], KEYWORDS.has(m[3].toUpperCase()) ? "keyword" : "plain");
    else if (m[4]) push(m[4], "number");
    else push(m[0], "plain");
  }
  return out;
}

export type XmlTokenType = "tag" | "attr" | "string" | "comment" | "plain";
export interface XmlToken {
  text: string;
  type: XmlTokenType;
}

/** Tokeniza XML para syntax highlight: nomes de tag, atributos, valores e comentários; texto é `plain`. */
export function tokenizeXML(s: string): XmlToken[] {
  const out: XmlToken[] = [];
  const push = makePush(out);
  for (const m of s.matchAll(/(<!--[\s\S]*?(?:-->|$))|(<[^>]*>?)|([^<]+)/g)) {
    if (m[1]) push(m[1], "comment");
    else if (m[2]) {
      // dentro da tag: primeiro identificador é o nome, os demais são atributos
      let first = true;
      for (const t of m[2].matchAll(/("[^"]*"?|'[^']*'?)|([A-Za-z_][\w:.-]*)|([\s\S])/g)) {
        if (t[1]) push(t[1], "string");
        else if (t[2]) {
          push(t[2], first ? "tag" : "attr");
          first = false;
        } else push(t[0], "plain");
      }
    } else push(m[3], "plain");
  }
  return out;
}
