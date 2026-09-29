import { useMemo, useState } from "react";
import { ChevronDown, FileSpreadsheet, FileText, Filter, Lock, Mail, Plus, Save, Search } from "lucide-react";
import { copy, type PageId } from "../constants/copy";
import { Badge, Button, CheckRow, Field, Modal, PageHeader, Toggle } from "../components/UI";

import { useAdministration } from "../state/Administration";

const documentIcon = (type: string) => type.includes("Email") ? Mail : type.includes("Excel") ? FileSpreadsheet : FileText;

export function DocumentsPage({ navigate, notify }: { navigate: (page: PageId) => void; notify: (message: string) => void }) {
  const { savedSearches, setSavedSearches, documentView, setDocumentView } = useAdministration();
  const { query, includeFamily, folder, reportTerm } = documentView;
  const setQuery = (query: string) => setDocumentView(current => ({ ...current, query }));
  const setIncludeFamily = (includeFamily: boolean) => setDocumentView(current => ({ ...current, includeFamily }));
  const [searchName, setSearchName] = useState<string>(copy.documents.savedSearchNameValue);
  const [saveError, setSaveError] = useState(false);
  const [folderSearch, setFolderSearch] = useState("");
  const [autoRun, setAutoRun] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const docs = useMemo(() => copy.documents.docs.filter(doc => (includeFamily || doc.direct) && (reportTerm === null || doc.file.toLowerCase().includes(reportTerm.toLowerCase())) && (folder === 0 || (folder === 1 ? doc.responsive === copy.documents.docs[2].responsive : folder === 2 ? !doc.type.includes("Email") : folder === 3 ? doc.confidential === copy.documents.docs[0].confidential : doc.responsive === copy.documents.docs[0].responsive))), [includeFamily, folder, reportTerm]);

  const openDoc = (id: string, locked: boolean) => {
    if (locked) {
      notify(copy.documents.lockedMessage);
      return;
    }
    setSelected([id]);
    navigate("review");
  };

  return (
    <div className="page page--documents">
      <PageHeader title={copy.documents.title} subtitle={copy.documents.subtitle} ids={copy.documents.ids} />
      <div className="documents-workbench">
        <aside className="search-panel">
          <div className="search-panel__section">
            <button type="button" className="search-panel__title"><ChevronDown size={15} />{copy.documents.folders}</button>
            <input aria-label={copy.common.search} placeholder={copy.common.search} value={folderSearch} onChange={event => setFolderSearch(event.target.value)} />
            <div className="folder-list">
              {copy.documents.folderItems.map((label, index) => label.toLowerCase().includes(folderSearch.toLowerCase()) && <button type="button" className={index === folder ? "is-active" : ""} key={label} onClick={() => setDocumentView(current => ({ ...current, folder: index, reportTerm: null }))}>{label}</button>)}
            </div>
          </div>
          <div className="search-panel__section"><h2 className="search-panel__title">{copy.documents.savedSearches}</h2><div className="folder-list">{savedSearches.length ? savedSearches.map(search => <button type="button" key={search.id} onClick={() => setDocumentView({ query: search.query, folder: search.folder, includeFamily: search.includeFamily, reportTerm: null })}>{search.name}</button>) : <p>{copy.modules.savedEmpty}</p>}</div></div>
          <div className="search-panel__section search-panel__conditions">
            <div className="search-panel__heading"><button type="button" className="search-panel__title"><ChevronDown size={15} />{copy.documents.conditions}</button><Button icon={<Plus size={15} />}>{copy.documents.addCondition}</Button></div>
            <div className="condition-card">
              <div className="condition-card__top"><span>{copy.documents.conditionNumber}</span><strong>{copy.documents.conditionFieldValue}</strong><Filter size={14} /></div>
              <Field label={copy.documents.conditionField}><select defaultValue={copy.documents.conditionFieldValue}><option>{copy.documents.conditionFieldValue}</option></select></Field>
              <Field label={copy.documents.conditionOperator}><select defaultValue={copy.documents.conditionOperatorValue}><option>{copy.documents.conditionOperatorValue}</option></select></Field>
              <Field label={copy.documents.conditionValue}><input value={query} onChange={(event) => setQuery(event.target.value)} /></Field>
            </div>
            <Toggle label={copy.documents.autoRun} checked={autoRun} onChange={() => setAutoRun(!autoRun)} />
            <Button variant="primary" icon={<Search size={16} />}>{copy.documents.runSearch}</Button>
          </div>
        </aside>

        <section className="document-results">
          <div className="document-toolbar">
            <select aria-label={copy.documents.allDocuments} defaultValue={copy.documents.allDocuments}><option>{copy.documents.allDocuments}</option></select>
            <div className="document-toolbar__search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} /></div>
            <Button onClick={() => { setSaveError(false); setSaveOpen(true); }} icon={<Save size={16} />}>{copy.documents.saveSearch}</Button>
            <Button disabled={selected.length === 0}>{copy.documents.bulkEdit}</Button>
          </div>
          <div className="index-coverage"><span />{copy.documents.indexCoverage}</div>
          <div className="results-summary">
            <span>{copy.modules.results}{copy.fieldManagement.separator}{docs.length}</span>
            <CheckRow label={copy.documents.includeFamily} checked={includeFamily} onChange={() => setIncludeFamily(!includeFamily)} />
          </div>
          <div className="table-scroll document-table">
            <table>
              <thead><tr>{copy.documents.columns.map((column, index) => <th key={`${column}-${index}`}>{index === 0 ? <input type="checkbox" aria-label={copy.common.all} /> : column}</th>)}</tr></thead>
              <tbody>
                {docs.map((doc) => {
                  const Icon = documentIcon(doc.type);
                  return (
                    <tr key={doc.id} className={selected.includes(doc.id) ? "is-selected" : ""}>
                      <td><input type="checkbox" aria-label={doc.id} checked={selected.includes(doc.id)} onChange={() => setSelected(selected.includes(doc.id) ? selected.filter((id) => id !== doc.id) : [...selected, doc.id])} /></td>
                      <td><button type="button" onClick={() => openDoc(doc.id, doc.locked)}>{doc.locked && <Lock size={13} />}<strong>{doc.id}</strong></button></td>
                      <td><Icon size={16} aria-hidden="true" /><span>{doc.file}</span></td>
                      <td>{doc.type}</td>
                      <td>{doc.responsive}</td>
                      <td>{doc.confidential}</td>
                      <td><Badge tone={doc.direct ? "info" : "neutral"}>{doc.direct ? copy.documents.directHit : copy.documents.familyHit}</Badge><small>{doc.relation}</small></td>
                    </tr>
                  );
                })}
                {!docs.length && <tr><td colSpan={copy.documents.columns.length}>{copy.modules.noMatches}</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="table-footer"><span>{copy.modules.results}{copy.fieldManagement.separator}{docs.length}</span><span>{copy.common.rowsPerPage}</span></div>
        </section>
      </div>

      <Modal open={saveOpen} title={copy.documents.saveSearch} onClose={() => setSaveOpen(false)} footer={<><Button onClick={() => setSaveOpen(false)}>{copy.common.cancel}</Button><Button variant="primary" onClick={() => { if (!searchName.trim()) return setSaveError(true); setSavedSearches(current => [...current, { id: crypto.randomUUID(), name: searchName.trim(), query, includeFamily, folder }]); setSaveOpen(false); notify(copy.documents.saveSearchSuccess); }}>{copy.common.save}</Button></>}>
        {saveError && <p role="alert">{copy.modules.invalidSearch}</p>}
        <Field label={copy.documents.savedSearchName} required><input aria-label={copy.documents.savedSearchName} value={searchName} onChange={event => setSearchName(event.target.value)} /></Field>
        <Field label={copy.documents.conditions}><div className="read-only-summary"><Filter size={16} /><span>{copy.documents.conditionFieldValue} · {copy.documents.conditionOperatorValue} · {query}</span></div></Field>
        <CheckRow label={copy.documents.includeFamily} checked={includeFamily} onChange={() => setIncludeFamily(!includeFamily)} />
      </Modal>
    </div>
  );
}
