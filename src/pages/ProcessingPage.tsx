import { useState } from "react";
import { AlertTriangle, FileArchive, Plus, RefreshCw, Upload } from "lucide-react";
import { copy } from "../constants/copy";
import { Badge, Button, CheckRow, Field, Modal, PageHeader, Panel, Progress, Tabs } from "../components/UI";

export function ProcessingPage({ notify }: { notify: (message: string) => void }) {
  const [tab, setTab] = useState<string>(copy.processing.processingSets);
  const [modalOpen, setModalOpen] = useState(false);
  const [sourceType, setSourceType] = useState<"raw" | "structured">("raw");
  const [inventoryFirst, setInventoryFirst] = useState(true);
  const [selected, setSelected] = useState<string>(copy.processing.rows[1].id);

  const createSource = () => {
    setModalOpen(false);
    notify(copy.processing.createdSuccess);
  };

  return (
    <div className="page">
      <PageHeader
        title={copy.processing.title}
        subtitle={copy.processing.subtitle}
        ids={copy.processing.ids}
        actions={<Button variant="primary" icon={<Plus size={17} />} onClick={() => setModalOpen(true)}>{copy.processing.createSource}</Button>}
      />

      <div className="metric-grid metric-grid--compact">
        {copy.processing.summary.map((item) => <div className="metric" key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}
      </div>

      <Panel className="table-panel">
        <Tabs items={[copy.processing.processingSets, copy.processing.sources, copy.processing.exceptions, copy.processing.reports]} active={tab} onChange={setTab} />
        <div className="table-scroll">
          <table>
            <thead><tr>{copy.processing.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
            <tbody>
              {copy.processing.rows.map((row) => (
                <tr key={row.id} className={selected === row.id ? "is-selected" : ""} onClick={() => setSelected(row.id)}>
                  <td><strong>{row.name}</strong><small>{row.id}</small></td>
                  <td><Badge tone={row.tone}>{row.stage}</Badge></td>
                  <td><Progress value={row.progress} tone={row.tone} /></td>
                  <td>{row.docs}</td>
                  <td><Badge tone={Number(row.exceptions) > 0 ? "warning" : "success"}>{row.exceptions}</Badge></td>
                  <td>{row.owner}</td>
                  <td>{row.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="processing-detail-grid">
        <Panel title={copy.processing.selectedTitle} subtitle={copy.processing.selectedStatus}>
          <div className="stage-list">
            {copy.processing.stages.map((stage, index) => (
              <div key={stage.label}>
                <span className={index < 2 ? "is-complete" : "is-warning"}>{stage.order}</span>
                <div><strong>{stage.label}</strong><small>{stage.status}</small></div>
                <em>{stage.value}</em>
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          title={copy.processing.exceptionTitle}
          actions={<Button icon={<RefreshCw size={16} />} onClick={() => notify(copy.processing.retrySuccess)}>{copy.common.retry}</Button>}
        >
          <div className="exception-list">
            {copy.processing.exceptionRows.map((row) => (
              <div key={row.type}>
                <AlertTriangle size={18} aria-hidden="true" />
                <span><strong>{row.type}</strong><small>{row.impact}</small></span>
                <Badge tone={row.tone}>{row.count}</Badge>
                <button type="button" onClick={() => notify(copy.processing.retrySuccess)}>{row.action}</button>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Modal
        open={modalOpen}
        title={copy.processing.createSource}
        onClose={() => setModalOpen(false)}
        footer={<><Button onClick={() => setModalOpen(false)}>{copy.common.cancel}</Button><Button variant="primary" onClick={createSource} icon={<Upload size={16} />}>{copy.processing.startUpload}</Button></>}
      >
        <p className="modal-intro">{copy.processing.modalIntro}</p>
        <Field label={copy.processing.sourceName} required><input defaultValue={copy.processing.sourceNameValue} /></Field>
        <Field label={copy.processing.sourceType}>
          <div className="segmented-control">
            <button type="button" className={sourceType === "raw" ? "is-active" : ""} onClick={() => setSourceType("raw")}><FileArchive size={17} />{copy.processing.rawFiles}</button>
            <button type="button" className={sourceType === "structured" ? "is-active" : ""} onClick={() => setSourceType("structured")}><Upload size={17} />{copy.processing.structured}</button>
          </div>
        </Field>
        <button type="button" className="upload-zone" onClick={() => notify(copy.toasts.generic)}>
          <Upload size={28} aria-hidden="true" />
          <strong>{copy.processing.uploadArea}</strong>
          <small>{copy.processing.uploadHint}</small>
          <span>{copy.processing.chooseFiles}</span>
        </button>
        <div className="form-grid">
          <Field label={copy.processing.profile}><select defaultValue={copy.processing.profileValue}><option>{copy.processing.profileValue}</option></select></Field>
          <Field label={copy.processing.dedupe}><select defaultValue={copy.processing.dedupeValue}><option>{copy.processing.dedupeValue}</option></select></Field>
        </div>
        <CheckRow label={copy.processing.inventoryFirst} checked={inventoryFirst} onChange={() => setInventoryFirst(!inventoryFirst)} />
      </Modal>
    </div>
  );
}
