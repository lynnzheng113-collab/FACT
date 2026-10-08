import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, GitBranch, Network, Play, RefreshCw, Users } from "lucide-react";
import { copy, type PageId } from "../constants/copy";
import { SearchTermReport } from "./SearchTermReport";
import { Badge, Button, CheckRow, Field, Modal, PageHeader, Panel, Progress, Tabs } from "../components/UI";
import { useAdministration } from "../state/Administration";

export function AnalyticsPage({ notify, navigate }: { notify: (message: string) => void; navigate: (page: PageId) => void }) {
  const { savedSearches, dtSearchIndexes: indexes, setDtSearchIndexes: setIndexes, activeIndexId, setActiveIndexId, setDocumentView } = useAdministration();
  const searchableSetOptions = [
    ...copy.analytics.searchableSets.map(label => ({ label, id: undefined, type: "static" as const })),
    ...savedSearches.map(search => ({ label: `${search.name}${copy.analytics.savedSearchOptionSuffix}`, id: search.id, type: "savedSearch" as const }))
  ];
  const [tab, setTab] = useState<string>(copy.modules.dtsearch);
  const [indexView, setIndexView] = useState<"list" | "form" | "detail">("list");
  const selectedIndexId = activeIndexId ?? indexes[0]?.id ?? "idx-1";
  const [searchableSetOpen, setSearchableSetOpen] = useState(false);
  const [buildConfirm, setBuildConfirm] = useState<{ indexId: string; incremental: boolean } | null>(null);
  const [activateOnComplete, setActivateOnComplete] = useState(true);
  const [buildTargetId, setBuildTargetId] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; order: string; searchableSet: string; searchableSetId?: string; searchableSetType: "static" | "savedSearch"; email: boolean; skipMalicious: boolean; defaultSubindex: boolean }>({ name: copy.analytics.indexName, order: copy.analytics.indexDefaultOrder, searchableSet: String(copy.analytics.searchableSets[0]), searchableSetType: "static", email: true, skipMalicious: true, defaultSubindex: true });
  const selectedIndex = indexes.find(index => index.id === selectedIndexId) ?? indexes[0];
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!buildTargetId) return;
    const timer = window.setInterval(() => {
      setIndexes(current => current.map(index => {
        if (index.id !== buildTargetId) return index;
        const nextProgress = Math.min(100, index.progress + 20);
        const nextStage = nextProgress >= 100 ? 4 : nextProgress >= 75 ? 3 : nextProgress >= 50 ? 2 : nextProgress >= 25 ? 1 : 0;
        if (nextProgress >= 100) {
          window.clearInterval(timer);
          setBuildTargetId(null);
          setRunning(false);
          return { ...index, status: activateOnComplete ? copy.analytics.indexed : copy.analytics.builtInactive, progress: 100, stage: 4, documents: copy.analytics.indexDocumentCount, updated: copy.analytics.buildCompleted };
        }
        return { ...index, status: copy.analytics.inProgress, progress: nextProgress, stage: nextStage, documents: String(Math.round(Number(copy.analytics.indexDocumentCount.replace(",", "")) * nextProgress / 100)), updated: copy.analytics.inProgress };
      }));
    }, 700);
    return () => window.clearInterval(timer);
  }, [activateOnComplete, buildTargetId, setIndexes]);

  const openDetail = (id: string) => { setActiveIndexId(id); setIndexView("detail"); };
  const saveIndex = (andNew = false) => {
    const id = `idx-${Date.now()}`;
    const row = { id, name: form.name || copy.analytics.indexName, searchableSet: form.searchableSet, searchableSetId: form.searchableSetId, searchableSetType: form.searchableSetType, status: copy.analytics.notStarted, documents: copy.analytics.indexMetricZero, updated: copy.analytics.notStarted, order: form.order, email: "admin@example.com", skipMalicious: form.skipMalicious, defaultSubindex: form.defaultSubindex, progress: 0, stage: 0 };
    setIndexes(current => [...current, row]);
    setActiveIndexId(id);
    notify(copy.analytics.indexSaved);
    if (andNew) setForm({ ...form, name: "", order: String(indexes.length + 2) }); else setIndexView("detail");
  };
  const requestBuild = (incremental = false, indexId = selectedIndexId) => {
    setActiveIndexId(indexId);
    setIndexView("detail");
    setBuildConfirm({ indexId, incremental });
  };
  const runIndex = (incremental = false, indexId = selectedIndexId) => {
    const target = indexes.find(index => index.id === indexId);
    if (!target) return;
    setRunning(true);
    setBuildTargetId(target.id);
    setIndexes(current => current.map(index => index.id === target.id ? { ...index, status: copy.analytics.inProgress, progress: 0, stage: 0, documents: copy.analytics.indexMetricZero, updated: copy.analytics.inProgress } : index));
    setBuildConfirm(null);
    notify(copy.analytics.jobSubmitted);
  };
  const cancelBuild = () => {
    if (!buildTargetId) return;
    setBuildTargetId(null);
    setRunning(false);
    setIndexes(current => current.map(index => index.id === buildTargetId ? { ...index, status: copy.analytics.buildCanceled, updated: copy.analytics.buildCanceled } : index));
    notify(copy.analytics.buildCanceled);
  };
  const activateIndex = () => {
    if (!selectedIndex) return;
    setRunning(false);
    setIndexes(current => current.map(index => index.id === selectedIndex.id ? { ...index, status: copy.analytics.indexed, progress: 100, stage: 4, documents: copy.analytics.indexDocumentCount, updated: copy.analytics.buildCompleted } : index));
    notify(copy.analytics.buildCompleted);
  };
  const subindexTotal = Number(copy.analytics.subindexTotal);
  const subindexCompleted = selectedIndex ? Math.round(subindexTotal * selectedIndex.progress / 100) : 0;
  const subindexIndexing = running && subindexCompleted < subindexTotal ? 1 : 0;
  const subindexPending = Math.max(0, subindexTotal - subindexCompleted - subindexIndexing);

  return <div className="page">
    <PageHeader title={copy.analytics.title} subtitle={copy.analytics.subtitle} ids={copy.analytics.ids} />
    <Panel className="analytics-index">
      <Tabs items={[copy.modules.dtsearch, copy.modules.report, copy.analytics.structured, copy.analytics.communication]} active={tab} onChange={setTab} />
      {tab === copy.modules.dtsearch && <div className="analytics-flow">
        {indexView === "list" && <Panel title={copy.analytics.indexList} subtitle={copy.analytics.indexListHint} actions={<Button variant="primary" icon={<Play size={16} />} onClick={() => setIndexView("form")}>{copy.analytics.newIndex}</Button>} className="analytics-subpanel">
          <div className="table-scroll"><table><thead><tr>{copy.analytics.indexColumns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{indexes.map(index => <tr key={index.id}><td><button type="button" className="link-button" onClick={() => openDetail(index.id)}><strong>{index.name}</strong></button></td><td>{index.searchableSet}</td><td><Badge tone={index.status === copy.analytics.indexed ? "success" : index.status === copy.analytics.inProgress ? "info" : index.status === copy.analytics.builtInactive ? "warning" : "neutral"}>{index.status}</Badge></td><td>{index.documents}</td><td>{index.updated}</td><td><div className="inline-actions"><Button onClick={() => openDetail(index.id)}>{copy.analytics.indexActionView}</Button><Button onClick={() => requestBuild(true, index.id)}>{copy.analytics.indexActionBuild}</Button></div></td></tr>)}</tbody></table></div>
        </Panel>}

        {indexView === "form" && <Panel title={copy.analytics.newIndex} subtitle={copy.analytics.indexNewHint} className="analytics-subpanel"><div className="analytics-form-grid">
          <Field label={copy.analytics.indexNameLabel} required><input value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} /></Field>
          <Field label={copy.analytics.indexOrder} hint={copy.analytics.indexOrderHint}><input value={form.order} onChange={event => setForm(current => ({ ...current, order: event.target.value }))} /></Field>
          <Field label={copy.analytics.searchableSet} required><button type="button" className="select-button" onClick={() => setSearchableSetOpen(true)}>{form.searchableSet}<span>⌄</span></button></Field>
          <div className="analytics-option-card"><CheckRow label={copy.analytics.emailNotification} checked={form.email} onChange={() => setForm(current => ({ ...current, email: !current.email }))} /><p>{copy.analytics.emailNotificationHint}</p></div>
          <div className="analytics-option-card"><CheckRow label={copy.analytics.skipMalicious} checked={form.skipMalicious} onChange={() => setForm(current => ({ ...current, skipMalicious: !current.skipMalicious }))} /><p>{copy.analytics.skipMaliciousHint}</p></div>
          <div className="analytics-option-card"><CheckRow label={copy.analytics.useDefaultSubindex} checked={form.defaultSubindex} onChange={() => setForm(current => ({ ...current, defaultSubindex: !current.defaultSubindex }))} /><p>{copy.analytics.useDefaultSubindexHint}</p></div>
        </div><div className="panel-actions-bottom"><Button onClick={() => setIndexView("list")}>{copy.analytics.cancelIndex}</Button><Button onClick={() => saveIndex(true)}>{copy.analytics.saveAndNew}</Button><Button variant="primary" onClick={() => saveIndex(false)}>{copy.analytics.saveAndBack}</Button></div></Panel>}

        {indexView === "detail" && selectedIndex && <Panel title={selectedIndex.name} subtitle={copy.analytics.indexDetailHint} actions={<><Button onClick={() => setIndexView("list")}>{copy.analytics.indexList}</Button><Button variant="primary" onClick={() => requestBuild(false)} icon={<RefreshCw size={16} />} disabled={running}>{copy.analytics.buildIndex}</Button></>} className="analytics-subpanel">
          <div className="analytics-detail-head"><div><span className="field__label">{copy.analytics.searchableSet}</span><strong>{selectedIndex.searchableSet}</strong>{selectedIndex.searchableSet.endsWith(copy.analytics.savedSearchOptionSuffix) && <small className="analytics-source-note">{copy.documents.indexSavedSearchSource}</small>}</div><div><span className="field__label">{copy.analytics.indexJobStatus}</span><Badge tone={selectedIndex.status === copy.analytics.indexed ? "success" : selectedIndex.status === copy.analytics.inProgress ? "info" : "neutral"}>{selectedIndex.status}</Badge></div><div><span className="field__label">{copy.analytics.indexingProgress}</span><Progress value={selectedIndex.progress} /></div></div>
          <div className="analytics-stage-panel"><h3>{copy.analytics.indexStageTitle}</h3><div className="analytics-stage-list">{[copy.analytics.stageInitializing, copy.analytics.stagePopulating, copy.analytics.stageIndexing, copy.analytics.stageFinalizing].map((stage, index) => <div key={stage} className={selectedIndex.stage >= 4 || index < selectedIndex.stage ? "is-done" : index === selectedIndex.stage && running ? "is-current" : ""}><span>{selectedIndex.stage >= 4 || index < selectedIndex.stage ? <CheckCircle2 size={17} /> : <span className="stage-number">{index + 1}</span>}</span><strong>{stage}</strong><small>{selectedIndex.stage >= 4 || index < selectedIndex.stage ? copy.common.completed : index === selectedIndex.stage && running ? copy.analytics.inProgress : copy.analytics.notStarted}</small></div>)}</div></div>
          <div className="analytics-metrics"><h3>{copy.analytics.indexMetrics}</h3><div><span>{copy.analytics.documentsIndexed}</span><strong>{selectedIndex.documents}</strong></div><div><span>{copy.analytics.documentsError}</span><strong>{copy.analytics.indexMetricZero}</strong></div><div><span>{copy.analytics.documentsSkipped}</span><strong>{selectedIndex.skipMalicious ? copy.analytics.indexSkippedCount : copy.analytics.indexMetricZero}</strong></div><div><span>{copy.analytics.subindexesPending}</span><strong>{subindexPending}</strong></div><div><span>{copy.analytics.subindexesIndexing}</span><strong>{subindexIndexing}</strong></div><div><span>{copy.analytics.subindexesCompleted}</span><strong>{subindexCompleted}</strong></div><div><span>{copy.analytics.subindexesErrored}</span><strong>{copy.analytics.subindexErrorCount}</strong></div></div>
          <div className="panel-actions-bottom">{running ? <Button onClick={cancelBuild}>{copy.analytics.cancelBuildJob}</Button> : <Button onClick={() => requestBuild(true)} icon={<RefreshCw size={16} />}>{copy.analytics.buildIncremental}</Button>}<Button onClick={activateIndex} disabled={selectedIndex.status !== copy.analytics.builtInactive}>{copy.analytics.activateIndex}</Button><Button variant="primary" disabled={selectedIndex.status !== copy.analytics.indexed} onClick={() => { setActiveIndexId(selectedIndex.id); setDocumentView(current => ({ ...current, searchIndexId: selectedIndex.id, folder: 0, reportTerm: null })); navigate("documents"); notify(copy.analytics.openDocuments); }}>{copy.analytics.indexActionOpen}</Button></div>
        </Panel>}
      </div>}
      {tab === copy.modules.report && <SearchTermReport navigate={navigate} notify={notify} />}
    </Panel>

    {tab !== copy.modules.report && tab !== copy.modules.dtsearch && <><Panel title={copy.analytics.analysisSets} actions={<Button variant="primary" icon={<Play size={16} />} onClick={() => notify(copy.toasts.generic)}>{copy.analytics.newAnalysis}</Button>} className="table-panel"><div className="table-scroll"><table><thead><tr>{copy.analytics.columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{copy.analytics.rows.map(row => <tr key={row.name}><td><strong>{row.name}</strong></td><td>{row.type}</td><td>{row.scope}</td><td><Badge tone={row.tone}>{row.status}</Badge></td><td>{row.result}</td><td>{row.updated}</td></tr>)}</tbody></table></div></Panel><div className="analytics-grid"><Panel title={copy.analytics.threadTitle}><div className="stat-list">{copy.analytics.threadStats.map((item, index) => { const icons = [GitBranch, Network, Users, Users]; const Icon = icons[index]; return <div key={item.label}><Icon size={18} /><span>{item.label}</span><strong>{item.value}</strong></div>; })}</div></Panel><Panel title={copy.analytics.languageTitle}><div className="language-bars">{copy.analytics.languages.map(language => <div key={language.label}><span>{language.label}</span><div><i style={{ width: `${language.value}%` }} /></div><strong>{language.count}</strong></div>)}</div></Panel></div></>}
    <div className="boundary-note"><AlertCircle size={18} /><span>{copy.analytics.boundary}</span></div>
    <Modal open={buildConfirm !== null} title={copy.analytics.fullBuildConfirm} onClose={() => setBuildConfirm(null)} footer={<><Button onClick={() => setBuildConfirm(null)}>{copy.analytics.cancelBuild}</Button><Button variant="primary" onClick={() => buildConfirm && runIndex(buildConfirm.incremental, buildConfirm.indexId)}>{copy.analytics.confirmBuild}</Button></>}><p>{copy.analytics.fullBuildWarning}</p><CheckRow label={copy.analytics.activateOnComplete} checked={activateOnComplete} onChange={() => setActivateOnComplete(value => !value)} /></Modal>
    <Modal open={searchableSetOpen} title={copy.analytics.selectSearchableSet} onClose={() => setSearchableSetOpen(false)} footer={<Button variant="primary" onClick={() => setSearchableSetOpen(false)}>{copy.common.confirm}</Button>}><p className="admin-note">{copy.analytics.searchableSetModalHint}</p><div className="analytics-choice-list">{searchableSetOptions.map(option => <CheckRow key={option.label} label={option.label} checked={form.searchableSet === option.label} onChange={() => setForm(current => ({ ...current, searchableSet: option.label, searchableSetId: option.id, searchableSetType: option.type }))} />)}</div></Modal>
  </div>;
}
