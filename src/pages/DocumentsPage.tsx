import { useMemo, useState } from "react";
import { ChevronDown, FileSpreadsheet, FileText, Filter, FolderInput, Lock, Mail, Plus, Save, Search, Shield } from "lucide-react";
import { copy, type PageId } from "../constants/copy";
import { Badge, Button, CheckRow, Field, Modal, PageHeader, Toggle } from "../components/UI";
import { useAdministration } from "../state/Administration";
import { createId } from "../state/ids";
import { ItemSecurityEditor, type ItemPermissionDraft } from "../components/ItemSecurityEditor";

const documentIcon = (type: string) => type.includes("Email") ? Mail : type.includes("Excel") ? FileSpreadsheet : FileText;
type BrowserMode = "folders" | "saved";
type FolderContextKind = "folder" | "savedSearchFolder";

export function DocumentsPage({ navigate, notify }: { navigate: (page: PageId) => void; notify: (message: string) => void }) {
  const { savedSearches, setSavedSearches, dtSearchIndexes, documentView, setDocumentView, groups, activeWorkspaceId } = useAdministration();
  const { query, includeFamily, folder, reportTerm, searchIndexId } = documentView;
  const [browserMode, setBrowserMode] = useState<BrowserMode>("folders");
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [activeSearchId, setActiveSearchId] = useState<string | null>(null);
  const [folderSearch, setFolderSearch] = useState("");
  const [savedFolder, setSavedFolder] = useState<string>(copy.documents.searchFolderOptions[0]);
  const [searchName, setSearchName] = useState<string>(copy.documents.savedSearchNameValue);
  const [saveOwner, setSaveOwner] = useState<string>(copy.documents.savedSearchOwnerMe);
  const [saveVisibility, setSaveVisibility] = useState<string>(copy.documents.savedSearchPrivate);
  const [saveError, setSaveError] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);
  const [sampleMethod, setSampleMethod] = useState<"fixed" | "percentage" | "statistical">("fixed");
  const [sampleCount, setSampleCount] = useState("10");
  const [samplePercentage, setSamplePercentage] = useState("10");
  const [sampleConfidence, setSampleConfidence] = useState("95%");
  const [sampleMargin, setSampleMargin] = useState("5%");
  const [sampleError, setSampleError] = useState(false);
  const [sampleResult, setSampleResult] = useState<number | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [custodianOpen, setCustodianOpen] = useState(false);
  const [custodians, setCustodians] = useState<string[]>([]);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveSearchId, setMoveSearchId] = useState<string | null>(null);
  const [itemSecurityTarget, setItemSecurityTarget] = useState<{ kind: FolderContextKind | "savedSearch"; name: string } | null>(null);
  const [folderContext, setFolderContext] = useState<{ kind: FolderContextKind; name: string; x: number; y: number } | null>(null);
  const [moveFolderName, setMoveFolderName] = useState<string | null>(null);
  const [itemSecurityDrafts, setItemSecurityDrafts] = useState<Record<string, ItemPermissionDraft>>({});
  const [itemSecurityIncluded, setItemSecurityIncluded] = useState<Record<string, string[]>>({});
  const itemGroups = groups.filter(group => !activeWorkspaceId || group.workspaceIds.includes(activeWorkspaceId));
  const itemSecuritySections = (kind: "folder" | "savedSearch" | "savedSearchFolder") => kind === "folder" ? [
    { id: "folder", label: copy.itemSecurity.folder, rows: [{ id: "view", label: copy.itemSecurity.view }, { id: "edit", label: copy.itemSecurity.edit }, { id: "delete", label: copy.itemSecurity.delete }, { id: "add", label: copy.itemSecurity.add }, { id: "security", label: copy.itemSecurity.security }] },
    { id: "document", label: copy.itemSecurity.document, rows: [{ id: "view", label: copy.itemSecurity.view }, { id: "edit", label: copy.itemSecurity.edit }, { id: "delete", label: copy.itemSecurity.delete }, { id: "add", label: copy.itemSecurity.add }, { id: "security", label: copy.itemSecurity.security }, { id: "uploadImage", label: copy.itemSecurity.uploadImage }, { id: "replaceDocument", label: copy.itemSecurity.replaceDocument }, { id: "createPdf", label: copy.itemSecurity.createPdf }, { id: "localAccess", label: copy.itemSecurity.localAccess }, { id: "redact", label: copy.itemSecurity.redact }, { id: "highlight", label: copy.itemSecurity.highlight }] },
  ] : kind === "savedSearchFolder" ? [
    { id: "searchContainer", label: copy.itemSecurity.searchContainer, rows: [{ id: "view", label: copy.itemSecurity.view }, { id: "edit", label: copy.itemSecurity.edit }, { id: "delete", label: copy.itemSecurity.delete }, { id: "add", label: copy.itemSecurity.add }, { id: "security", label: copy.itemSecurity.security }] },
  ] : [
    { id: "search", label: copy.itemSecurity.search, rows: [{ id: "view", label: copy.itemSecurity.view }, { id: "edit", label: copy.itemSecurity.edit }, { id: "delete", label: copy.itemSecurity.delete }, { id: "add", label: copy.itemSecurity.add }, { id: "security", label: copy.itemSecurity.security }] },
    { id: "searchContainer", label: copy.itemSecurity.searchContainer, rows: [{ id: "view", label: copy.itemSecurity.view }, { id: "edit", label: copy.itemSecurity.edit }, { id: "delete", label: copy.itemSecurity.delete }, { id: "add", label: copy.itemSecurity.add }, { id: "security", label: copy.itemSecurity.security }] },
  ];

  const setQuery = (value: string) => setDocumentView(current => ({ ...current, query: value }));
  const setIncludeFamily = (value: boolean) => setDocumentView(current => ({ ...current, includeFamily: value }));
  const activeSavedSearch = savedSearches.find(search => search.id === activeSearchId);
  const activeIndex = dtSearchIndexes.find(index => index.id === searchIndexId && index.status === copy.analytics.indexed);
  const indexedSearch = activeIndex?.searchableSetId ? savedSearches.find(search => search.id === activeIndex.searchableSetId) : undefined;
  const availableIndexes = dtSearchIndexes.filter(index => index.status === copy.analytics.indexed);
  const selectSavedSearch = (search: typeof savedSearches[number]) => {
    setActiveSearchId(search.id);
    setBrowserMode("saved");
    setSearchExecuted(true);
    setQuery(search.query);
    setIncludeFamily(search.includeFamily);
    setDocumentView(current => ({ ...current, folder: 0, reportTerm: null, searchIndexId: null }));
  };
  const runAdHocSearch = () => {
    setActiveSearchId(null);
    setDocumentView(current => ({ ...current, searchIndexId: null }));
    setSearchExecuted(true);
    notify(copy.documents.searchRunSuccess);
  };
  const docs = useMemo(() => copy.documents.docs.filter(doc => {
    if (!includeFamily && !doc.direct) return false;
    if (reportTerm !== null && !doc.file.toLowerCase().includes(reportTerm.toLowerCase())) return false;
    if (folder !== 0 && !(folder === 1 ? doc.responsive === copy.documents.docs[2].responsive : folder === 2 ? !doc.type.includes("Email") : folder === 3 ? doc.confidential === copy.documents.docs[0].confidential : doc.responsive === copy.documents.docs[0].responsive)) return false;
    const effectiveQuery = indexedSearch?.query ?? (searchExecuted ? query : "");
    if (effectiveQuery.trim()) {
      const searchable = `${doc.id} ${doc.file} ${doc.type} ${doc.responsive} ${doc.confidential}`.toLowerCase();
      if (!searchable.includes(effectiveQuery.trim().toLowerCase())) return false;
    }
    return true;
  }), [folder, includeFamily, indexedSearch?.query, query, reportTerm, searchExecuted]);
  const groupedSearches = copy.documents.searchFolderOptions.map(folderName => ({ folderName, searches: savedSearches.filter(search => (search.folderName ?? copy.documents.searchFolderOptions[search.folder] ?? copy.documents.searchFolderOptions[0]) === folderName) }));
  const openDoc = (id: string, locked: boolean) => { if (locked) { notify(copy.documents.lockedMessage); return; } setSelected([id]); navigate("review"); };
  const saveCurrentSearch = () => {
    if (!searchName.trim()) { setSaveError(true); return; }
    const id = createId();
    const folderIndex = Math.max(0, copy.documents.searchFolderOptions.map(String).indexOf(savedFolder));
    setSavedSearches(current => [...current, { id, name: searchName.trim(), query, includeFamily, folder: folderIndex, folderName: savedFolder, owner: saveOwner, visibility: saveVisibility === copy.documents.savedSearchPublic ? "public" : "private", selectedFields: [copy.documents.conditionFieldValue], sort: copy.documents.controlNumberSort }]);
    setActiveSearchId(id); setBrowserMode("saved"); setSearchExecuted(true); setSaveOpen(false); notify(copy.documents.saveSearchSuccess);
  };

  return <div className="page page--documents">
    <PageHeader title={copy.documents.title} subtitle={copy.documents.subtitle} ids={copy.documents.ids} />
    <div className="documents-workbench">
      <aside className="search-panel">
        <div className="browser-switcher" role="tablist">
          <button type="button" className={browserMode === "folders" ? "is-active" : ""} onClick={() => { setBrowserMode("folders"); setActiveSearchId(null); }}>{copy.documents.folders}</button>
          <button type="button" className={browserMode === "saved" ? "is-active" : ""} onClick={() => { setBrowserMode("saved"); setActiveSearchId(null); }}>{copy.documents.savedSearches}</button>
        </div>
        {browserMode === "folders" ? <>
          <div className="search-panel__section"><button type="button" className="search-panel__title"><ChevronDown size={15} />{copy.documents.folders}</button><input aria-label={copy.common.search} placeholder={copy.common.search} value={folderSearch} onChange={event => setFolderSearch(event.target.value)} /><div className="folder-list">{copy.documents.folderItems.map((label, index) => label.toLowerCase().includes(folderSearch.toLowerCase()) && <button type="button" className={index === folder && !activeSearchId && !searchIndexId ? "is-active" : ""} key={label} onContextMenu={event => { event.preventDefault(); setFolderContext({ kind: "folder", name: label, x: event.clientX, y: event.clientY }); }} onClick={() => { setFolderContext(null); setActiveSearchId(null); setSearchExecuted(false); setDocumentView(current => ({ ...current, folder: index, reportTerm: null, searchIndexId: null })); }}>{label}</button>)}</div></div>
        </> : <div className="search-panel__section saved-search-browser"><div className="search-panel__heading"><button type="button" className="search-panel__title"><ChevronDown size={15} />{copy.documents.savedSearchBrowser}</button><Button icon={<Plus size={15} />} onClick={() => { setSearchName(copy.documents.savedSearchNameValue); setSaveError(false); setSaveOpen(true); }}>{copy.documents.createNewSavedSearch}</Button></div><button type="button" className="saved-search-root" onContextMenu={event => { event.preventDefault(); setFolderContext({ kind: "savedSearchFolder", name: copy.documents.searchFolderRoot, x: event.clientX, y: event.clientY }); }} onClick={() => { setActiveSearchId(null); setSearchExecuted(false); setDocumentView(current => ({ ...current, searchIndexId: null })); }}>{copy.documents.searchFolderRoot}</button>{groupedSearches.map(group => <div className="saved-search-group" key={group.folderName}><button type="button" className="saved-search-folder-name" onContextMenu={event => { event.preventDefault(); setFolderContext({ kind: "savedSearchFolder", name: group.folderName, x: event.clientX, y: event.clientY }); }}>{group.folderName}</button>{group.searches.map(search => <div className={`saved-search-row ${activeSearchId === search.id ? "is-active" : ""}`} key={search.id}><button type="button" onClick={() => selectSavedSearch(search)}>{search.name}<small>{search.visibility === "public" ? copy.documents.savedSearchPublic : copy.documents.savedSearchPrivate}</small></button><div className="saved-search-row__actions"><button type="button" aria-label={`${copy.documents.moveSearch} ${search.name}`} title={copy.documents.moveSearch} onClick={() => { setMoveSearchId(search.id); setMoveFolderName(null); setMoveOpen(true); }}><FolderInput size={14} /></button><button type="button" aria-label={`${copy.documents.security} ${search.name}`} title={copy.documents.security} onClick={() => { setMoveSearchId(search.id); setItemSecurityTarget({ kind: "savedSearch", name: search.name }); }}><Shield size={14} /></button></div></div>)}</div>)}{!savedSearches.length && <p>{copy.modules.savedEmpty}</p>}</div>}

        <div className="search-panel__section search-panel__conditions">
          <div className="search-panel__heading"><button type="button" className="search-panel__title"><ChevronDown size={15} />{copy.documents.conditions}</button><Button icon={<Plus size={15} />}>{copy.documents.addCondition}</Button></div>
          <div className="condition-card"><div className="condition-card__top"><span>{copy.documents.conditionNumber}</span><strong>{custodians.length ? copy.documents.custodian : copy.documents.conditionFieldValue}</strong><Filter size={14} /></div><Field label={copy.documents.conditionField}><select defaultValue={copy.documents.conditionFieldValue}><option>{copy.documents.conditionFieldValue}</option><option>{copy.documents.custodian}</option></select></Field><Field label={copy.documents.conditionOperator}><select defaultValue={copy.documents.conditionOperatorValue}><option>{copy.documents.conditionOperatorValue}</option></select></Field><Field label={copy.documents.conditionValue}><input value={query} onChange={event => { setQuery(event.target.value); setActiveSearchId(null); setSearchExecuted(false); }} /></Field><Button icon={<Plus size={14} />} onClick={() => setCustodianOpen(true)}>{copy.documents.advancedSearch}</Button>{custodians.length > 0 && <div className="condition-summary"><span>{copy.documents.selectedCustodians}</span><strong>{custodians.join(", ")}</strong></div>}</div><Toggle label={copy.documents.autoRun} checked={autoRun} onChange={() => setAutoRun(!autoRun)} /><Button variant="primary" icon={<Search size={16} />} onClick={runAdHocSearch}>{copy.documents.runSearch}</Button>
        </div>
      </aside>

      {browserMode === "saved" && !activeSearchId ? <section className="saved-search-browser-main"><div className="saved-search-empty"><Search size={46} /><h2>{copy.documents.savedSearchBrowser}</h2><p>{copy.documents.savedSearchHint}</p><Button variant="primary" onClick={() => { setSearchName(copy.documents.savedSearchNameValue); setSaveError(false); setSaveOpen(true); }}>{copy.documents.createNewSavedSearch}</Button></div></section> : <section className="document-results">
        <div className="document-context-banner"><div><strong>{activeIndex ? copy.documents.indexSearch : activeSavedSearch ? copy.documents.savedSearchView : searchExecuted ? copy.documents.ordinarySearch : copy.documents.allDocumentsView}</strong><small>{activeIndex ? `${activeIndex.name} · ${copy.documents.indexSearchDescription}` : activeSavedSearch ? copy.documents.savedSearchUpdatedResults : copy.documents.ordinarySearchHint}</small></div>{activeIndex ? <Badge tone="success">{copy.documents.indexSearchSelected}</Badge> : activeSavedSearch && <Badge tone="info">{copy.documents.savedSearchSelected}</Badge>}</div>
        {activeSavedSearch && <div className="saved-search-definition"><span>{copy.documents.activeSearchDefinition}</span><strong>{activeSavedSearch.query}</strong><small>{copy.documents.searchDefinitionNotResults}</small></div>}
        <div className="document-toolbar"><select aria-label={copy.documents.searchIndex} value={searchIndexId ?? ""} onChange={event => { const value = event.target.value || null; setActiveSearchId(null); setSearchExecuted(false); setDocumentView(current => ({ ...current, searchIndexId: value, folder: 0, reportTerm: null })); }}><option value="">{copy.documents.noSearchIndex}</option>{availableIndexes.map(index => <option key={index.id} value={index.id}>{index.name}</option>)}</select><div className="document-toolbar__search"><Search size={16} /><input value={query} onChange={event => { setQuery(event.target.value); setActiveSearchId(null); setSearchExecuted(false); setDocumentView(current => ({ ...current, searchIndexId: null })); }} /></div><Button onClick={() => { setSaveError(false); setSaveOpen(true); }} icon={<Save size={16} />}>{copy.documents.saveSearch}</Button><Button disabled={selected.length === 0}>{copy.documents.bulkEdit}</Button><Button onClick={() => { setSampleError(false); setSampleResult(null); setSampleOpen(true); }}>{copy.documents.sample}</Button></div>
        <div className="index-coverage"><span />{copy.documents.indexCoverage}</div><div className="results-summary"><span>{copy.modules.results}{copy.fieldManagement.separator}{docs.length}</span><CheckRow label={copy.documents.includeFamily} checked={includeFamily} onChange={() => setIncludeFamily(!includeFamily)} /></div>
        <div className="table-scroll document-table"><table><thead><tr>{copy.documents.columns.map((column, index) => <th key={`${column}-${index}`}>{index === 0 ? <input type="checkbox" aria-label={copy.common.all} /> : column}</th>)}</tr></thead><tbody>{docs.map(doc => { const Icon = documentIcon(doc.type); return <tr key={doc.id} className={selected.includes(doc.id) ? "is-selected" : ""}><td><input type="checkbox" aria-label={doc.id} checked={selected.includes(doc.id)} onChange={() => setSelected(selected.includes(doc.id) ? selected.filter(id => id !== doc.id) : [...selected, doc.id])} /></td><td><button type="button" onClick={() => openDoc(doc.id, doc.locked)}>{doc.locked && <Lock size={13} />}<strong>{doc.id}</strong></button></td><td><Icon size={16} aria-hidden="true" /><span>{doc.file}</span></td><td>{doc.type}</td><td>{doc.responsive}</td><td>{doc.confidential}</td><td><Badge tone={doc.direct ? "info" : "neutral"}>{doc.direct ? copy.documents.directHit : copy.documents.familyHit}</Badge><small>{doc.relation}</small></td></tr>; })}{!docs.length && <tr><td colSpan={copy.documents.columns.length}>{copy.modules.noMatches}</td></tr>}</tbody></table></div><div className="table-footer"><span>{copy.modules.results}{copy.fieldManagement.separator}{docs.length}</span><span>{copy.common.rowsPerPage}</span></div>
      </section>}
    </div>

    <Modal open={saveOpen} title={copy.documents.saveSearch} onClose={() => setSaveOpen(false)} footer={<><Button onClick={() => setSaveOpen(false)}>{copy.common.cancel}</Button><Button variant="primary" onClick={saveCurrentSearch}>{copy.common.save}</Button></>}>
      {saveError && <p role="alert">{copy.modules.invalidSearch}</p>}<p className="admin-note">{copy.documents.savedSearchHint}</p><Field label={copy.documents.savedSearchName} required><input aria-label={copy.documents.savedSearchName} value={searchName} onChange={event => setSearchName(event.target.value)} /></Field><Field label={copy.documents.savedSearchFolder}><select value={savedFolder} onChange={event => setSavedFolder(event.target.value)}>{copy.documents.searchFolderOptions.map(option => <option key={option}>{option}</option>)}</select></Field><div className="workspace-advanced-grid"><Field label={copy.documents.savedSearchOwner}><select value={saveOwner} onChange={event => setSaveOwner(event.target.value)}><option>{copy.documents.savedSearchOwnerMe}</option><option>{copy.documents.savedSearchOwnerAdmin}</option></select></Field><Field label={copy.documents.savedSearchVisibility}><select value={saveVisibility} onChange={event => setSaveVisibility(event.target.value)}><option>{copy.documents.savedSearchPrivate}</option><option>{copy.documents.savedSearchPublic}</option></select></Field></div><Field label={copy.documents.conditions}><div className="read-only-summary"><Filter size={16} /><span>{copy.documents.conditionFieldValue} · {copy.documents.conditionOperatorValue} · {query}</span></div></Field><CheckRow label={copy.documents.includeFamily} checked={includeFamily} onChange={() => setIncludeFamily(!includeFamily)} />
    </Modal>
    <Modal open={sampleOpen} title={copy.documents.sampleTitle} onClose={() => setSampleOpen(false)} wide footer={<><Button onClick={() => setSampleOpen(false)}>{copy.common.cancel}</Button><Button variant="primary" onClick={() => { const value = sampleMethod === "fixed" ? Number(sampleCount) : sampleMethod === "percentage" ? Number(samplePercentage) : Number(sampleCount); if (!Number.isFinite(value) || value <= 0 || (sampleMethod === "percentage" && value > 100) || (sampleMethod === "fixed" && value > docs.length && docs.length > 0)) { setSampleError(true); return; } const count = sampleMethod === "percentage" ? Math.max(1, Math.round(docs.length * value / 100)) : Math.min(value, docs.length || value); setSampleResult(count); setSampleError(false); notify(copy.documents.sampleCreated); }}>{copy.documents.sampleRun}</Button></>}><p className="admin-note">{copy.documents.sampleHint}</p>{sampleError && <p role="alert" className="form-alert">{copy.documents.sampleInvalid}</p>}<Field label={copy.documents.sampleMethod} required><select value={sampleMethod} onChange={event => setSampleMethod(event.target.value as typeof sampleMethod)}><option value="fixed">{copy.documents.sampleFixed}</option><option value="percentage">{copy.documents.samplePercentage}</option><option value="statistical">{copy.documents.sampleStatistical}</option></select></Field>{sampleMethod === "fixed" && <Field label={copy.documents.sampleCount} required><input type="number" min="1" value={sampleCount} onChange={event => setSampleCount(event.target.value)} /></Field>}{sampleMethod === "percentage" && <Field label={copy.documents.samplePercentageValue} required><input type="number" min="1" max="100" value={samplePercentage} onChange={event => setSamplePercentage(event.target.value)} /></Field>}{sampleMethod === "statistical" && <div className="workspace-advanced-grid"><Field label={copy.documents.sampleConfidence} required><select value={sampleConfidence} onChange={event => setSampleConfidence(event.target.value)}><option>90%</option><option>95%</option><option>99%</option></select></Field><Field label={copy.documents.sampleMargin} required><select value={sampleMargin} onChange={event => setSampleMargin(event.target.value)}><option>3%</option><option>5%</option><option>10%</option></select></Field></div>}{sampleResult !== null && <section className="sample-result"><h3>{copy.documents.sampleResult}</h3><strong>{copy.documents.sampleCountValue.replace("{count}", String(sampleResult))}</strong><p>{copy.documents.sampleResultHint}</p></section>}</Modal>
    <Modal open={custodianOpen} title={copy.documents.selectCustodian} onClose={() => setCustodianOpen(false)} footer={<><Button onClick={() => setCustodianOpen(false)}>{copy.common.cancel}</Button><Button variant="primary" onClick={() => setCustodianOpen(false)}>{copy.documents.applyCustodian}</Button></>}><p className="admin-note">{copy.documents.custodianHint}</p><div className="custodian-picker">{copy.documents.custodianOptions.map(option => <CheckRow key={option} label={option} checked={custodians.includes(option)} onChange={() => setCustodians(current => current.includes(option) ? current.filter(item => item !== option) : [...current, option])} />)}</div></Modal>
    <Modal open={moveOpen} title={moveFolderName ? copy.documents.moveFolder : copy.documents.moveSearchTitle} onClose={() => { setMoveOpen(false); setMoveFolderName(null); }} footer={<><Button onClick={() => { setMoveOpen(false); setMoveFolderName(null); }}>{copy.common.cancel}</Button><Button variant="primary" onClick={() => { const targetFolder = Math.max(0, copy.documents.searchFolderOptions.map(String).indexOf(savedFolder)); if (moveFolderName) setSavedSearches(current => current.map(search => (search.folderName ?? copy.documents.searchFolderOptions[search.folder]) === moveFolderName ? { ...search, folder: targetFolder, folderName: savedFolder } : search)); else if (moveSearchId) setSavedSearches(current => current.map(search => search.id === moveSearchId ? { ...search, folder: targetFolder, folderName: savedFolder } : search)); setMoveOpen(false); setMoveFolderName(null); notify(moveFolderName ? copy.documents.moveFolderSuccess : copy.documents.moveSearchSuccess); }}>{moveFolderName ? copy.documents.moveFolder : copy.documents.moveSearch}</Button></>}><p className="admin-note">{copy.documents.moveSearchHint}</p><Field label={copy.documents.searchFolder}><select value={savedFolder} onChange={event => setSavedFolder(event.target.value)}>{copy.documents.searchFolderOptions.map(option => <option key={option}>{option}</option>)}</select></Field></Modal>
    {folderContext && <div className="item-security-context-menu" style={{ left: folderContext.x, top: folderContext.y }}><button type="button" onClick={() => { if (folderContext.kind === "folder") setDocumentView(current => ({ ...current, folder: copy.documents.folderItems.findIndex(item => item === folderContext.name) })); setFolderContext(null); }}>{copy.documents.openFolder}</button><button type="button" onClick={() => { setMoveFolderName(folderContext.kind === "savedSearchFolder" ? folderContext.name : null); setMoveSearchId(null); setMoveOpen(true); setFolderContext(null); }}>{copy.documents.moveFolder}</button><button type="button" onClick={() => { setItemSecurityTarget({ kind: folderContext.kind, name: folderContext.name }); setFolderContext(null); }}>{copy.documents.security}</button></div>}
    {itemSecurityTarget && <ItemSecurityEditor open title={itemSecurityTarget.kind === "folder" ? copy.itemSecurity.folder : itemSecurityTarget.kind === "savedSearchFolder" ? copy.itemSecurity.savedSearchFolder : copy.itemSecurity.search} itemName={itemSecurityTarget.name} workspaceName={activeWorkspaceId ?? copy.documents.title} groups={itemGroups} initialIncludedIds={itemSecurityIncluded[itemSecurityTarget.name] ?? itemGroups.map(group => group.id)} initialPermissions={itemSecurityDrafts[itemSecurityTarget.name]} sections={itemSecuritySections(itemSecurityTarget.kind)} onClose={() => setItemSecurityTarget(null)} onSave={(includedIds, permissions) => { setItemSecurityIncluded(current => ({ ...current, [itemSecurityTarget.name]: includedIds })); setItemSecurityDrafts(current => ({ ...current, [itemSecurityTarget.name]: permissions })); notify(copy.documents.securitySaved); }} />}
  </div>;
}
