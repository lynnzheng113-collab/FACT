import { useMemo, useState } from "react";
import { ChevronDown, FileSpreadsheet, FileText, Filter, Lock, Mail, Plus, Save, Search } from "lucide-react";
import { copy, type PageId } from "../constants/copy";
import { Badge, Button, CheckRow, Field, Modal, PageHeader, Toggle } from "../components/UI";

const documentIcon = (type: string) => type.includes("Email") ? Mail : type.includes("Excel") ? FileSpreadsheet : FileText;

export function DocumentsPage({ navigate, notify }: { navigate: (page: PageId) => void; notify: (message: string) => void }) {
  const [query, setQuery] = useState<string>(copy.documents.searchValue);
  const [includeFamily, setIncludeFamily] = useState(true);
  const [autoRun, setAutoRun] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const docs = useMemo(() => includeFamily ? copy.documents.docs : copy.documents.docs.filter((doc) => doc.direct), [includeFamily]);

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
            <input aria-label={copy.common.search} placeholder={copy.common.search} />
            <div className="folder-list">
              {copy.documents.folderItems.map((folder, index) => <button type="button" className={index === 0 ? "is-active" : ""} key={folder}>{folder}</button>)}
            </div>
          </div>
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
            <Button onClick={() => setSaveOpen(true)} icon={<Save size={16} />}>{copy.documents.saveSearch}</Button>
            <Button disabled={selected.length === 0}>{copy.documents.bulkEdit}</Button>
          </div>
          <div className="index-coverage"><span />{copy.documents.indexCoverage}</div>
          <div className="results-summary">
            <span>{copy.documents.resultCount}</span>
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
              </tbody>
            </table>
          </div>
          <div className="table-footer"><span>{copy.documents.resultCount}</span><span>{copy.common.rowsPerPage}</span></div>
        </section>
      </div>

      <Modal open={saveOpen} title={copy.documents.saveSearch} onClose={() => setSaveOpen(false)} footer={<><Button onClick={() => setSaveOpen(false)}>{copy.common.cancel}</Button><Button variant="primary" onClick={() => { setSaveOpen(false); notify(copy.documents.saveSearchSuccess); }}>{copy.common.save}</Button></>}>
        <Field label={copy.documents.savedSearchName} required><input defaultValue={copy.documents.savedSearchNameValue} /></Field>
        <Field label={copy.documents.conditions}><div className="read-only-summary"><Filter size={16} /><span>{copy.documents.conditionFieldValue} · {copy.documents.conditionOperatorValue} · {query}</span></div></Field>
        <CheckRow label={copy.documents.includeFamily} checked={includeFamily} onChange={() => setIncludeFamily(!includeFamily)} />
      </Modal>
    </div>
  );
}
