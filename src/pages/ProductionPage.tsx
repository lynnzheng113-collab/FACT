import { useState } from "react";
import { AlertTriangle, CheckCircle2, Download, LoaderCircle, PackageCheck, Play, ShieldCheck } from "lucide-react";
import { copy, type PageId } from "../constants/copy";
import { Badge, Button, CheckRow, Field, PageHeader, Panel } from "../components/UI";

export function ProductionPage({
  navigate,
  notify,
  qcPassed,
}: {
  navigate: (page: PageId) => void;
  notify: (message: string) => void;
  qcPassed: boolean;
}) {
  const [outputs, setOutputs] = useState<string[]>(copy.production.outputOptions.filter((item) => item.checked).map((item) => item.id));
  const [validated, setValidated] = useState(false);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);

  const validate = () => {
    if (!qcPassed) {
      setValidated(false);
      notify(copy.production.blocked);
      return;
    }
    setValidated(true);
    notify(copy.production.validationSuccess);
  };

  const run = () => {
    if (!validated) {
      notify(copy.production.blocked);
      return;
    }
    setRunning(true);
    window.setTimeout(() => {
      setRunning(false);
      setCompleted(true);
      notify(copy.production.completed);
    }, 1100);
  };

  return (
    <div className="page page--production">
      <PageHeader title={copy.production.title} subtitle={copy.production.subtitle} ids={copy.production.ids} />
      <div className="production-heading"><span><strong>{copy.production.productionName}</strong><Badge tone={completed ? "success" : running ? "info" : "neutral"}>{completed ? copy.production.completed : running ? copy.production.running : copy.production.statusDraft}</Badge></span><div>{copy.production.steps.map((step, index) => <span key={step} className={index < (validated ? 4 : 3) ? "is-done" : ""}>{step}</span>)}</div></div>

      <div className="production-grid">
        <div className="production-config">
          <Panel title={copy.production.source} subtitle={copy.production.fixedCount}>
            <Field label={copy.production.source}><select defaultValue={copy.production.sourceValue}><option>{copy.production.sourceValue}</option></select></Field>
          </Panel>
          <Panel title={copy.production.numbering}>
            <div className="form-grid form-grid--three"><Field label={copy.production.prefix}><input defaultValue={copy.production.prefixValue} /></Field><Field label={copy.production.startNumber}><input defaultValue={copy.production.startNumberValue} /></Field><Field label={copy.production.padding}><input defaultValue={copy.production.paddingValue} /></Field></div>
          </Panel>
          <Panel title={copy.production.output}>
            <div className="output-grid">{copy.production.outputOptions.map((item) => <CheckRow key={item.id} label={item.label} checked={outputs.includes(item.id)} onChange={() => setOutputs(outputs.includes(item.id) ? outputs.filter((id) => id !== item.id) : [...outputs, item.id])} />)}</div>
            <div className="form-grid"><Field label={copy.production.redactionSet}><select defaultValue={copy.production.redactionSetValue}><option>{copy.production.redactionSetValue}</option></select></Field><Field label={copy.production.placeholder}><input defaultValue={copy.production.placeholderValue} /></Field></div>
          </Panel>
        </div>

        <Panel title={copy.production.validationTitle} className="validation-panel">
          {!qcPassed && <div className="validation-summary validation-summary--danger"><AlertTriangle size={22} /><span><strong>{copy.production.validationSummary}</strong><small>{copy.production.blocked}</small></span></div>}
          {qcPassed && validated && <div className="validation-summary validation-summary--success"><ShieldCheck size={22} /><span><strong>{copy.production.validationSuccess}</strong><small>{copy.production.fixedCount}</small></span></div>}
          <div className="validation-list">
            {copy.production.validationRows.map((row, index) => {
              const passed = qcPassed || index > 0;
              return <div key={row.check}><span>{passed ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}</span><strong>{row.check}</strong><small>{passed ? copy.redaction.qcItems[0].state : row.result}</small><Badge tone={passed ? "success" : row.tone}>{passed ? copy.production.validationRows[1].severity : row.severity}</Badge></div>;
            })}
          </div>
          {!qcPassed && <Button variant="danger" onClick={() => navigate("redaction")}>{copy.production.resolveRedaction}</Button>}
          <Button variant="primary" onClick={validate} icon={<ShieldCheck size={16} />}>{validated ? copy.production.rerunValidation : copy.production.runValidation}</Button>
          <Button onClick={run} disabled={!validated || running} icon={running ? <LoaderCircle className="spin" size={16} /> : <Play size={16} />}>{running ? copy.production.running : copy.production.runProduction}</Button>
          {completed && <div className="production-complete"><PackageCheck size={30} /><strong>{copy.production.completed}</strong><span>{copy.production.completedDetail}</span><Button icon={<Download size={16} />} onClick={() => notify(copy.toasts.download)}>{copy.production.manifest}</Button><Button variant="primary" icon={<Download size={16} />} onClick={() => notify(copy.toasts.download)}>{copy.production.package}</Button></div>}
        </Panel>
      </div>
    </div>
  );
}
