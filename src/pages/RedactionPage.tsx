import { useState } from "react";
import { CheckCircle2, Eye, MousePointer2, ScanSearch, ShieldAlert, Square, Type } from "lucide-react";
import { copy } from "../constants/copy";
import { Badge, Button, PageHeader, Panel } from "../components/UI";

export function RedactionPage({
  notify,
  qcPassed,
  setQcPassed,
}: {
  notify: (message: string) => void;
  qcPassed: boolean;
  setQcPassed: (passed: boolean) => void;
}) {
  const [tool, setTool] = useState<string>(copy.redaction.rectangle);
  const [redactions, setRedactions] = useState(true);
  const [checking, setChecking] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const runCheck = () => {
    setChecking(true);
    window.setTimeout(() => {
      setChecking(false);
      setQcPassed(true);
      notify(copy.redaction.leakCheckSuccess);
    }, 900);
  };

  const submit = () => {
    if (!qcPassed) {
      notify(copy.redaction.blocked);
      return;
    }
    setSubmitted(true);
    notify(copy.redaction.submitted);
  };

  const tools = [
    { label: copy.redaction.rectangle, icon: Square },
    { label: copy.redaction.text, icon: Type },
    { label: copy.redaction.fullPage, icon: ScanSearch },
    { label: copy.redaction.inverse, icon: MousePointer2 },
  ];

  return (
    <div className="page page--redaction">
      <PageHeader title={copy.redaction.title} subtitle={copy.redaction.subtitle} ids={copy.redaction.ids} />
      <div className="redaction-toolbar">
        <div><strong>{copy.redaction.queue}</strong><span>{copy.redaction.documentMeta}</span></div>
        <span><Badge tone={submitted ? "info" : "neutral"}>{submitted ? copy.redaction.pendingStatus : copy.redaction.draftStatus}</Badge></span>
        <Button variant="primary" onClick={submit}>{copy.redaction.submitQc}</Button>
      </div>

      <div className="redaction-grid">
        <aside className="redaction-tools">
          <h2>{copy.redaction.tools}</h2>
          <label><span>{copy.redaction.markupSet}</span><select defaultValue={copy.redaction.markupSetValue}><option>{copy.redaction.markupSetValue}</option></select></label>
          <label><span>{copy.redaction.reason}</span><select defaultValue={copy.redaction.reasonValue}><option>{copy.redaction.reasonValue}</option></select></label>
          <div className="tool-grid">
            {tools.map(({ label, icon: Icon }) => <button type="button" key={label} className={tool === label ? "is-active" : ""} onClick={() => setTool(label)}><Icon size={19} /><span>{label}</span></button>)}
          </div>
          <Button onClick={() => setRedactions(!redactions)}>{redactions ? copy.redaction.removeDemo : copy.redaction.applyDemo}</Button>
        </aside>

        <section className="redaction-viewer">
          <div className="redaction-viewer__top"><span>{tool}</span><strong>{copy.redaction.pageCount}</strong></div>
          <div className="redaction-canvas">
            <article className="paper paper--redaction">
              <h3>{copy.redaction.paperTitle}</h3><h4>{copy.redaction.paperSubtitle}</h4>
              <p>{copy.redaction.employee}</p><p>{copy.redaction.address}</p><p className="sensitive-line">{copy.redaction.identity}{redactions && <span className="redaction-block redaction-block--identity" />}</p><p className="sensitive-line">{copy.redaction.bank}{redactions && <span className="redaction-block redaction-block--bank" />}</p><p>{copy.redaction.body}</p>
            </article>
          </div>
        </section>

        <Panel title={copy.redaction.qc} className="qc-panel">
          <div className="qc-list">
            {copy.redaction.qcItems.map((item, index) => {
              const passed = qcPassed || index === 0 || index === 2;
              const pending = !qcPassed && index === 3;
              const tone = passed ? "success" : pending ? "warning" : "danger";
              return <div key={item.id}><span className={`qc-list__icon qc-list__icon--${tone}`}>{passed ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}</span><span><strong>{item.label}</strong><small>{passed ? copy.redaction.qcItems[0].state : pending ? copy.redaction.qcItems[3].state : copy.redaction.qcItems[1].state}</small></span><Badge tone={tone}>{passed ? copy.redaction.qcItems[0].state : pending ? copy.redaction.qcItems[3].state : copy.redaction.qcItems[1].state}</Badge></div>;
            })}
          </div>
          <Button variant="primary" icon={<Eye size={16} />} onClick={runCheck} disabled={checking}>{checking ? copy.redaction.leakCheckRunning : copy.redaction.runLeakCheck}</Button>
          {!qcPassed && <div className="qc-warning"><ShieldAlert size={18} /><span>{copy.redaction.blocked}</span></div>}
        </Panel>
      </div>
    </div>
  );
}
