import { Fragment } from "react";
import { Check } from "lucide-react";
import type { Block, Inline, ListItem } from "@/lib/tools/markdown";
import styles from "./markdown.module.css";

function renderInline(nodes: Inline[]) {
  return nodes.map((n, i) => {
    switch (n.t) {
      case "text":
        return <Fragment key={i}>{n.v}</Fragment>;
      case "code":
        return (
          <code key={i} className={styles.chip}>
            {n.v}
          </code>
        );
      case "strong":
        return <strong key={i}>{renderInline(n.c)}</strong>;
      case "em":
        return <em key={i}>{renderInline(n.c)}</em>;
      case "del":
        return <del key={i}>{renderInline(n.c)}</del>;
      case "link":
        return (
          <a key={i} href={n.href} target="_blank" rel="noopener noreferrer nofollow">
            {renderInline(n.c)}
          </a>
        );
      case "img":
        // eslint-disable-next-line @next/next/no-img-element -- URL arbitrária de texto colado; next/image exige host conhecido
        return <img key={i} src={n.src} alt={n.alt} className={styles.img} loading="lazy" />;
      case "br":
        return <br key={i} />;
    }
  });
}

/** Item "apertado" (um parágrafo só) renderiza inline, sem `<p>` sobrando dentro do `<li>`. */
function renderItemContent(item: ListItem) {
  const only = item.blocks.length === 1 ? item.blocks[0] : null;
  return only?.t === "para" ? renderInline(only.c) : renderBlocks(item.blocks);
}

function renderList(block: Extract<Block, { t: "list" }>, key: number) {
  const Tag = block.ordered ? "ol" : "ul";
  const tasks = block.items.length > 0 && block.items.every((it) => it.task !== null);

  return (
    <Tag
      key={key}
      className={tasks ? styles.taskList : undefined}
      start={block.ordered && block.start !== 1 ? block.start : undefined}
    >
      {block.items.map((item, i) =>
        item.task === null ? (
          <li key={i}>{renderItemContent(item)}</li>
        ) : (
          <li key={i} className={styles.task}>
            <span className={`${styles.box} ${item.task ? styles.boxDone : ""}`}>
              {item.task && <Check size={11} strokeWidth={3.5} />}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>{renderItemContent(item)}</div>
          </li>
        ),
      )}
    </Tag>
  );
}

function renderBlocks(blocks: Block[]) {
  return blocks.map((block, i) => {
    switch (block.t) {
      case "heading": {
        const Tag = `h${Math.min(block.level, 6)}` as "h1";
        return (
          <Tag key={i} id={block.id} data-mdh={block.id}>
            {renderInline(block.c)}
          </Tag>
        );
      }
      case "para":
        return <p key={i}>{renderInline(block.c)}</p>;
      case "code":
        return (
          <pre key={i} className={styles.block}>
            {block.lang && <span className={styles.blockLang}>{block.lang}</span>}
            <code>{block.v}</code>
          </pre>
        );
      case "quote":
        return <blockquote key={i}>{renderBlocks(block.blocks)}</blockquote>;
      case "list":
        return renderList(block, i);
      case "table":
        return (
          <div key={i} className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  {block.head.map((cell, k) => (
                    <th key={k} style={{ textAlign: block.align[k] ?? "left" }}>
                      {renderInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, k) => (
                      <td key={k} style={{ textAlign: block.align[k] ?? "left" }}>
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "hr":
        return <hr key={i} className={styles.rule} />;
    }
  });
}

/** Renderiza a AST de markdown como elementos React — nada de HTML cru, nada de sanitizer. */
export function MarkdownDoc({ blocks }: { blocks: Block[] }) {
  return <>{renderBlocks(blocks)}</>;
}
