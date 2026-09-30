import { useState } from "react";
import { ArrowLeft, CheckCircle2, FileUp, Info, Search, Upload } from "lucide-react";
import { copy } from "../constants/copy";
import { Badge, Button, Field, PageHeader, Panel } from "../components/UI";

export function RawImportPage({ onBack, notify }: { onBack: () => void; notify: (message: string) => void }) {
  const t = copy.rawImportPage;
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [jobName, setJobName] = useState<string>(t.importJobNameValue);
  const [detectionMode, setDetectionMode] = useState<string>(t.autoDetect);
  const [previewReady, setPreviewReady] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedCustodians, setSelectedCustodians] = useState<string[]>(t.demoCustodians.map(item => item.name));

  const addDemoFiles = () => setSelectedFiles([...t.demoFiles]);
  const toggleCustodian = (name: string) => setSelectedCustodians(current => current.includes(name) ? current.filter(item => item !== name) : [...current, name]);
  const allReady = t.demoCustodians.filter(item => item.status === t.readyToImport).every(item => selectedCustodians.includes(item.name));

  return (
    <div className="page raw-import-page">
      <div className="module-toolbar">
        <Button onClick={onBack} icon={<ArrowLeft size={16} />}>{t.back}</Button>
      </div>
      <PageHeader title={t.title} subtitle={t.subtitle} ids={t.ids} />

      <Panel title={t.sourcePanel} subtitle={t.sourcePanelHint}>
        <div className="raw-import-source">
          <div className="raw-import-dropzone">
            <Upload size={24} aria-hidden="true" />
            <strong>{t.sourceTypeValue}</strong>
            <span>{t.supported}</span>
            <div className="raw-import-actions">
              <Button variant="primary" icon={<FileUp size={16} />} onClick={addDemoFiles}>{t.chooseFiles}</Button>
            </div>
          </div>
          <div className="raw-import-selection">
            <Field label={t.sourceType}><select defaultValue={t.sourceTypeValue}><option>{t.sourceTypeValue}</option></select></Field>
            <div className="raw-import-selected"><span>{selectedFiles.length ? selectedFiles.join(" · ") : t.selectedFiles}</span>{selectedFiles.length > 0 && <Badge tone="success"><CheckCircle2 size={13} /> {selectedFiles.length}</Badge>}</div>
          </div>
        </div>
      </Panel>

      <Panel title={t.processingPanel} subtitle={t.processingPanelHint}>
        <div className="processing-basic-grid">
          <Field label={t.importJobName} required><input value={jobName} onChange={event => setJobName(event.target.value)} /></Field>
          <Field label={t.processingProfile} required><select defaultValue={t.processingProfileValue}><option>{t.processingProfileValue}</option></select></Field>
          <Field label={t.destination} required><select defaultValue={t.destinationValue}>{t.destinationOptions.map(option => <option key={option}>{option}</option>)}</select></Field>
        </div>
      </Panel>

      <Panel title={t.custodianPanel} subtitle={t.custodianPanelHint}>
        <div className="raw-import-detection">
          <div className="raw-import-detection__controls">
            <Field label={t.detectionMode} required><select value={detectionMode} onChange={event => setDetectionMode(event.target.value)}><option>{t.autoDetect}</option><option>{t.existingEntities}</option><option>{t.defaultCustodian}</option></select></Field>
            {detectionMode === t.autoDetect && <><Field label={t.entityType}><select defaultValue={t.entityPerson}><option>{t.entityPerson}</option></select></Field><Field label={t.namingConvention}><select defaultValue={t.namingConventionValue}><option>{t.namingConventionValue}</option></select></Field><Field label={t.delimiter}><input defaultValue={t.delimiterValue} /></Field></>}
            {detectionMode === t.defaultCustodian && <Field label={t.custodian} required><select defaultValue={t.custodianValue}>{t.custodianOptions.map(option => <option key={option}>{option}</option>)}</select></Field>}
            <Button variant="primary" icon={<Search size={16} />} disabled={!selectedFiles.length} onClick={() => setPreviewReady(true)}>{t.analyzeSources}</Button>
          </div>
          {previewReady && <div className="raw-import-preview">
            <div className="raw-import-preview__summary"><strong>{t.previewSummary}</strong><span>{t.identifiedCustodians} <b>{t.demoCustodians.length}</b></span><span>{t.dataSourcesToCreate} <b>{selectedCustodians.length}</b></span><span>{t.totalFiles} <b>{t.totalFilesValue}</b></span></div>
            <div className="table-scroll"><table><thead><tr>{t.previewColumns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{t.demoCustodians.map(item => <tr key={item.name}><td><input type="checkbox" checked={selectedCustodians.includes(item.name)} onChange={() => toggleCustodian(item.name)} aria-label={item.name} /></td><td><strong>{item.name}</strong></td><td>{item.path}</td><td>{item.files}</td><td><Badge tone={item.tone}>{item.status}</Badge></td></tr>)}</tbody></table></div>
            <div className="raw-import-preview__footer"><span>{t.selectedCustodians} {selectedCustodians.length}</span><Button onClick={() => notify(t.editMapping)}>{t.editMapping}</Button></div>
          </div>}
        </div>
      </Panel>

      <Panel title={t.validationPanel}>
        <p className="raw-import-validation"><CheckCircle2 size={18} aria-hidden="true" />{t.validationText}</p>
        <p className="raw-import-note"><Info size={16} aria-hidden="true" />{t.passwordNote}</p>
        <div className="raw-import-footer"><Button onClick={onBack}>{t.cancel}</Button><Button variant="primary" disabled={submitted || !selectedFiles.length || !jobName.trim() || (detectionMode === t.autoDetect && (!previewReady || !allReady))} onClick={() => { setSubmitted(true); notify(t.continueNotice); }}>{t.continue}</Button></div>
      </Panel>

      {submitted && <Panel title={t.systemPanel} className="raw-import-system-panel">
        <div className="raw-import-system-grid">
          <div><strong>{t.systemBatch}</strong><span>{t.systemBatchValue}</span></div>
          <div><strong>{t.systemSources} · {selectedCustodians.length}</strong><span>{t.systemSourcesValue}</span></div>
          <div><strong>{t.systemNext}</strong><span>{t.systemNextValue}</span></div>
        </div>
        <p className="raw-import-note"><Info size={16} aria-hidden="true" />{t.systemNote}</p>
      </Panel>}
    </div>
  );
}
