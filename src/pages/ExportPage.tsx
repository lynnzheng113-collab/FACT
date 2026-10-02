import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Database, Download, Folder, GripVertical, PackageCheck, Plus, Rocket, Search, Trash2, X } from "lucide-react";
import { copy } from "../constants/copy";
import { Badge, Button, Field, IconButton, Panel, Toggle } from "../components/UI";
import { TransferList } from "../components/TransferList";
import { useAdministration } from "../state/Administration";
import { createId } from "../state/ids";
import { exportFilename, exportRelativePath, exportSteps, newExportConfig, readExportProfile, validExportFolder, validateExport, type ExportConfig, type ExportJob, type ExportStep } from "../state/export";
import "../styles/export.css";

const t = copy.exportPage;
const workflowIcons = { production: PackageCheck, search: Search, folder: Folder, rdo: Database };
function downloadJson(value: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function ExportDialog({ title, onClose, children, footer, compact = false }: { title: string; onClose: () => void; children: ReactNode; footer: ReactNode; compact?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const element = ref.current; element?.showModal(); return () => element?.close(); }, []);
  return <dialog ref={ref} className={`export-dialog ${compact ? "export-dialog--compact" : ""}`} aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className="export-dialog__header"><h2>{title}</h2><IconButton label={copy.common.close} onClick={onClose}><X size={18} /></IconButton></header>
    <div className="export-dialog__body">{children}</div><footer className="export-dialog__footer">{footer}</footer>
  </dialog>;
}
function RadioOptions({ label, value, options, onChange }: { label: string; value: string; options: readonly { value: string; label: string }[]; onChange: (value: string) => void }) {
  return <fieldset className="export-radios"><legend>{label}</legend><div>{options.map(option => <label key={option.value}><input type="radio" name={label} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />{option.label}</label>)}</div></fieldset>;
}
const options = (values: readonly string[]) => values.map(value => ({ value, label: value }));
function Summary({ config }: { config: ExportConfig }) {
  const workflow = t.workflows.find(item => item.id === config.workflow)!;
  const yesNo = (value: boolean) => value ? t.on : t.off;
  const rows = (items: [string, string][]) => <dl className="export-summary">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || t.unset}</dd></div>)}</dl>;
  return <div className="export-sections">
    <Panel title={t.dataSource}>{rows([[t.jobName, config.jobName], [t.source, `${workflow.label}${t.separator}${config.source}`], [t.profile, config.profile === "local" ? config.profileName : t.none]])}</Panel>
    <Panel title={t.locationFiles}>{rows([[t.express, config.express ? t.active : t.inactive], [t.locationType, config.location === "local" ? t.local : t.staging], ...(config.location === "local" && config.express ? [[t.selectFolder, config.folder] as [string, string]] : []), [t.addresses, config.addresses]])}</Panel>
    <Panel title={t.dataSettings}>{rows([[t.dataFormat, config.format], [t.encoding, config.encoding], [t.regional, config.region], [t.nested, yesNo(config.nested)]])}</Panel>
    <Panel title={t.selectedFields} subtitle={t.fieldCount(config.fields.length)}><ol className="export-field-summary">{config.fields.map(id => <li key={id}>{t.fields.find(field => field.id === id)?.label}</li>)}</ol></Panel>
    {config.workflow !== "rdo" && <Panel title={t.steps.files}>{rows([[t.nativeToggle, yesNo(config.natives)], [t.imageToggle, yesNo(config.images)], ...(config.images ? [[t.imageFormat, config.imageFormat], [t.fileType, config.fileType]] as [string, string][] : [])])}</Panel>}
    {config.workflow !== "rdo" && <>
      <Panel title={t.steps.naming}>{rows([[t.naming.namedAfter, t.naming.methods.find(item => item.value === config.namedAfter)!.label], ...(config.namedAfter === "custom" ? [[t.naming.prefix, t.naming.methods.find(item => item.value === config.namePrefix)!.label], [t.naming.spacing, t.naming.spacings.find(item => item.value === config.nameSpacing)!.label], [t.naming.field, t.naming.fields.find(item => item.value === config.nameField)!.label], ...(config.nameField === "custom" ? [[t.naming.customText, config.customName]] : [])] as [string, string][] : []), [t.naming.appendOriginal, yesNo(config.appendOriginal)], [t.naming.groupBy, t.naming.groups.find(item => item.value === config.groupBy)!.label], ...(config.natives ? [[t.naming.nativePreview, exportRelativePath(config)] as [string, string]] : []), ...(config.textAsFiles ? [[t.naming.textPreview, exportRelativePath(config, true)] as [string, string]] : [])])}</Panel>
      <Panel title={t.steps.text}>{rows([[t.textExport.toggle, yesNo(config.textAsFiles)], ...(config.textAsFiles ? [[t.textEncoding, config.textEncoding] as [string, string]] : []), [t.textPrecedence, config.textFields.map(id => t.textExport.fields.find(field => field.id === id)!.label).join(t.separator)]])}<p className="export-note">{config.textAsFiles ? t.textExport.filesHint : t.textExport.inlineHint}</p></Panel>
    </>}
    <Panel title={t.range}>{rows([[t.startLine, config.startLine]])}</Panel>
    <Panel title={t.volume}>{rows([[t.prefix, t.defaults.prefix], [t.startNumber, t.defaults.startNumber], [t.padding, t.defaults.padding], [t.maxSize, t.defaults.maxSize]])}</Panel>
  </div>;
}

export function ExportPage({ notify }: { notify: (message: string) => void }) {
  const { exportJobs, setExportJobs } = useAdministration();
  const [open, setOpen] = useState(false), [detail, setDetail] = useState<ExportJob | null>(null);
  const [filter, setFilter] = useState(""), [status, setStatus] = useState("all"), [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 500); return () => window.clearInterval(timer); }, []);
  const completed = (job: ExportJob) => now >= job.finishes;
  const rows = exportJobs.filter(job => job.config.jobName.toLowerCase().includes(filter.toLowerCase()) && (status === "all" || completed(job) === (status === "complete")));
  const date = (time: number) => new Date(time).toLocaleString(copy.userManagement.dateLocale, { hour12: false });
  return <section className="export-page" aria-label={t.title}>
    <Panel title={t.title} subtitle={t.subtitle} actions={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setOpen(true)}>{t.newJob}</Button>}>
      <div className="export-toolbar"><input aria-label={t.filter} placeholder={t.filter} value={filter} onChange={event => setFilter(event.target.value)} /><select aria-label={t.statusFilter} value={status} onChange={event => setStatus(event.target.value)}><option value="all">{copy.common.all}</option><option value="running">{t.running}</option><option value="complete">{t.completed}</option></select><span>{t.jobCount(rows.length)}</span></div>
      <div className="table-scroll"><table className="export-jobs"><thead><tr>{t.columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map(job => <tr key={job.id}>
        <td><button className="export-link" onClick={() => setDetail(job)}>{job.config.jobName}</button></td><td>{t.workflows.find(item => item.id === job.config.workflow)?.label}</td><td><Badge tone={completed(job) ? "success" : "info"}>{completed(job) ? t.completed : t.running}</Badge></td><td>{job.owner}</td><td>{date(job.started)}</td><td>{completed(job) ? date(job.finishes) : t.unset}</td><td><Button onClick={() => setDetail(job)}>{copy.common.details}</Button></td>
      </tr>)}</tbody></table>{!rows.length && <div className="export-empty"><PackageCheck size={32} /><p>{exportJobs.length ? t.noResults : t.empty}</p></div>}</div>
      <p className="export-note">{t.demo}</p>
    </Panel>
    {open && <ExportWizard onClose={() => setOpen(false)} onSubmit={config => { const started = Date.now(); setExportJobs(jobs => [{ id: createId(), config: structuredClone(config), started, finishes: started + 2500, owner: copy.access.accounts.admin.name }, ...jobs]); setNow(started); setOpen(false); notify(t.submitted); }} />}
    {detail && <ExportDialog title={t.detail} onClose={() => setDetail(null)} footer={<><Button disabled={!completed(detail)} icon={<Download size={16} />} onClick={() => downloadJson({ demo: true, notice: t.manifestNote, job: detail }, t.manifestFilename)}>{t.manifest}</Button><Button onClick={() => setDetail(null)}>{copy.common.close}</Button></>}>
      <Badge tone={completed(detail) ? "success" : "info"}>{completed(detail) ? t.completed : t.running}</Badge><p className="export-note">{t.manifestNote}</p><Summary config={detail.config} />
    </ExportDialog>}
  </section>;
}

function ExportWizard({ onClose, onSubmit }: { onClose: () => void; onSubmit: (config: ExportConfig) => void }) {
  const [config, setConfig] = useState<ExportConfig>(newExportConfig);
  const [step, setStep] = useState<ExportStep>("workflow"), [error, setError] = useState("");
  const [discard, setDiscard] = useState(false), [folderPicker, setFolderPicker] = useState(false);
  const [folderDraft, setFolderDraft] = useState(""), [folderError, setFolderError] = useState(""), [profileNotice, setProfileNotice] = useState("");
  const [textFieldToAdd, setTextFieldToAdd] = useState<string>(t.textExport.fields[1].id), [dragField, setDragField] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const profileRead = useRef(0);
  const profileInput = useRef<HTMLInputElement>(null);
  const stepHeading = useRef<HTMLDivElement>(null);
  useEffect(() => { stepHeading.current?.parentElement?.scrollTo({ top: 0 }); }, [step]);
  useEffect(() => () => { profileRead.current += 1; }, []);
  const { savedSearches } = useAdministration();
  const steps = exportSteps(config), index = steps.indexOf(step);
  const workflow = t.workflows.find(item => item.id === config.workflow)!;
  const sourceOptions = [...new Set([...workflow.sources, ...(config.workflow === "search" ? savedSearches.map(item => item.name) : [])])];
  function update<K extends keyof ExportConfig>(key: K, value: ExportConfig[K]) { setConfig(current => ({ ...current, [key]: value })); setError(""); }
  const cancel = () => step === "workflow" ? onClose() : setDiscard(true);
  const go = (next: ExportStep) => { setStep(next); setError(""); };
  const next = () => { const message = validateExport(config, step); if (message) { setError(message); return; } go(steps[index + 1]); };
  const submit = () => { for (const item of steps) { const message = validateExport(config, item); if (message) { go(item); setError(message); return; } } onSubmit({ ...config, jobName: config.jobName.trim(), addresses: config.addresses.trim(), folder: config.location === "local" && config.express ? config.folder : "", profileName: config.profile === "local" ? config.profileName : "" }); };
  const save = () => downloadJson({ kind: "relativity-prototype-export", version: 2, config }, t.profileFilename);
  const openFolder = () => { setFolderDraft(config.folder); setFolderError(""); setFolderPicker(true); };
  const confirmFolder = () => { if (!validExportFolder(folderDraft)) { setFolderError(t.folderInvalid); return; } update("folder", folderDraft.trim().replaceAll("/", "\\")); setFolderPicker(false); };
  const moveTextField = (id: string, target: number) => {
    const source = config.textFields.indexOf(id);
    if (source < 0 || target < 0 || target >= config.textFields.length) return;
    const reordered = [...config.textFields]; reordered.splice(source, 1); reordered.splice(target, 0, id); update("textFields", reordered);
  };
  const clearProfile = () => { profileRead.current += 1; setLoadingProfile(false); update("profileName", ""); setProfileNotice(""); };
  async function loadProfile(file?: File) {
    if (!file) return;
    const read = ++profileRead.current;
    setError(""); setProfileNotice(""); update("profileName", "");
    if (file.name.toLowerCase().endsWith(".ie")) { update("profileName", file.name); setProfileNotice(t.profileSelected); return; }
    setLoadingProfile(true);
    try {
      const loaded = readExportProfile(JSON.parse(await file.text()));
      if (read !== profileRead.current) return;
      if (!loaded) throw new Error();
      setConfig({ ...loaded, profile: "local", profileName: file.name }); setProfileNotice(t.profileLoaded);
    } catch { if (read === profileRead.current) setError(t.profileError); }
    finally { if (read === profileRead.current) setLoadingProfile(false); }
  }
  const select = (label: string, key: "format" | "encoding" | "region" | "imageFormat" | "fileType", values: readonly string[]) => <Field label={label} required><select aria-label={label} value={config[key]} onChange={event => update(key, event.target.value)}>{values.map(value => <option key={value}>{value}</option>)}</select></Field>;
  return <>
    <ExportDialog title={t.dialogTitle} onClose={cancel} footer={step === "workflow" ? <Button onClick={onClose}>{copy.common.close}</Button> : <><span className="export-footer-note">{step === "summary" ? t.saveHint : t.demo}</span>{step === "summary" ? <><Button variant="primary" onClick={submit}>{copy.common.export}</Button><Button onClick={save}>{t.saveSettings}</Button></> : <Button variant="primary" onClick={next} disabled={loadingProfile || Boolean((step === "files" || step === "fields") && validateExport(config, step))}>{copy.common.continue}</Button>}<Button onClick={cancel}>{copy.common.cancel}</Button></>}>
      <div className="export-step-heading" ref={stepHeading}>{index > 0 && <Button variant="quiet" icon={<ArrowLeft size={16} />} onClick={() => go(steps[index - 1])}>{copy.common.back}</Button>}<h3>{t.steps[step]}</h3></div>
      {step !== "workflow" && <nav className="export-steps" aria-label={t.dialogTitle}>{steps.filter(item => item !== "workflow").map(item => <span key={item} className={item === step ? "is-current" : steps.indexOf(item) < index ? "is-done" : ""} aria-current={item === step ? "step" : undefined}>{t.steps[item]}</span>)}</nav>}
      {error && <p role="alert" className="export-error">{error}</p>}
      <div className="export-step-content" key={step}>
        {step === "workflow" && <>
          <div className="export-mode"><Badge tone="info">{copy.common.export}</Badge></div>
          <div className="export-workflows">{t.workflows.map(item => { const Icon = workflowIcons[item.id]; return <button key={item.id} className="export-workflow" onClick={() => { setConfig(current => ({ ...current, workflow: item.id, source: "", namedAfter: item.id !== "production" && current.namedAfter === "bates" ? "control" : current.namedAfter, namePrefix: item.id === "production" ? current.namePrefix : "control", fields: (item.id === "production" ? t.fields.slice(0, 5) : item.id === "rdo" ? t.fields.filter(field => field.id === "custodian") : t.fields.filter(field => ["control", "date", "custodian", "title"].includes(field.id))).map(field => field.id) })); go("settings"); }}><Icon size={30} /><strong>{item.label}</strong><span>{item.description}</span></button>; })}</div>
          <div className="export-express"><Rocket size={23} /><strong>{t.express}</strong><Badge tone={config.express ? "success" : "neutral"}>{config.express ? t.active : t.inactive}</Badge><Button onClick={() => update("express", !config.express)}>{config.express ? t.deactivate : t.activate}</Button></div>
        </>}
        {step === "settings" && <div className="export-sections">
          <Panel title={t.dataSource}><div className="export-form">
            <Field label={t.jobName} required><input aria-label={t.jobName} value={config.jobName} onChange={event => update("jobName", event.target.value)} /></Field>
            <RadioOptions label={t.profile} value={config.profile} options={[{ value: "none", label: t.none }, { value: "local", label: t.localProfile }]} onChange={value => { clearProfile(); update("profile", value as ExportConfig["profile"]); }} />
            {config.profile === "local" && <Field label={t.uploadProfile} hint={t.profileHint} required><input ref={profileInput} hidden type="file" aria-label={t.uploadProfile} accept=".ie,.json" onChange={event => { void loadProfile(event.target.files?.[0]); event.target.value = ""; }} /><div className="export-inline">{config.profileName ? <><span>{config.profileName}</span><Button onClick={clearProfile}>{copy.common.clear}</Button></> : <Button onClick={() => profileInput.current?.click()}>{t.chooseProfile}</Button>}</div>{profileNotice && <p role="status" className="export-note">{profileNotice}</p>}</Field>}
            <Field label={workflow.label} required><select aria-label={t.source} value={config.source} onChange={event => update("source", event.target.value)}><option value="">{t.choose}</option>{[...new Set([...sourceOptions, ...(config.source ? [config.source] : [])])].map(value => <option key={value}>{value}</option>)}</select></Field>
          </div></Panel>
          <Panel title={t.locationFiles}><RadioOptions label={t.locationType} value={config.location} options={[{ value: "local", label: t.local }, { value: "staging", label: t.staging }]} onChange={value => update("location", value as ExportConfig["location"])} /><p className="export-note">{config.location === "staging" ? t.folderModeStaging : config.express ? t.folderModeLocal : t.browserDownload}</p></Panel>
          <Panel title={t.notifications}><Field label={t.addresses}><textarea aria-label={t.addresses} placeholder={t.addressPlaceholder} value={config.addresses} onChange={event => update("addresses", event.target.value)} /></Field></Panel>
        </div>}
        {step === "folder" && <Panel title={t.steps.folder}><Field label={t.folderPath} required hint={t.folderHint}><div className="export-inline"><Folder size={19} /><input aria-label={t.folderPath} placeholder={t.folderPlaceholder} value={config.folder} onChange={event => update("folder", event.target.value)} /><Button onClick={openFolder}>{config.folder ? t.changeFolder : t.select}</Button>{config.folder && <Button onClick={() => update("folder", "")}>{copy.common.clear}</Button>}</div></Field></Panel>}
        {step === "load" && <Panel title={t.dataSettings}><div className="export-form">
          <RadioOptions label={t.dataFormat} value={config.format} options={options(t.formats)} onChange={value => update("format", value)} />
          <Field label={t.startLine}><input aria-label={t.startLine} inputMode="numeric" value={config.startLine} onChange={event => update("startLine", event.target.value)} /></Field>
          {select(t.encoding, "encoding", t.encodings)}{select(t.regional, "region", t.regions)}<Toggle label={t.nested} checked={config.nested} onChange={() => update("nested", !config.nested)} />
        </div></Panel>}
        {step === "fields" && <><TransferList items={[...t.fields.filter(item => !config.fields.includes(item.id)), ...config.fields.map(id => t.fields.find(item => item.id === id)!)].map(item => ({ ...item }))} selectedIds={config.fields} onChange={value => update("fields", value)} leftTitle={t.workspaceFields} rightTitle={t.selectedFields} />{!config.fields.length && <p className="export-error">{t.errors.fields}</p>}</>}
        {step === "files" && <div className="export-sections">
          <Panel title={t.natives}><Toggle label={t.nativeToggle} checked={config.natives} onChange={() => update("natives", !config.natives)} /></Panel>
          <Panel title={config.workflow === "production" ? t.production : t.images}><div className="export-form"><Toggle label={t.imageToggle} checked={config.images} onChange={() => update("images", !config.images)} />{config.images && <><RadioOptions label={t.imageFormat} value={config.imageFormat} options={options(t.imageFormats)} onChange={value => update("imageFormat", value)} /><RadioOptions label={t.fileType} value={config.fileType} options={options(t.fileTypes)} onChange={value => update("fileType", value)} /></>}</div></Panel>
          {!config.natives && !config.images && <p className="export-error">{t.errors.files}</p>}
        </div>}
        {step === "naming" && <div className="export-sections">
          <Panel title={t.naming.title}><div className="export-form">
            <RadioOptions label={t.naming.namedAfter} value={config.namedAfter} options={t.naming.methods.filter(item => config.workflow === "production" || item.value !== "bates")} onChange={value => update("namedAfter", value as ExportConfig["namedAfter"])} />
            {config.namedAfter === "custom" && <>
              <Field label={t.naming.prefix} required><select aria-label={t.naming.prefix} value={config.namePrefix} onChange={event => update("namePrefix", event.target.value as ExportConfig["namePrefix"])}>{t.naming.methods.filter(item => item.value === "control" || config.workflow === "production" && item.value === "bates").map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
              <Field label={t.naming.spacing} required><select aria-label={t.naming.spacing} value={config.nameSpacing} onChange={event => update("nameSpacing", event.target.value)}>{t.naming.spacings.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
              <Field label={t.naming.field} required><select aria-label={t.naming.field} value={config.nameField} onChange={event => update("nameField", event.target.value as ExportConfig["nameField"])}>{t.naming.fields.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
              {config.nameField === "custom" && <Field label={t.naming.customText} required><input aria-label={t.naming.customText} placeholder={t.naming.customPlaceholder} value={config.customName} onChange={event => update("customName", event.target.value)} /></Field>}
            </>}
            <Toggle label={t.naming.appendOriginal} checked={config.appendOriginal} onChange={() => update("appendOriginal", !config.appendOriginal)} />
            <Field label={t.naming.preview} hint={t.naming.previewHint}><output className="export-preview">{exportFilename(config)}</output></Field>
          </div></Panel>
          <Panel title={t.naming.structure}><RadioOptions label={t.naming.groupBy} value={config.groupBy} options={t.naming.groups} onChange={value => update("groupBy", value as ExportConfig["groupBy"])} /><p className="export-note">{config.groupBy === "type" ? t.naming.typeHint : t.naming.workspaceHint}</p><output className="export-preview">{exportRelativePath(config)}</output></Panel>
        </div>}
        {step === "text" && <div className="export-sections">
          <Panel title={t.steps.text}><div className="export-form"><Toggle label={t.textExport.toggle} checked={config.textAsFiles} onChange={() => update("textAsFiles", !config.textAsFiles)} /><p className="export-note">{config.textAsFiles ? t.textExport.filesHint : t.textExport.inlineHint}</p>
            {config.textAsFiles && <><Field label={t.textEncoding} required><select aria-label={t.textEncoding} value={config.textEncoding} onChange={event => update("textEncoding", event.target.value)}>{t.encodings.map(value => <option key={value}>{value}</option>)}</select></Field><Field label={t.naming.textPreview}><output className="export-preview">{exportRelativePath(config, true)}</output></Field></>}
          </div></Panel>
          <Panel title={t.textPrecedence} subtitle={t.textExport.rule}>
            <div className="export-inline"><select aria-label={t.textExport.addField} value={config.textFields.includes(textFieldToAdd) ? "" : textFieldToAdd} onChange={event => setTextFieldToAdd(event.target.value)}><option value="">{t.choose}</option>{t.textExport.fields.filter(field => !config.textFields.includes(field.id)).map(field => <option key={field.id} value={field.id}>{field.label}</option>)}</select><Button disabled={!textFieldToAdd || config.textFields.includes(textFieldToAdd)} onClick={() => update("textFields", [...config.textFields, textFieldToAdd])}>{t.textExport.add}</Button></div>
            <ol className="export-precedence">{config.textFields.map((id, position) => { const field = t.textExport.fields.find(item => item.id === id)!; return <li key={id} onDragOver={event => { if (dragField) event.preventDefault(); }} onDrop={event => { event.preventDefault(); if (dragField) moveTextField(dragField, position); setDragField(null); }}>
              <span draggable title={t.textExport.drag} aria-label={t.textExport.drag} onDragStart={event => { event.dataTransfer.setData("text/plain", id); setDragField(id); }} onDragEnd={() => setDragField(null)}><GripVertical size={18} /></span><strong>{field.label}</strong>
              <IconButton label={`${t.textExport.up}${t.separator}${field.label}`} disabled={position === 0} onClick={() => moveTextField(id, position - 1)}><ArrowUp size={16} /></IconButton><IconButton label={`${t.textExport.down}${t.separator}${field.label}`} disabled={position === config.textFields.length - 1} onClick={() => moveTextField(id, position + 1)}><ArrowDown size={16} /></IconButton><IconButton label={`${t.textExport.remove}${t.separator}${field.label}`} onClick={() => update("textFields", config.textFields.filter(value => value !== id))}><Trash2 size={16} /></IconButton>
            </li>; })}</ol>
            {!config.textFields.length && <p className="export-error">{t.textExport.required}</p>}
            <div className="table-scroll"><table><thead><tr>{t.textExport.columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{t.textExport.samples.map(sample => { const selected = config.textFields.find(id => sample[id as "extracted" | "ocr"] !== null); return <tr key={sample.id}><td>{sample.id}</td><td>{sample.extracted === null ? t.textExport.nullValue : sample.extracted === "" ? t.textExport.emptyValue : sample.extracted}</td><td>{sample.ocr}</td><td>{selected ? t.textExport.fields.find(field => field.id === selected)!.label : t.textExport.noValue}</td></tr>; })}</tbody></table></div>
          </Panel>
        </div>}
        {step === "summary" && <Summary config={config} />}
      </div>
    </ExportDialog>
    {folderPicker && <ExportDialog title={t.selectFolder} compact onClose={() => setFolderPicker(false)} footer={<><Button variant="primary" onClick={confirmFolder}>{t.selectFolder}</Button><Button onClick={() => setFolderPicker(false)}>{copy.common.cancel}</Button></>}><p>{t.folderPickerHint}</p><Field label={t.folderPath} required><input aria-label={t.folderPath} placeholder={t.folderPlaceholder} value={folderDraft} onChange={event => { setFolderDraft(event.target.value); setFolderError(""); }} /></Field>{folderError && <p role="alert" className="export-error">{folderError}</p>}<RadioOptions label={t.selectFolder} value={folderDraft} options={t.folders.map(folder => ({ value: `${t.folderRoot}\\${folder}`, label: `${t.folderRoot}\\${folder}` }))} onChange={value => { setFolderDraft(value); setFolderError(""); }} /><p className="export-note">{t.folderHint}</p></ExportDialog>}
    {discard && <ExportDialog title={t.discard} compact onClose={() => setDiscard(false)} footer={<><Button onClick={() => setDiscard(false)}>{t.keepEditing}</Button><Button variant="danger" onClick={onClose}>{t.discardConfirm}</Button></>}><p>{t.discardHint}</p></ExportDialog>}
  </>;
}
