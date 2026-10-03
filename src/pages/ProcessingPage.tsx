import { useState, type KeyboardEvent, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, BarChart3, ChevronRight, Database, FileText, HelpCircle, KeyRound, Layers3, PackageSearch, Plus, RefreshCw, Save, Search, Settings2 } from "lucide-react";
import { ProcessingSupportProvider, useProcessingFileState, PasswordBankPage, ReportsPage } from "./ProcessingSupportPages";
import { copy } from "../constants/copy";
import { Badge, Button, CheckRow, Field, Modal, PageHeader, Panel, Tabs, Toggle } from "../components/UI";

type ProcessingView = "directory" | "sets" | "set-detail" | "profile" | "sources" | "password" | "inventory" | "reports" | "errors" | "files" | "file-exceptions" | "inventory-report" | "discovery-report";
type ModuleId = Exclude<ProcessingView, "directory" | "set-detail">;

function SettingRadioGroup({ name, options, value, onChange }: { name: string; options: readonly string[]; value: string; onChange: (value: string) => void }) {
  return <div className="processing-settings__radio-group">{options.map(option => <label className="processing-settings__option" key={option}><input type="radio" name={name} checked={value === option} onChange={() => onChange(option)} /><span>{option}</span></label>)}</div>;
}

function SettingSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="processing-settings-section"><header className="processing-settings-section__header"><h3>{title}</h3><HelpCircle size={18} aria-label={copy.processing.settings.helpLabel} /></header><div className="processing-settings-section__body">{children}</div></section>;
}

function StatusBadge({ status, tone }: { status: string; tone: "success" | "warning" | "danger" | "neutral" }) {
  return <Badge tone={tone}>{status}</Badge>;
}

function Directory({ onOpen, onCreateSet, onViewSets, onOpenFiles }: { onOpen: (view: ModuleId) => void; onCreateSet: () => void; onViewSets: () => void; onOpenFiles: (initialView?: string) => void }) {
  const t = copy.processing;
  const primaryModules = t.directoryModules.slice(0, 3);
  const secondaryModules = t.directoryModules.slice(3);
  const openByKeyboard = (event: KeyboardEvent, action: () => void) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); action(); } };
  const openPrimary = (id: string) => id === "sets" ? onOpen("sets") : id === "files" ? onOpenFiles() : onOpen(id as ModuleId);
  return <div className="page processing-directory">
    <PageHeader title={t.directoryTitle} subtitle={t.directorySubtitle} ids={t.ids} />
    <div className="processing-directory-layout">
      <Panel className="processing-directory-workflow" title={t.directoryPrimaryTitle} subtitle={t.directoryPrimaryHint}>
        <div className="processing-directory-primary-list">{primaryModules.map((module, index) => <article className={`processing-directory-primary-card processing-directory-primary-card--${module.id}`} key={module.id} role="button" tabIndex={0} onClick={() => openPrimary(module.id)} onKeyDown={event => openByKeyboard(event, () => openPrimary(module.id))}>
          <div className="processing-directory-step__marker">{index + 1}</div>
          <div className="processing-directory-step__copy"><strong>{module.title}</strong><small>{module.detail}</small>{module.id === "profile" && <StatusBadge status={module.status} tone="success" />}</div>
          {module.id === "sets" && <div className="processing-directory-card-actions" onClick={event => event.stopPropagation()}><Button variant="primary" onClick={onCreateSet} icon={<Plus size={16} />}>{t.sets.quickCreateSet}</Button><Button onClick={onViewSets} icon={<ChevronRight size={16} />}>{t.sets.allSets}</Button></div>}
          {module.id === "files" && <div className="processing-directory-card-actions processing-directory-file-actions" onClick={event => event.stopPropagation()}><small>{t.directoryFilesHint}</small>{[t.sets.fileExceptionsView.allFiles, t.sets.fileExceptionsView.current, t.sets.fileExceptionsView.all, t.sets.fileExceptionsView.deleted].map(view => <Button key={view} variant="quiet" onClick={() => onOpenFiles(view)}>{view}</Button>)}</div>}
          {module.id !== "sets" && module.id !== "files" && <ChevronRight className="processing-directory-primary-arrow" size={20} aria-hidden="true" />}
        </article>)}</div>
      </Panel>
      <Panel className="processing-directory-secondary" title={t.directorySecondaryTitle} subtitle={t.directorySecondaryHint}>
        <div className="processing-directory-secondary-list">{secondaryModules.map(module => <article className="processing-directory-secondary-card" key={module.id} role="button" tabIndex={0} onClick={() => onOpen(module.id as ModuleId)} onKeyDown={event => openByKeyboard(event, () => onOpen(module.id as ModuleId))}>
          <div className="processing-module-card__icon"><ModuleIcon id={module.id} /></div><div className="processing-module-card__copy"><strong>{module.title}</strong><small>{module.detail}</small></div>{module.id === "errors" && module.status && <StatusBadge status={module.status} tone="danger" />}
        </article>)}</div>
      </Panel>
    </div>
  </div>;
}

function ModuleIcon({ id }: { id: string }) {
  const props = { size: 21, "aria-hidden": true };
  if (id === "sets") return <Layers3 {...props} />;
  if (id === "sources") return <Database {...props} />;
  if (id === "profile") return <Settings2 {...props} />;
  if (id === "password") return <KeyRound {...props} />;
  if (id === "inventory") return <PackageSearch {...props} />;
  if (id === "reports") return <BarChart3 {...props} />;
  if (id === "errors") return <AlertTriangle {...props} />;
  if (id === "files") return <FileText {...props} />;
  return <FileText {...props} />;
}

function ProcessingSetsPage({ onBack, onCreateSet, onOpenSet }: { onBack: () => void; onCreateSet: () => void; onOpenSet: (id: string) => void }) {
  const t = copy.processing;
  const [query, setQuery] = useState("");
  const rows = t.rows.filter(row => `${row.name} ${row.id}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="page processing-module-page">
    <div className="module-toolbar"><Button onClick={onBack} icon={<ArrowLeft size={16} />}>{t.backToDirectory}</Button><Button variant="primary" icon={<Plus size={16} />} onClick={onCreateSet}>{t.sets.quickCreateSet}</Button></div>
    <PageHeader title={t.sets.title} subtitle={t.sets.subtitle} ids={t.ids} />
    <Panel className="table-panel" title={t.sets.allSets} actions={<label className="processing-search"><Search size={16} aria-hidden="true" /><input aria-label={t.sets.search} placeholder={t.sets.search} value={query} onChange={event => setQuery(event.target.value)} /></label>}>
      <div className="table-scroll"><table><thead><tr>{t.sets.columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id} className="processing-set-row" onClick={() => onOpenSet(row.id)}><td><strong>{row.name}</strong><small>{row.id}</small></td><td>{t.profileValue}</td><td>{row.id === t.rows[0].id ? t.sets.oneOfOne : t.sets.oneOfTwo}</td><td><Badge tone={row.tone}>{row.stage}</Badge></td><td><Badge tone={row.tone}>{row.progress === 100 ? t.directoryCompleted : t.directoryInProgress}</Badge></td><td>{row.updated}</td></tr>)}{!rows.length && <tr><td colSpan={t.sets.columns.length} className="admin-empty">{t.sets.noData}</td></tr>}</tbody></table></div>
    </Panel>
  </div>;
}

function ProcessingSetDetail({ setId, onBack, onOpenModule, notify }: { setId: string; onBack: () => void; onOpenModule: (view: ModuleId) => void; notify: (message: string) => void }) {
  const t = copy.processing;
  const s = t.sets;
  const existing = t.rows.find(row => row.id === setId);
  const [name, setName] = useState<string>(existing?.name ?? s.newSetName);
  const [profile, setProfile] = useState<string>(s.profileValue);
  const [recipients, setRecipients] = useState<string>("");
  const [dataSourceForm, setDataSourceForm] = useState(false);
  const [dataSourceTab, setDataSourceTab] = useState<string>(s.dataSource);
  const [sourcePath, setSourcePath] = useState<string>(s.sourcePathValue);
  const [custodian, setCustodian] = useState<string>(s.custodianValue);
  const [destination, setDestination] = useState<string>(s.destinationValue);
  const [timeZone, setTimeZone] = useState<string>(s.timezoneValue);
  const [ocrLanguages, setOcrLanguages] = useState<string>(s.ocrLanguageValue);
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const [destinationPickerOpen, setDestinationPickerOpen] = useState(false);
  const [custodianPickerOpen, setCustodianPickerOpen] = useState(false);
  const [custodianFormOpen, setCustodianFormOpen] = useState(false);
  const [custodianType, setCustodianType] = useState<string>(s.person);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [classification, setClassification] = useState<string>(s.custodianProcessing);
  const [custodianPrefix, setCustodianPrefix] = useState<string>(s.numberingPrefixValue);
  const [custodianNotes, setCustodianNotes] = useState<string>("");
  const [inventoryDone, setInventoryDone] = useState(false);
  const [discoverDone, setDiscoverDone] = useState(false);
  const [publishDone, setPublishDone] = useState(false);
  const runInventory = () => { setInventoryDone(true); notify(s.inventoryComplete); };
  const runDiscover = () => { setDiscoverDone(true); notify(s.discoverComplete); };
  const runPublish = () => { setPublishDone(true); notify(s.publishComplete); };
  const currentPercent = publishDone ? s.publishPercent : discoverDone ? s.discoverPercent : inventoryDone ? s.inventoryPercent : s.zeroPercent;
  const stageItems = [{ label: s.inventoryOptional, status: inventoryDone ? s.stageCompleted : s.stageNotStarted, done: inventoryDone }, { label: s.discover, status: discoverDone ? s.stageCompleted : s.stageNotStarted, done: discoverDone }, { label: s.publish, status: publishDone ? s.stageCompleted : s.stageNotStarted, done: publishDone }];
  const save = () => { notify(s.saved); };
  const saveDataSource = () => {
    if (!sourcePath) return notify(s.sourcePathRequired);
    if (!custodian) return notify(s.custodianRequired);
    if (!destination) return notify(s.destinationRequired);
    setDataSourceForm(false);
    notify(s.dataSourceSaved);
  };
  const saveCustodian = () => {
    const displayName = custodianType === s.person ? `${lastName}, ${firstName}`.replace(/^, |, $/g, "").trim() : fullName.trim();
    if (!displayName) return notify(s.custodianRequired);
    setCustodian(displayName);
    setCustodianFormOpen(false);
    setCustodianPickerOpen(false);
  };
  return <div className="page processing-set-detail">
    <div className="module-toolbar"><Button onClick={onBack} icon={<ArrowLeft size={16} />}>{t.backToDirectory}</Button><Button variant="primary" icon={<Save size={16} />} onClick={save}>{s.saveSet}</Button></div>
    <PageHeader title={name} subtitle={existing ? `${s.title} · ${existing.id}` : s.newSet} ids={t.ids} />
    <Panel title={s.basicSettings} className="processing-basic-panel">
      <div className="processing-basic-grid"><Field label={s.setName} required><input value={name} onChange={event => setName(event.target.value)} /></Field><Field label={s.profile} required><div className="processing-field-with-action"><select value={profile} onChange={event => setProfile(event.target.value)}>{s.profileOptions.map(option => <option key={option}>{option}</option>)}</select><button type="button" className="processing-settings__link" onClick={() => notify(s.addProfile)}>{s.addProfile}</button></div></Field><Field label={s.emailRecipients}><input value={recipients} onChange={event => setRecipients(event.target.value)} placeholder={s.emailRecipientsPlaceholder} /></Field></div>
    </Panel>
    <Panel title={s.statusDisplay} subtitle={s.subtitle} className="processing-set-progress-panel">
      <div className="processing-set-progress"><div className="processing-set-progress__line">{stageItems.map((item, index) => <div className={`processing-set-stage ${item.done ? "processing-set-stage--completed" : "processing-set-stage--not-started"}`} key={item.label}><strong>{item.label}</strong><small>{item.status}</small><span>{index + 1}</span></div>)}</div><div className="processing-set-counts"><div><span>{s.inventoryCount}</span><strong>{inventoryDone ? s.inventorySampleCount : s.zero}</strong></div><div><span>{s.discoverCount}</span><strong>{discoverDone ? s.discoverSampleCount : s.zero}</strong></div><div><span>{s.publishCount}</span><strong>{publishDone ? s.publishSampleCount : s.zero}</strong></div><div><span>{s.totalExceptions}</span><strong>{publishDone ? s.sampleExceptionCount : s.zero}</strong></div></div></div>
      <div className="processing-set-sections"><details><summary>{s.inventoryOptional}</summary><p>{t.directoryWorkflow[3].detail}</p></details><details><summary>{s.discover}</summary><p>{t.directoryWorkflow[4].detail}</p></details><details><summary>{s.publish}</summary><p>{t.directoryWorkflow[6].detail}</p></details></div>
    </Panel>
    <Panel className="processing-set-console" title={s.processFiles}>
      <div className="processing-set-console__buttons"><Button variant="primary" onClick={runInventory}>{s.inventoryFiles}</Button><Button onClick={() => notify(s.actionSaved)}>{s.filterFiles}</Button><Button variant="primary" onClick={runDiscover}>{s.discoverFiles}</Button><Button disabled>{s.retryFileExceptions}</Button><Button variant="primary" onClick={runPublish}>{s.publishFiles}</Button></div>
      <div className="processing-set-console__links"><div><strong>{s.reports}</strong><button type="button" onClick={() => onOpenModule("inventory-report")}>{s.inventoryReport}</button><button type="button" onClick={() => onOpenModule("discovery-report")}>{s.discoveryReport}</button><button type="button" onClick={() => onOpenModule("reports")}>{s.allReports}</button></div><div><strong>{s.exceptions}</strong><button type="button" onClick={() => onOpenModule("errors")}>{s.jobErrors}</button><button type="button" onClick={() => onOpenModule("file-exceptions")}>{s.fileExceptions}</button></div></div>
    </Panel>
    <Panel className="processing-data-source-panel"><Tabs items={[s.dataSource, s.jobErrors]} active={dataSourceTab} onChange={setDataSourceTab} />{dataSourceTab === s.dataSource ? <><div className="panel__actions processing-table-actions"><Button variant="primary" icon={<Plus size={16} />} onClick={() => setDataSourceForm(true)}>{s.createDataSource}</Button><Button disabled>{s.deleteDataSource}</Button></div><div className="table-scroll"><table><thead><tr>{s.dataSourceColumns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{s.dataSourcesView.rows.map((row, index) => <tr key={row.id}><td><Badge tone={index === 2 && !publishDone ? "warning" : publishDone ? "success" : inventoryDone ? "info" : "neutral"}>{publishDone ? s.publishResultStatus : discoverDone ? s.discoverResultStatus : inventoryDone ? s.inventoryResultStatus : s.stageNotStarted}</Badge></td><td>{publishDone ? s.publishPercent : index === 2 ? s.partialPercent : currentPercent}</td><td><button className="table-link" type="button" onClick={() => setDataSourceForm(true)}>{row.source}</button></td><td>{row.custodian}</td><td>{custodianPrefix}</td><td>{timeZone}</td><td>{ocrLanguages.split("\n").map(language => <span className="processing-table-line" key={language}>{language}</span>)}</td></tr>)}</tbody></table></div></> : <div className="processing-empty-state"><AlertTriangle size={22} aria-hidden="true" /><p>{t.exceptionRows[0].impact}</p><Button icon={<RefreshCw size={16} />} onClick={() => notify(t.retrySuccess)}>{copy.common.retry}</Button></div>}</Panel>
    {dataSourceForm && <Panel title={s.dataSource} className="processing-source-form-panel"><div className="processing-source-form"><section><h3>{s.data}</h3><p className="admin-note">{s.sourceLocationHint}</p><Field label={s.sourcePath} required><div className="processing-field-with-action"><input value={sourcePath} onChange={event => setSourcePath(event.target.value)} /><Button onClick={() => setSourcePickerOpen(true)}>{s.browse}</Button></div></Field><Field label={s.custodian} required><div className="processing-field-with-action"><input value={custodian} onChange={event => setCustodian(event.target.value)} /><Button onClick={() => setCustodianPickerOpen(true)}>{s.select}</Button><button type="button" className="processing-settings__link" onClick={() => { setCustodianFormOpen(true); setCustodianPickerOpen(false); }}>{s.add}</button><button type="button" className="processing-settings__link" onClick={() => setCustodian("")}>{s.clear}</button></div></Field><Field label={s.destinationFolder} required><div className="processing-field-with-action"><input value={destination} onChange={event => setDestination(event.target.value)} /><Button onClick={() => setDestinationPickerOpen(true)}>{s.select}</Button><button type="button" className="processing-settings__link" onClick={() => setDestination("")}>{s.clear}</button></div></Field></section><section><h3>{s.custodian} {s.advancedOptions}</h3><Field label={s.timeZone} required><div className="processing-field-with-action"><select value={timeZone} onChange={event => setTimeZone(event.target.value)}>{s.timezoneOptions.map(option => <option key={option}>{option}</option>)}</select><Button onClick={() => notify(s.select)}>{s.select}</Button><button type="button" className="processing-settings__link" onClick={() => setTimeZone("")}>{s.clear}</button></div></Field><Field label={s.ocrLanguages} required><div className="processing-field-with-action"><textarea value={ocrLanguages} onChange={event => setOcrLanguages(event.target.value)} /><Button onClick={() => notify(s.select)}>{s.select}</Button><button type="button" className="processing-settings__link" onClick={() => notify(s.add)}>{s.add}</button><button type="button" className="processing-settings__link" onClick={() => setOcrLanguages("")}>{s.clear}</button></div></Field><Field label={s.numberingPrefix} required><input value={custodianPrefix} onChange={event => setCustodianPrefix(event.target.value)} /></Field></section><section><h3>{s.advancedOptions}</h3><div className="processing-basic-grid"><Field label={s.sourceName}><input /></Field><Field label={s.order} required><input defaultValue={s.orderValue} /></Field></div></section></div><div className="processing-source-form__actions"><Button onClick={() => setDataSourceForm(false)}>{copy.common.cancel}</Button><Button variant="primary" onClick={saveDataSource}>{s.createDataSource}</Button></div></Panel>}
    <Modal open={sourcePickerOpen} title={s.selectSourcePath} onClose={() => setSourcePickerOpen(false)} footer={<Button onClick={() => setSourcePickerOpen(false)}>{copy.common.cancel}</Button>}><div className="processing-picker-list">{s.sourceLocations.map(path => <button type="button" key={path} onClick={() => { setSourcePath(path); setSourcePickerOpen(false); }}><strong>{path}</strong><small>{s.sourceLocationHint}</small></button>)}</div></Modal>
    <Modal open={destinationPickerOpen} title={s.selectDestinationFolder} onClose={() => setDestinationPickerOpen(false)} footer={<Button onClick={() => setDestinationPickerOpen(false)}>{copy.common.cancel}</Button>}><div className="processing-picker-list">{s.destinationFolders.map(folder => <button type="button" key={folder} onClick={() => { setDestination(folder); setDestinationPickerOpen(false); }}><strong>{folder}</strong></button>)}</div></Modal>
    <Modal open={custodianPickerOpen} title={s.selectCustodian} onClose={() => setCustodianPickerOpen(false)} footer={<><Button onClick={() => setCustodianPickerOpen(false)}>{copy.common.cancel}</Button><Button variant="primary" onClick={() => { setCustodianFormOpen(true); setCustodianPickerOpen(false); }}>{s.addCustodian}</Button></>}><div className="processing-picker-list">{s.custodianOptions.map(option => <button type="button" key={option} onClick={() => { setCustodian(option); setCustodianPickerOpen(false); }}><strong>{option}</strong></button>)}</div></Modal>
    <Modal open={custodianFormOpen} title={s.addCustodian} onClose={() => setCustodianFormOpen(false)} footer={<><Button onClick={() => setCustodianFormOpen(false)}>{copy.common.cancel}</Button><Button variant="primary" onClick={saveCustodian}>{s.saveCustodian}</Button></>}><div className="processing-custodian-form"><Field label={s.custodianType} required><select value={custodianType} onChange={event => setCustodianType(event.target.value)}><option>{s.person}</option><option>{s.other}</option></select></Field>{custodianType === s.person ? <div className="processing-basic-grid"><Field label={s.firstName} required><input value={firstName} onChange={event => setFirstName(event.target.value)} /></Field><Field label={s.lastName} required><input value={lastName} onChange={event => setLastName(event.target.value)} /></Field></div> : <Field label={s.fullName} required><input value={fullName} onChange={event => setFullName(event.target.value)} /></Field>}<Field label={s.classification} required><select value={classification} onChange={event => setClassification(event.target.value)}><option>{s.custodianProcessing}</option><option>{s.communicator}</option></select></Field><Field label={s.numberingPrefix}><input value={custodianPrefix} onChange={event => setCustodianPrefix(event.target.value)} /></Field><Field label={s.custodianNotes}><textarea value={custodianNotes} onChange={event => setCustodianNotes(event.target.value)} /></Field></div></Modal>
  </div>;
}

function ProcessingDataSourcesPage({ onBack }: { onBack: () => void }) {
  const t = copy.processing.sets.dataSourcesView;
  const [query, setQuery] = useState("");
  const rows = t.rows.filter(row => `${row.source} ${row.set} ${row.custodian}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="page processing-module-page processing-data-sources-page">
    <div className="module-toolbar"><Button onClick={onBack} icon={<ArrowLeft size={16} />}>{copy.processing.backToDirectory}</Button></div>
    <PageHeader title={t.title} subtitle={t.subtitle} ids={copy.processing.ids} />
    <Panel title={t.title} actions={<div className="processing-search"><Search size={16} aria-hidden="true" /><input aria-label={t.filter} placeholder={t.filter} value={query} onChange={event => setQuery(event.target.value)} /></div>}>
      <div className="processing-data-source-filter"><select defaultValue={t.filter}>{t.filterOptions.map(option => <option key={option}>{option}</option>)}</select></div>
      <div className="table-scroll processing-data-sources-table"><table><thead><tr>{t.columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><button type="button" className="table-link">{row.source}</button><small className="processing-table-line">{row.id}</small></td><td>{row.set}</td><td>{row.custodian}</td><td>{row.preprocessedSize}</td><td>{row.preprocessedCount}</td><td>{row.nested}</td><td>{row.excludedSize}</td><td>{row.excluded}</td><td>{row.filtered}</td><td>{row.discoverSubmitted}</td><td>{row.discoveredSize}</td><td>{row.discovered}</td><td>{row.publishSubmitted}</td><td>{row.deduplication}</td><td>{row.duplicate}</td><td>{row.published}</td><td>{row.publishedSize}</td><td><Badge tone={row.tone}>{row.status}</Badge></td></tr>)}{!rows.length && <tr><td colSpan={t.columns.length} className="admin-empty">{t.noData}</td></tr>}</tbody></table></div>
    </Panel>
    <Panel title={t.additionalTitle} className="processing-data-source-additional"><div className="processing-additional-grid">{t.additionalFields.map((field, index) => <div key={field}><span>{field}</span><strong>{t.additionalValues[index]}</strong></div>)}</div></Panel>
  </div>;
}

function JobErrorsPage({ onBack, notify }: { onBack: () => void; notify: (message: string) => void }) {
  const t = copy.processing.sets.jobErrorsView;
  const [activeView, setActiveView] = useState<string>(t.current);
  const [retrying, setRetrying] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phase, setPhase] = useState("");
  const [scenario, setScenario] = useState("");
  const rows = t.rows.filter(row => (activeView === t.all || row.state !== "retried") && (!phase || row.phase === phase) && (!scenario || row.scenario === scenario));
  const selected = t.rows.find(row => row.id === selectedId);
  const stateFor = (row: typeof t.rows[number]) => retrying.includes(row.id) ? "progress" : row.state;
  const toneFor = (row: typeof t.rows[number]) => stateFor(row) === "progress" ? "info" : row.state === "ready" ? "warning" : row.state === "unresolvable" ? "danger" : "neutral";
  const eligible = rows.filter(row => stateFor(row) === "ready");
  const retry = (ids: string[]) => { setRetrying(current => [...new Set([...current, ...ids])]); notify(t.retryNotice); };
  return <div className="page processing-module-page processing-error-page">
    <div className="module-toolbar"><Button onClick={onBack} icon={<ArrowLeft size={16} />}>{copy.processing.backToDirectory}</Button></div>
    <PageHeader title={t.title} subtitle={t.subtitle} ids={copy.processing.ids} />
    <details className="processing-reference"><summary>{t.sourceLabel}</summary><p>{t.coverage}</p><a href={t.sourceUrl} target="_blank" rel="noreferrer">{t.reference}</a></details>
    <Tabs items={[t.current, t.all]} active={activeView} onChange={setActiveView} />
    <Panel title={activeView} actions={<Button disabled={!eligible.length} onClick={() => retry(eligible.map(row => row.id))}>{t.retry}</Button>}>
      <div className="processing-exception-filters">
        <select value={phase} aria-label={t.phase} onChange={e => setPhase(e.target.value)}><option value="">{t.allPhases}</option>{[...new Set(t.rows.map(row => row.phase))].map(value => <option key={value}>{value}</option>)}</select>
        <select value={scenario} aria-label={t.scenario} onChange={e => setScenario(e.target.value)}><option value="">{t.allScenarios}</option>{[...new Set(t.rows.map(row => row.scenario))].map(value => <option key={value}>{value}</option>)}</select>
      </div>
      <div className="table-scroll processing-error-table"><table><thead><tr>{t.columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}>
        <td><button type="button" className="table-link" onClick={() => setSelectedId(row.id)}>{row.id}</button></td><td><Badge tone={toneFor(row)}>{t.statusLabels[stateFor(row)]}</Badge></td><td>{row.scenario}</td><td>{row.phase}</td><td>{row.message}</td><td>{row.custodian}</td><td>{row.set}</td><td>{row.source}</td><td>{row.created}</td><td>{row.republish ? t.yes : t.no}</td><td>{row.notes}</td>
      </tr>)}{!rows.length && <tr><td colSpan={t.columns.length}>{t.noData}</td></tr>}</tbody></table></div>
    </Panel>
    <Modal open={Boolean(selected)} title={t.details} onClose={() => setSelectedId(null)} footer={<Button onClick={() => setSelectedId(null)}>{copy.common.close}</Button>}>
      {selected && <div className="processing-error-detail"><div><strong>{selected.id}</strong><Badge tone={toneFor(selected)}>{t.statusLabels[stateFor(selected)]}</Badge></div><strong>{selected.scenario}</strong><p>{selected.message}</p><p>{selected.notes}</p><Field label={t.advanced}><textarea readOnly value={selected.advanced} /></Field><p>{t.reference}: {selected.reference}</p>{stateFor(selected) === "ready" && <Button variant="primary" onClick={() => retry([selected.id])}>{t.retry}</Button>}</div>}
    </Modal>
  </div>;
}

function FilesPage({ onBack, notify, initialView, exceptionsInitially = false }: { onBack: () => void; notify: (message: string) => void; initialView?: string; exceptionsInitially?: boolean }) {
  const t = copy.processing.sets.fileExceptionsView;
  type FileRow = typeof t.rows[number];
  type FileState = keyof typeof t.statusLabels;
  type Filter = { name: string; view: string; query: string; phase: string; category: string; custodian: string };
  const [activeView, setActiveView] = useState<string>(initialView ?? (exceptionsInitially ? t.current : t.allFiles));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { fileStates: states, setFileStates: setStates } = useProcessingFileState();
  const [events, setEvents] = useState<Record<string, { state: FileState; time: string }[]>>({});
  const [phase, setPhase] = useState("");
  const [category, setCategory] = useState("");
  const [custodian, setCustodian] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<string>(t.properties);
  const [dashboard, setDashboard] = useState<string>(t.dashboards[0]);
  const [filterName, setFilterName] = useState("");
  const [savedFilters, setSavedFilters] = useState<Filter[]>([]);
  const stateFor = (row: FileRow): FileState => states[row.id] ?? row.status;
  const toneFor = (row: FileRow) => stateFor(row) === "resolved" ? "success" : stateFor(row) === "resolving" ? "info" : stateFor(row) === "open" ? (row.severity === "error" ? "danger" : "warning") : "neutral";
  const exceptionView = activeView === t.current || activeView === t.all;
  const deletedView = activeView === t.deleted;
  const baseRows = t.rows.filter(row => deletedView ? row.deleted : !row.deleted && (activeView === t.current ? stateFor(row) === "open" : activeView === t.all ? row.status !== "none" : true));
  const rows = baseRows.filter(row => (!phase || row.phase === phase) && (!category || (category === "unspecified" ? row.status !== "none" && !row.category : row.category === category)) && (!custodian || row.custodian === custodian) && (!query || `${row.name} ${row.id}`.toLowerCase().includes(query.toLowerCase())));
  const selected = t.rows.find(row => row.id === selectedId);
  const selectedRows = rows.filter(row => selectedIds.includes(row.id));
  const unresolved = selectedRows.filter(row => stateFor(row) === "open");
  const ignored = selectedRows.filter(row => stateFor(row) === "ignored");
  const downloadable = unresolved.filter(row => !row.deleted);
  const publishable = selectedRows.filter(row => row.dedupe !== "duplicate" && !row.deleted && !row.container && row.published);
  const changeView = (view: string) => { setActiveView(view); setSelectedIds([]); setPhase(""); setCategory(""); };
  const updateState = (targets: readonly FileRow[], next: FileState, message: string) => {
    const time = new Date().toISOString();
    setStates(current => ({ ...current, ...Object.fromEntries(targets.map(row => [row.id, next])) }));
    setEvents(current => { const result = { ...current }; targets.forEach(row => { result[row.id] = [...(result[row.id] ?? []), { state: next, time }]; }); return result; });
    setSelectedIds([]); notify(message);
  };
  const exportCSV = () => {
    const exportRows = (selectedRows.length ? selectedRows : rows).map(row => [row.id, row.name, row.category, row.phase, t.statusLabels[stateFor(row)], row.custodian, row.source, row.message]);
    const header = [t.fileId, t.fileColumns[0], t.category, t.phase, t.columns[5], t.custodian, t.fileColumns[4], t.columns[2]];
    const csv = [header, ...exportRows].map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = t.exportName; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const openDetails = (row: FileRow) => { setSelectedId(row.id); setDetailTab(exceptionView ? t.exceptions : t.properties); };
  const categoryLabel = (row: FileRow) => row.category || (row.status === "none" ? t.dash : t.unspecified);
  const categoryInfo = selected ? t.categories.find(category => category.name === selected.category) : undefined;
  const columns = exceptionView ? t.columns : deletedView ? t.deletedColumns : t.fileColumns;
  const widgetGroups = dashboard === t.dashboards[2] ? [t.category, t.fileTypes] : dashboard === t.dashboards[1] ? [t.custodian, t.fileColumns[4], t.fileTypes] : [];
  const groupCounts = (key: string) => {
    const result: Record<string, number> = {};
    rows.forEach(row => { const value = key === t.category ? (row.status === "none" ? "" : categoryLabel(row)) : key === t.custodian ? row.custodian : key === t.fileColumns[4] ? row.source : row.extension; if (value) result[value] = (result[value] ?? 0) + 1; });
    return Object.entries(result);
  };
  return <div className="page processing-module-page processing-files-page">
    <div className="module-toolbar"><Button onClick={onBack} icon={<ArrowLeft size={16} />}>{exceptionsInitially ? t.backToSet : copy.processing.backToDirectory}</Button></div>
    <PageHeader title={t.title} subtitle={t.subtitle} ids={copy.processing.ids} />
    <Tabs items={[t.allFiles, t.current, t.all, t.deleted]} active={activeView} onChange={changeView} />
    <Panel title={activeView} actions={<select aria-label={t.dashboard} value={dashboard} onChange={e => setDashboard(e.target.value)}>{t.dashboards.map(value => <option key={value}>{value}</option>)}</select>}>
      <div className="processing-exception-filters">
        <input aria-label={t.search} placeholder={t.search} value={query} onChange={e => { setQuery(e.target.value); setSelectedIds([]); }} />
        <select value={custodian} onChange={e => { setCustodian(e.target.value); setSelectedIds([]); }} aria-label={t.custodian}>{t.custodianOptions.map((value, i) => <option value={i === 0 ? "" : value} key={value}>{value}</option>)}</select>
        {(exceptionView || deletedView) && <><select value={phase} onChange={e => { setPhase(e.target.value); setSelectedIds([]); }} aria-label={t.phase}>{t.phaseOptions.map((value, i) => <option key={value} value={i === 0 ? "" : value}>{value}</option>)}</select><select value={category} onChange={e => { setCategory(e.target.value); setSelectedIds([]); }} aria-label={t.category}><option value="">{t.allCategories}</option>{t.categories.map(item => <option value={item.name} key={item.name}>{item.name} / {item.translation}</option>)}<option value="unspecified">{t.unspecified}</option></select></>}
        <Button onClick={() => { setQuery(""); setPhase(""); setCategory(""); setCustodian(""); setSelectedIds([]); }}>{t.clear}</Button>
      </div>
      {dashboard !== t.dashboards[0] && <div className="processing-files-widgets"><div><strong>{t.containers}</strong><span>{rows.filter(row => row.container).length}</span></div>{widgetGroups.map(key => <div key={key}><strong>{key}</strong>{groupCounts(key).map(([value, count]) => <p key={value}><span>{value}</span><b>{count}</b></p>)}</div>)}</div>}
      <p className="admin-note">{t.simulation} · {t.count}: {rows.length}</p>
      <div className="table-scroll processing-error-table"><table><thead><tr><th><input type="checkbox" aria-label={copy.common.all} checked={rows.length > 0 && rows.every(row => selectedIds.includes(row.id))} onChange={e => setSelectedIds(e.target.checked ? rows.map(row => row.id) : [])} /></th>{columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}>
        <td><input type="checkbox" aria-label={row.name} checked={selectedIds.includes(row.id)} onChange={() => setSelectedIds(current => current.includes(row.id) ? current.filter(id => id !== row.id) : [...current, row.id])} /></td>
        {deletedView && <td>{row.logicalId}</td>}
        <td><button type="button" className="table-link" onClick={() => openDetails(row)}>{row.name}</button><small className="processing-table-line">{row.id}</small></td>
        {exceptionView ? <><td><Badge tone={row.severity === "error" ? "danger" : "warning"}>{t.severityLabels[row.severity]}</Badge></td><td>{row.message}</td><td>{row.phase}</td><td>{categoryLabel(row)}</td><td><Badge tone={toneFor(row)}>{t.statusLabels[stateFor(row)]}</Badge></td><td>{row.custodian}</td><td>{row.set}</td></> : deletedView ? <><td>{row.custodian}</td><td>{row.source}</td><td>{row.deleted ? t.yes : t.no}</td><td>{row.published ? t.yes : t.no}</td><td>{row.message || t.dash}{row.status !== "none" && <Badge tone={toneFor(row)}>{t.statusLabels[stateFor(row)]}</Badge>}</td></> : <><td>{row.type}</td><td>{row.extension}</td><td>{row.custodian}</td><td>{row.source}</td><td>{t.dedupeLabels[row.dedupe]}</td><td>{row.level}</td><td>{row.size}</td><td>{row.published ? t.yes : t.no}</td><td>{row.senderDomain}</td><td>{row.sortDate}</td><td>{row.path}</td></>}
      </tr>)}{!rows.length && <tr><td colSpan={columns.length + 1} className="admin-empty">{t.noData}</td></tr>}</tbody></table></div>
      <div className="processing-exception-actions"><span>{t.selected} {selectedRows.length}</span><Button onClick={exportCSV}>{t.export}</Button><Button disabled={!unresolved.length} onClick={() => updateState(unresolved, "resolving", t.retryNotice)}>{t.retry}</Button>{!deletedView && <><Button disabled={!unresolved.length} onClick={() => updateState(unresolved, "ignored", t.ignoreNotice)}>{t.ignore}</Button><Button disabled={!ignored.length} onClick={() => updateState(ignored, "open", t.undoNotice)}>{t.undoIgnore}</Button><Button disabled={!downloadable.length} onClick={() => notify(t.downloadNotice)}>{t.download}</Button><Button disabled={!publishable.length} onClick={() => notify(t.republishNotice)}>{t.republish}</Button></>}</div>
      <details className="processing-reference"><summary>{t.savedFilters}</summary><div className="processing-exception-filters"><input aria-label={t.filterName} placeholder={t.filterName} value={filterName} onChange={e => setFilterName(e.target.value)} /><Button disabled={!filterName.trim()} onClick={() => { setSavedFilters(current => [...current.filter(item => item.name !== filterName.trim()), { name: filterName.trim(), view: activeView, query, phase, category, custodian }]); setFilterName(""); notify(t.savedNotice); }}>{t.saveFilters}</Button></div>{savedFilters.length ? savedFilters.map(filter => <Button key={filter.name} onClick={() => { setActiveView(filter.view); setQuery(filter.query); setPhase(filter.phase); setCategory(filter.category); setCustodian(filter.custodian); setSelectedIds([]); }}>{filter.name}</Button>) : <p>{t.noFilters}</p>}</details>
    </Panel>
    <Modal open={Boolean(selected)} title={selected?.name ?? t.details} onClose={() => setSelectedId(null)} footer={<Button onClick={() => setSelectedId(null)}>{copy.common.close}</Button>}>
      {selected && <div className="processing-error-detail"><Tabs items={[t.properties, t.exceptions]} active={detailTab} onChange={setDetailTab} />{detailTab === t.properties ? <dl className="processing-error-meta">{[[t.fileId, selected.id], [t.storageId, selected.storageId], [t.logicalId, selected.logicalId], [t.custodian, selected.custodian], [t.fileColumns[4], selected.source], [t.fileColumns[11], selected.path]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : selected.status === "none" ? <p>{t.noException}</p> : <>
        <strong>{t.summary}</strong><Badge tone={toneFor(selected)}>{t.statusLabels[stateFor(selected)]}</Badge>{stateFor(selected) === "open" || stateFor(selected) === "resolving" ? <p>{categoryLabel(selected)} · {selected.phase}</p> : <p>{t.noActive}</p>}
        <p>{selected.message}</p><strong>{t.guidance}</strong><p>{selected.guidance}</p><p>{t.consoleRetry}: {categoryInfo?.consoleRetry === true ? t.yes : categoryInfo?.consoleRetry === false ? t.no : t.notListed}</p><p>{t.reference}: {selected.reference}</p>
        <strong>{t.history}</strong><ul><li>{selected.occurred} · {t.statusLabels[selected.status]} · {selected.phase} · {categoryLabel(selected)} · {selected.message}</li>{(events[selected.id] ?? []).map((event, index) => <li key={`${event.time}-${index}`}>{event.time} · {t.statusLabels[event.state]}</li>)}</ul>
      </>}</div>}
    </Modal>
  </div>;
}


function ProcessingProfilePage({ onBack, notify }: { onBack: () => void; notify: (message: string) => void }) {
  const t = copy.processing.settings;
  const [numberingType, setNumberingType] = useState<string>(t.numbering.numberingTypes[0]);
  const [numberingPrefix, setNumberingPrefix] = useState<string>("REL");
  const [numberOfDigits, setNumberOfDigits] = useState<string>(t.numbering.digitOptions[1]);
  const [parentChildNumbering, setParentChildNumbering] = useState<string>(t.numbering.parentChildOptions[0]);
  const [delimiter, setDelimiter] = useState<string>(t.numbering.delimiterOptions[0]);
  const [denist, setDenist] = useState<string>("");
  const [denistMode, setDenistMode] = useState<string>(t.inventory.denistModes[0]);
  const [ocrLanguage, setOcrLanguage] = useState<string>(t.inventory.ocrLanguageOptions[0]);
  const [timeZone, setTimeZone] = useState<string>(t.inventory.timezoneOptions[0]);
  const [includeExclude, setIncludeExclude] = useState<string>("");
  const [inventoryMode, setInventoryMode] = useState<string>(t.inventory.modes[0]);
  const [fileExtensions, setFileExtensions] = useState<string>(t.inventory.fileExtensionsValue);
  const [inclusionOption, setInclusionOption] = useState<string>(t.inventory.inclusionOptions[0]);
  const [extractChildren, setExtractChildren] = useState<string>("");
  const [extractExceptions, setExtractExceptions] = useState<Record<string, boolean>>({ embeddedImages: false, embeddedObjects: false, emailInlineImages: false });
  const [rollUpImageText, setRollUpImageText] = useState<string>("");
  const [emailOutput, setEmailOutput] = useState<string>(t.extraction.emailOutputOptions[0]);
  const [excelTextMethod, setExcelTextMethod] = useState<string>(t.extraction.textExtractionOptions[0]);
  const [headerFooter, setHeaderFooter] = useState<string>(t.extraction.headerFooterOptions[0]);
  const [powerpointTextMethod, setPowerpointTextMethod] = useState<string>(t.extraction.textExtractionOptions[0]);
  const [wordTextMethod, setWordTextMethod] = useState<string>(t.extraction.textExtractionOptions[0]);
  const [ocr, setOcr] = useState<string>("");
  const [ocrAccuracy, setOcrAccuracy] = useState<string>(t.extraction.accuracyOptions[0]);
  const [ocrSeparator, setOcrSeparator] = useState<string>("");
  const [sliceBy, setSliceBy] = useState<string>(t.shortMessage.sliceOptions[3]);
  const [shortMessageChannels, setShortMessageChannels] = useState<Record<string, boolean>>({ slack: true, downloadAttachments: true, teams: true, cellebrite: true });
  const [imports, setImports] = useState<Record<string, boolean>>({ sms: true, chat: true, media: true, email: true, other: true });
  const [deduplicationMethod, setDeduplicationMethod] = useState<string>("");
  const [propagateDeduplication, setPropagateDeduplication] = useState<string>("");
  const [autoPublish, setAutoPublish] = useState<string>("");
  const [destinationFolder, setDestinationFolder] = useState<string>(t.publish.destinationOptions[0]);
  const [useSourceFolder, setUseSourceFolder] = useState<string>("");
  return <div className="page processing-module-page"><div className="module-toolbar"><Button onClick={onBack} icon={<ArrowLeft size={16} />}>{copy.processing.backToDirectory}</Button></div><PageHeader title={t.title} subtitle={t.subtitle} ids={copy.processing.ids} /><Panel className="processing-settings-panel" title={t.title} subtitle={t.subtitle} actions={<Button variant="primary" icon={<Save size={16} />} onClick={() => notify(t.saved)}>{t.save}</Button>}><div className="processing-settings">
    <SettingSection title={t.numbering.title}><div className="processing-settings__row"><Field label={t.numbering.numberingType}><SettingRadioGroup name="numbering-type" options={t.numbering.numberingTypes} value={numberingType} onChange={setNumberingType} /></Field></div><div className="processing-settings__row"><Field label={t.numbering.defaultPrefix}><input value={numberingPrefix} onChange={event => setNumberingPrefix(event.target.value)} /></Field></div><div className="processing-settings__row"><Field label={t.numbering.numberOfDigits}><select value={numberOfDigits} onChange={event => setNumberOfDigits(event.target.value)}>{t.numbering.digitOptions.map(option => <option key={option}>{option}</option>)}</select></Field></div><div className="processing-settings__row"><Field label={t.numbering.parentChild}><SettingRadioGroup name="parent-child-numbering" options={t.numbering.parentChildOptions} value={parentChildNumbering} onChange={setParentChildNumbering} /></Field></div><div className="processing-settings__row"><Field label={t.numbering.delimiter}><select value={delimiter} onChange={event => setDelimiter(event.target.value)}>{t.numbering.delimiterOptions.map(option => <option key={option}>{option}</option>)}</select></Field></div></SettingSection>
    <SettingSection title={t.inventory.title}><h4 className="processing-settings__subheading">{t.inventory.denistSettings}</h4><div className="processing-settings__row"><Field label={t.inventory.denist}><SettingRadioGroup name="denist" options={[t.yes, t.no]} value={denist} onChange={setDenist} /></Field></div><div className="processing-settings__row"><Field label={t.inventory.denistMode}><SettingRadioGroup name="denist-mode" options={t.inventory.denistModes} value={denistMode} onChange={setDenistMode} /></Field></div><h4 className="processing-settings__subheading">{t.inventory.defaultCustodian}</h4><div className="processing-settings__row"><Field label={t.inventory.ocrLanguages}><div className="processing-settings__inline"><select value={ocrLanguage} onChange={event => setOcrLanguage(event.target.value)}>{t.inventory.ocrLanguageOptions.map(option => <option key={option}>{option}</option>)}</select><button type="button" className="processing-settings__link" onClick={() => notify(t.saved)}>{t.inventory.add}</button></div></Field></div><div className="processing-settings__row"><Field label={t.inventory.timezone}><select value={timeZone} onChange={event => setTimeZone(event.target.value)}>{t.inventory.timezoneOptions.map(option => <option key={option}>{option}</option>)}</select></Field></div><h4 className="processing-settings__subheading">{t.inventory.inclusion}</h4><div className="processing-settings__row"><Field label={t.inventory.includeExclude}><SettingRadioGroup name="include-exclude" options={[t.yes, t.no]} value={includeExclude} onChange={setIncludeExclude} /></Field></div><div className="processing-settings__row"><Field label={t.inventory.mode}><SettingRadioGroup name="inventory-mode" options={t.inventory.modes} value={inventoryMode} onChange={setInventoryMode} /></Field></div><div className="processing-settings__row"><Field label={t.inventory.fileExtensions}><textarea value={fileExtensions} onChange={event => setFileExtensions(event.target.value)} /></Field></div><div className="processing-settings__row"><Field label={t.inventory.required}><SettingRadioGroup name="inclusion-option" options={t.inventory.inclusionOptions} value={inclusionOption} onChange={setInclusionOption} /></Field></div></SettingSection>
    <SettingSection title={t.extraction.title}><div className="processing-settings__row"><Field label={t.extraction.extractChildren}><SettingRadioGroup name="extract-children" options={[t.yes, t.no]} value={extractChildren} onChange={setExtractChildren} /></Field></div><div className="processing-settings__row"><Field label={t.extraction.doNotExtract}><div className="processing-settings__checks"><CheckRow label={t.extraction.embeddedImages} checked={extractExceptions.embeddedImages} onChange={() => setExtractExceptions(current => ({ ...current, embeddedImages: !current.embeddedImages }))} /><CheckRow label={t.extraction.embeddedObjects} checked={extractExceptions.embeddedObjects} onChange={() => setExtractExceptions(current => ({ ...current, embeddedObjects: !current.embeddedObjects }))} /><CheckRow label={t.extraction.emailInlineImages} checked={extractExceptions.emailInlineImages} onChange={() => setExtractExceptions(current => ({ ...current, emailInlineImages: !current.emailInlineImages }))} /></div></Field></div><div className="processing-settings__row"><Field label={t.extraction.rollUpImageText}><SettingRadioGroup name="roll-up-image-text" options={[t.yes, t.no]} value={rollUpImageText} onChange={setRollUpImageText} /></Field></div><div className="processing-settings__row"><Field label={t.extraction.emailOutput}><select value={emailOutput} onChange={event => setEmailOutput(event.target.value)}>{t.extraction.emailOutputOptions.map(option => <option key={option}>{option}</option>)}</select></Field></div><div className="processing-settings__row"><Field label={t.extraction.textExtraction}><select value={excelTextMethod} onChange={event => setExcelTextMethod(event.target.value)}>{t.extraction.textExtractionOptions.map(option => <option key={option}>{option}</option>)}</select></Field></div><div className="processing-settings__row"><Field label={t.extraction.headerFooter}><SettingRadioGroup name="header-footer" options={t.extraction.headerFooterOptions} value={headerFooter} onChange={setHeaderFooter} /></Field></div><div className="processing-settings__row"><Field label={t.extraction.powerpointExtraction}><select value={powerpointTextMethod} onChange={event => setPowerpointTextMethod(event.target.value)}>{t.extraction.textExtractionOptions.map(option => <option key={option}>{option}</option>)}</select></Field></div><div className="processing-settings__row"><Field label={t.extraction.wordExtraction}><select value={wordTextMethod} onChange={event => setWordTextMethod(event.target.value)}>{t.extraction.textExtractionOptions.map(option => <option key={option}>{option}</option>)}</select></Field></div><div className="processing-settings__row"><Field label={t.extraction.ocr}><SettingRadioGroup name="ocr" options={t.extraction.enabledDisabled} value={ocr} onChange={setOcr} /></Field></div><div className="processing-settings__row"><Field label={t.extraction.ocrAccuracy}><select value={ocrAccuracy} onChange={event => setOcrAccuracy(event.target.value)}>{t.extraction.accuracyOptions.map(option => <option key={option}>{option}</option>)}</select></Field></div><div className="processing-settings__row"><Field label={t.extraction.ocrSeparator}><SettingRadioGroup name="ocr-separator" options={t.extraction.enabledDisabled} value={ocrSeparator} onChange={setOcrSeparator} /></Field></div></SettingSection>
    <SettingSection title={t.shortMessage.title}><div className="processing-settings__row"><Field label={t.shortMessage.sliceBy}><select value={sliceBy} onChange={event => setSliceBy(event.target.value)}>{t.shortMessage.sliceOptions.map(option => <option key={option}>{option}</option>)}</select></Field></div><div className="processing-settings__toggle-grid"><Toggle label={t.shortMessage.slack} checked={shortMessageChannels.slack} onChange={() => setShortMessageChannels(current => ({ ...current, slack: !current.slack }))} /><Toggle label={t.shortMessage.downloadAttachments} checked={shortMessageChannels.downloadAttachments} onChange={() => setShortMessageChannels(current => ({ ...current, downloadAttachments: !current.downloadAttachments }))} /><Toggle label={t.shortMessage.teams} checked={shortMessageChannels.teams} onChange={() => setShortMessageChannels(current => ({ ...current, teams: !current.teams }))} /><Toggle label={t.shortMessage.cellebrite} checked={shortMessageChannels.cellebrite} onChange={() => setShortMessageChannels(current => ({ ...current, cellebrite: !current.cellebrite }))} /></div><div className="processing-settings__row"><Field label={t.shortMessage.import}><div className="processing-settings__checks">{t.shortMessage.importOptions.map((option, index) => { const key = ["sms", "chat", "media", "email", "other"][index]; return <CheckRow key={option} label={option} checked={imports[key]} onChange={() => setImports(current => ({ ...current, [key]: !current[key] }))} />; })}</div></Field></div></SettingSection>
    <SettingSection title={t.deduplication.title}><div className="processing-settings__row"><Field label={t.deduplication.method}><SettingRadioGroup name="deduplication-method" options={t.deduplication.methodOptions} value={deduplicationMethod} onChange={setDeduplicationMethod} /></Field></div><div className="processing-settings__row"><Field label={t.deduplication.propagate}><SettingRadioGroup name="propagate-deduplication" options={[t.yes, t.no]} value={propagateDeduplication} onChange={setPropagateDeduplication} /></Field></div></SettingSection>
    <SettingSection title={t.publish.title}><h4 className="processing-settings__subheading">{t.publish.autoPublish}</h4><div className="processing-settings__row"><Field label={t.publish.autoPublishSet}><SettingRadioGroup name="auto-publish" options={[t.yes, t.no]} value={autoPublish} onChange={setAutoPublish} /></Field></div><h4 className="processing-settings__subheading">{t.publish.destinationStructure}</h4><div className="processing-settings__row"><Field label={t.publish.destinationFolder}><select value={destinationFolder} onChange={event => setDestinationFolder(event.target.value)}>{t.publish.destinationOptions.map(option => <option key={option}>{option}</option>)}</select></Field></div><div className="processing-settings__row"><Field label={t.publish.useSource}><SettingRadioGroup name="use-source-folder" options={[t.yes, t.no]} value={useSourceFolder} onChange={setUseSourceFolder} /></Field></div></SettingSection>
  </div></Panel></div>;
}

function ModulePlaceholder({ view, onBack }: { view: ModuleId; onBack: () => void }) {
  const module = copy.processing.directoryModules.find(item => item.id === view);
  const title = module?.title ?? copy.processing.modulePlaceholder.titleSuffix;
  return <div className="page processing-module-page"><div className="module-toolbar"><Button onClick={onBack} icon={<ArrowLeft size={16} />}>{copy.processing.backToDirectory}</Button></div><PageHeader title={title} subtitle={module?.detail ?? copy.processing.modulePlaceholder.subtitle} ids={copy.processing.ids} /><Panel title={copy.processing.modulePlaceholder.titleSuffix}><div className="processing-empty-state"><ModuleIcon id={view} /><p>{copy.processing.modulePlaceholder.empty}</p></div></Panel></div>;
}

export function ProcessingPage({ notify }: { notify: (message: string) => void }) {
  return <ProcessingSupportProvider><ProcessingContent notify={notify} /></ProcessingSupportProvider>;
}

function ProcessingContent({ notify }: { notify: (message: string) => void }) {
  const [view, setView] = useState<ProcessingView>("directory");
  const [selectedSet, setSelectedSet] = useState<string>(copy.processing.rows[1].id);
  const [initialFileView, setInitialFileView] = useState<string | undefined>(undefined);
  const createSet = () => { setSelectedSet("new"); setView("set-detail"); };
  const viewSets = () => setView("sets");
  if (view === "directory") return <Directory onOpen={next => setView(next)} onCreateSet={createSet} onViewSets={viewSets} onOpenFiles={initialView => { setInitialFileView(initialView); setView("files"); }} />;
  if (view === "sets") return <ProcessingSetsPage onBack={() => setView("directory")} onCreateSet={createSet} onOpenSet={id => { setSelectedSet(id); setView("set-detail"); }} />;
  if (view === "set-detail") return <ProcessingSetDetail setId={selectedSet} onBack={() => setView("sets")} onOpenModule={next => setView(next)} notify={notify} />;
  if (view === "sources") return <ProcessingDataSourcesPage onBack={() => setView("directory")} />;
  if (view === "errors") return <JobErrorsPage onBack={() => setView("directory")} notify={notify} />;
  if (view === "files") return <FilesPage initialView={initialFileView} onBack={() => { setInitialFileView(undefined); setView("directory"); }} notify={notify} />;
  if (view === "file-exceptions") return <FilesPage exceptionsInitially onBack={() => setView("set-detail")} notify={notify} />;
  if (view === "profile") return <ProcessingProfilePage onBack={() => setView("directory")} notify={notify} />;
  if (view === "password") return <PasswordBankPage onBack={() => setView("directory")} notify={notify} />;
  if (view === "reports" || view === "inventory-report" || view === "discovery-report") return <ReportsPage onBack={() => setView("directory")} notify={notify} initialReport={view === "discovery-report" ? "discovered-custodian" : "inventory-summary"} />;
  return <ModulePlaceholder view={view} onBack={() => setView("directory")} />;
}

