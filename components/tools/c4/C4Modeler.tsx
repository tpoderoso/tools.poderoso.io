"use client";

import { useMemo, useState } from "react";
import { ToolPanel } from "@/components/ui/ToolPanel";
import { Select } from "@/components/ui/Select";
import { exampleModel } from "@/lib/tools/c4/example";
import type { ViewId } from "@/lib/tools/c4/model";
import { availableViews, buildView } from "@/lib/tools/c4/views";
import { autoLayout } from "@/lib/tools/c4/layout";
import { C4Canvas } from "./C4Canvas";
import styles from "./c4.module.css";

export function C4Modeler() {
  const [model] = useState(exampleModel);
  const [viewId, setViewId] = useState<ViewId>("landscape");

  const views = useMemo(() => availableViews(model), [model]);
  // se a view atual deixou de existir (o elemento em foco sumiu), cai no landscape
  const active: ViewId = views.some((v) => v.id === viewId) ? viewId : "landscape";
  const view = useMemo(() => buildView(model, active), [model, active]);
  const layout = useMemo(() => autoLayout(view, model, model.layout[active] ?? {}), [view, model, active]);

  return (
    <ToolPanel path="~/diagram/c4" description="monta o C4 model do seu sistema respondendo perguntas">
      <div className={styles.modeler}>
        <div className={styles.bar}>
          <span className="mono-label mono-label--wide">{"// view"}</span>
          <Select
            title="nível do diagrama"
            value={active}
            onChange={(v) => setViewId(v as ViewId)}
            options={views.map((v) => ({ value: v.id, label: v.title }))}
          />
        </div>
        <C4Canvas view={view} model={model} layout={layout} />
      </div>
    </ToolPanel>
  );
}
