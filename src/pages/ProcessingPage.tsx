import { useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, BarChart3, ChevronRight, Database, FileText, HelpCircle, KeyRound, Layers3, PackageSearch, Plus, RefreshCw, Replace, Save, Search, Settings2 } from "lucide-react";
import { copy } from "../constants/copy";
import { Badge, Button, CheckRow, Field, PageHeader, Panel, Tabs, Toggle } from "../components/UI";

type ProcessingView = "directory" | "sets" | "set-detail" | "profile" | "sources" | "password" | "inventory" | "reports" | "errors" | "files" | "replacement";
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

function Directory({ onOpen }: { onOpen: (view: ModuleId) => void }) {
  const t = copy.processing;
  return <div className="page processing-directory">
    <PageHeader title={t.directoryTitle} subtitle={t.directorySubtitle} ids={t.ids} />
    <Panel className="processing-directory-workflow" title={t.directoryStepsTitle} subtitle={t.subtitle}>
      <div className="processing-directory-steps">{t.directoryWorkflow.map((step, index) => <div className={`processing-directory-step processing-directory-step--${step.tone}`} key={step.order}>
        <div className="processing-directory-step__marker">{step.order}</div>
        <div className="processing-directory-step__copy"><strong>{step.title}</strong><small>{step.detail}</small><StatusBadge status={step.status} tone={step.tone === "success" ? "success" : step.tone === "warning" ? "warning" : "neutral"} /></div>
        {index < t.directoryWorkflow.length - 1 && <ChevronRight className="processing-directory-step__arrow" size={18} aria-hidden="true" />}
      </div>)}</div>
    </Panel>
    <Panel title={t.directoryModulesTitle}>
      <div className="processing-module-grid">{t.directoryModules.map(module => <article className="processing-module-card" key={module.id}>
        <div className="processing-module-card__icon"><ModuleIcon id={module.id} /></div>
        <div className="processing-module-card__copy"><h3>{module.title}</h3><p>{module.detail}</p><StatusBadge status={module.status} tone={module.tone === "success" ? "success" : module.tone === "warning" ? "warning" : module.tone === "danger" ? "danger" : "neutral"} /></div>
        <Button onClick={() => onOpen(module.id as ModuleId)} icon={<ChevronRight size={16} />}>{t.directoryOpen}</Button>
      </article>)}</div>
    </Panel>
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
  return <Replace {...props} />;
}

function ProcessingSetsPage({ onBack, onOpenSet, onOpenSources, onOpenProfile, notify }: { onBack: () => void; onOpenSet: (id: string) => void; onOpenSources: () => void; onOpenProfile: () => void; notify: (message: string) => void }) {
  const t = copy.processing;
  const [query, setQuery] = useState("");
  const rows = t.rows.filter(row => `${row.name} ${row.id}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="page processing-module-page">
    <div className="module-toolbar"><Button onClick={onBack} icon={<ArrowLeft size={16} />}>{t.backToDirectory}</Button><Button variant="primary" icon={<Plus size={16} />} onClick={() => onOpenSet("new")}>{t.sets.newSet}</Button><Button onClick={() => notify(t.sets.saved)}>{t.sets.quickCreate}</Button></div>
    <PageHeader title={t.sets.title} subtitle={t.sets.subtitle} ids={t.ids} />
    <div className="processing-submodule-nav"><Button className="is-active" onClick={() => undefined}>{t.sets.title}</Button><Button onClick={onOpenSources}>{t.directoryModules[1].title}</Button><Button onClick={onOpenProfile}>{t.directoryModules[2].title}</Button></div>
    <Panel className="table-panel" title={t.sets.allSets} actions={<label className="processing-search"><Search size={16} aria-hidden="true" /><input aria-label={t.sets.search} placeholder={t.sets.search} value={query} onChange={event => setQuery(event.target.value)} /></label>}>
      <div className="table-scroll"><table><thead><tr>{t.sets.columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id} className="processing-set-row" onClick={() => onOpenSet(row.id)}><td><strong>{row.name}</strong><small>{row.id}</small></td><td>{t.profileValue}</td><td>{row.id === t.rows[0].id ? t.sets.oneOfOne : t.sets.oneOfTwo}</td><td><Badge tone={row.tone}>{row.stage}</Badge></td><td><Badge tone={row.tone}>{row.progress === 100 ? t.directoryCompleted : t.directoryInProgress}</Badge></td><td>{row.updated}</td></tr>)}{!rows.length && <tr><td colSpan={t.sets.columns.length} className="admin-empty">{t.sets.noData}</td></tr>}</tbody></table></div>
    </Panel>
  </div>;
}

function ProcessingSetDetail({ setId, onBack, notify }: { setId: string; onBack: () => void; notify: (message: string) => void }) {
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
  const save = () => { notify(s.saved); };
  return <div className="page processing-set-detail">
    <div className="module-toolbar"><Button onClick={onBack} icon={<ArrowLeft size={16} />}>{t.backToDirectory}</Button><Button variant="primary" icon={<Save size={16} />} onClick={save}>{s.saveSet}</Button></div>
    <PageHeader title={name} subtitle={existing ? `${s.title} · ${existing.id}` : s.newSet} ids={t.ids} />
    <Panel title={s.basicSettings} className="processing-basic-panel">
      <div className="processing-basic-grid"><Field label={s.setName} required><input value={name} onChange={event => setName(event.target.value)} /></Field><Field label={s.profile} required><div className="processing-field-with-action"><select value={profile} onChange={event => setProfile(event.target.value)}>{s.profileOptions.map(option => <option key={option}>{option}</option>)}</select><button type="button" className="processing-settings__link" onClick={() => notify(s.addProfile)}>{s.addProfile}</button></div></Field><Field label={s.emailRecipients}><input value={recipients} onChange={event => setRecipients(event.target.value)} placeholder={s.emailRecipientsPlaceholder} /></Field></div>
    </Panel>
    <Panel title={s.statusDisplay} subtitle={s.subtitle} className="processing-set-progress-panel">
      <div className="processing-set-progress"><div className="processing-set-progress__line">{[[s.inventoryOptional, s.notStarted], [s.discover, s.notStarted], [s.publish, s.notStarted]].map((item, index) => <div className="processing-set-stage" key={item[0]}><strong>{item[0]}</strong><small>{item[1]}</small><span>{index + 1}</span></div>)}</div><div className="processing-set-counts"><div><span>{s.inventoryCount}</span><strong>{s.zero}</strong></div><div><span>{s.discoverCount}</span><strong>{s.zero}</strong></div><div><span>{s.publishCount}</span><strong>{s.zero}</strong></div><div><span>{s.totalExceptions}</span><strong>{s.zero}</strong></div></div></div>
      <div className="processing-set-sections"><details><summary>{s.inventoryOptional}</summary><p>{t.directoryWorkflow[3].detail}</p><Button onClick={() => notify(s.actionSaved)}>{s.launchInventory}</Button></details><details><summary>{s.discover}</summary><p>{t.directoryWorkflow[4].detail}</p><Button onClick={() => notify(s.actionSaved)}>{s.launchDiscover}</Button></details><details><summary>{s.publish}</summary><p>{t.directoryWorkflow[6].detail}</p><Button onClick={() => notify(s.actionSaved)}>{s.launchPublish}</Button></details></div>
    </Panel>
    <Panel className="processing-set-console" title={s.processFiles}>
      <div className="processing-set-console__buttons"><Button variant="primary" onClick={() => notify(s.actionSaved)}>{s.inventoryFiles}</Button><Button onClick={() => notify(s.actionSaved)}>{s.filterFiles}</Button><Button variant="primary" onClick={() => notify(s.actionSaved)}>{s.discoverFiles}</Button><Button disabled>{s.retryFileExceptions}</Button><Button disabled>{s.publishFiles}</Button></div>
      <div className="processing-set-console__links"><div><strong>{s.reports}</strong><button type="button" onClick={() => notify(s.inventoryReport)}>{s.inventoryReport}</button><button type="button" onClick={() => notify(s.discoveryReport)}>{s.discoveryReport}</button><button type="button" onClick={() => notify(s.allReports)}>{s.allReports}</button></div><div><strong>{s.exceptions}</strong><button type="button" onClick={() => setDataSourceTab(s.jobErrors)}>{s.jobErrors}</button><button type="button" onClick={() => notify(s.fileExceptions)}>{s.fileExceptions}</button></div></div>
    </Panel>
    <Panel className="processing-data-source-panel"><Tabs items={[s.dataSource, s.jobErrors]} active={dataSourceTab} onChange={setDataSourceTab} />{dataSourceTab === s.dataSource ? <><div className="panel__actions processing-table-actions"><Button variant="primary" icon={<Plus size={16} />} onClick={() => setDataSourceForm(true)}>{s.createDataSource}</Button><Button disabled>{s.deleteDataSource}</Button></div><div className="table-scroll"><table><thead><tr>{s.dataSourceColumns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody><tr><td><Badge tone="neutral">{s.notStarted}</Badge></td><td>{s.zeroPercent}</td><td><button className="table-link" type="button" onClick={() => setDataSourceForm(true)}>{sourcePath}</button></td><td>{custodian}</td><td>{s.numberingPrefixValue}</td><td>{timeZone}</td><td>{ocrLanguages.split("\n").map(language => <span className="processing-table-line" key={language}>{language}</span>)}</td></tr></tbody></table></div></> : <div className="processing-empty-state"><AlertTriangle size={22} aria-hidden="true" /><p>{t.exceptionRows[0].impact}</p><Button icon={<RefreshCw size={16} />} onClick={() => notify(t.retrySuccess)}>{copy.common.retry}</Button></div>}</Panel>
    {dataSourceForm && <Panel title={s.dataSource} className="processing-source-form-panel"><div className="processing-source-form"><section><h3>{s.dataSource}</h3><Field label={s.sourcePath} required><input value={sourcePath} onChange={event => setSourcePath(event.target.value)} /></Field><Field label={s.custodian} required><div className="processing-field-with-action"><input value={custodian} onChange={event => setCustodian(event.target.value)} /><Button onClick={() => notify(s.select)}>{s.select}</Button><button type="button" className="processing-settings__link" onClick={() => notify(s.add)}>{s.add}</button><button type="button" className="processing-settings__link" onClick={() => setCustodian("")}>{s.clear}</button></div></Field><Field label={s.destinationFolder} required><div className="processing-field-with-action"><input value={destination} onChange={event => setDestination(event.target.value)} /><Button onClick={() => notify(s.select)}>{s.select}</Button><button type="button" className="processing-settings__link" onClick={() => setDestination("")}>{s.clear}</button></div></Field></section><section><h3>{s.custodian} {s.advancedOptions}</h3><Field label={s.timeZone} required><div className="processing-field-with-action"><select value={timeZone} onChange={event => setTimeZone(event.target.value)}>{s.timezoneOptions.map(option => <option key={option}>{option}</option>)}</select><Button onClick={() => notify(s.select)}>{s.select}</Button><button type="button" className="processing-settings__link" onClick={() => setTimeZone("")}>{s.clear}</button></div></Field><Field label={s.ocrLanguages} required><div className="processing-field-with-action"><textarea value={ocrLanguages} onChange={event => setOcrLanguages(event.target.value)} /><Button onClick={() => notify(s.select)}>{s.select}</Button><button type="button" className="processing-settings__link" onClick={() => notify(s.add)}>{s.add}</button><button type="button" className="processing-settings__link" onClick={() => setOcrLanguages("")}>{s.clear}</button></div></Field><Field label={s.numberingPrefix} required><input defaultValue={s.numberingPrefixValue} /></Field></section><section><h3>{s.advancedOptions}</h3><div className="processing-basic-grid"><Field label={s.sourceName}><input /></Field><Field label={s.order} required><input defaultValue={s.orderValue} /></Field></div></section></div><div className="processing-source-form__actions"><Button onClick={() => setDataSourceForm(false)}>{copy.common.cancel}</Button><Button variant="primary" onClick={() => { setDataSourceForm(false); notify(t.createdSuccess); }}>{s.createDataSource}</Button></div></Panel>}
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
  const [view, setView] = useState<ProcessingView>("directory");
  const [selectedSet, setSelectedSet] = useState<string>(copy.processing.rows[1].id);
  if (view === "directory") return <Directory onOpen={next => setView(next)} />;
  if (view === "sets") return <ProcessingSetsPage onBack={() => setView("directory")} onOpenSet={id => { setSelectedSet(id); setView("set-detail"); }} onOpenSources={() => setView("sources")} onOpenProfile={() => setView("profile")} notify={notify} />;
  if (view === "set-detail") return <ProcessingSetDetail setId={selectedSet} onBack={() => setView("sets")} notify={notify} />;
  if (view === "profile") return <ProcessingProfilePage onBack={() => setView("directory")} notify={notify} />;
  return <ModulePlaceholder view={view} onBack={() => setView("directory")} />;
}
