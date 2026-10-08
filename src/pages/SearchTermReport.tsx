import { useMemo, useState } from "react";
import { Link2, Palette, Plus, Settings2 } from "lucide-react";
import { copy, type PageId } from "../constants/copy";
import { useAdministration } from "../state/Administration";
import { Button, Badge, Field, Modal, Panel } from "../components/UI";
import { TransferList } from "../components/TransferList";

type TermRow = { term: string; textColor: string; backgroundColor: string; status: "ready" | "complete" };
const highlightFields = copy.analytics.highlightFieldOptions.map(field => ({ ...field }));

export function SearchTermReport({ navigate, notify }: { navigate: (page: PageId) => void; notify?: (message: string) => void }) {
  const [terms, setTerms] = useState<TermRow[]>(() => copy.modules.reportTerms.split(/\r?\n/).filter(Boolean).map(term => ({ term, textColor: "#1d4ed8", backgroundColor: "#fff2a8", status: "ready" })));
  const [addOpen, setAddOpen] = useState(false);
  const [draftTerms, setDraftTerms] = useState("");
  const [searchableSet, setSearchableSet] = useState<string>(copy.analytics.reportSearchableSetValue);
  const [setOpen, setSetOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [linked, setLinked] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>(["extracted-text", "email-subject"]);
  const [ran, setRan] = useState(false);
  const { setDocumentView } = useAdministration();
  const hitsFor = (term: string) => copy.documents.docs.filter(doc => `${doc.file} ${doc.type}`.toLowerCase().includes(term.toLowerCase())).length;
  const totalHits = useMemo(() => ran ? terms.reduce((sum, row) => sum + hitsFor(row.term), 0) : 0, [terms, ran]);
  const addTerms = () => {
    const next = draftTerms.split(/\r?\n/).map(term => term.trim()).filter(Boolean).map(term => ({ term, textColor: "#1d4ed8", backgroundColor: "#fff2a8", status: "ready" as const }));
    setTerms(current => [...current, ...next.filter(item => !current.some(existing => existing.term.toLowerCase() === item.term.toLowerCase()))]);
    setDraftTerms(""); setAddOpen(false);
  };
  const runAll = () => { setRan(true); setTerms(current => current.map(row => ({ ...row, status: "complete" }))); notify?.(copy.analytics.reportRunSuccess); };
  const linkHighlight = () => { setLinked(true); setHighlightOpen(false); notify?.(copy.analytics.reportHighlightSuccess); };
  return <div className="term-report">
    <Panel title={copy.analytics.reportSetupTitle} subtitle={copy.analytics.reportSetupHint} className="analytics-subpanel">
      <div className="analytics-report-toolbar"><Field label={copy.analytics.reportSearchableSet}><button type="button" className="select-button" onClick={() => setSetOpen(true)}>{searchableSet}<span>⌄</span></button></Field><div className="analytics-report-toolbar__actions"><Button icon={<Plus size={16} />} onClick={() => setAddOpen(true)}>{copy.analytics.addTerms}</Button><Button variant="primary" icon={<Settings2 size={16} />} onClick={runAll}>{copy.analytics.runAllTerms}</Button></div></div>
      <div className="table-scroll"><table className="term-report-table"><thead><tr><th>{copy.analytics.term}</th><th>{copy.analytics.textColor}</th><th>{copy.analytics.backgroundColor}</th><th>{copy.analytics.termStatus}</th><th>{copy.analytics.reportColumnHits}</th><th>{copy.analytics.reportColumnAction}</th></tr></thead><tbody>{terms.map((row, index) => <tr key={`${row.term}-${index}`}><td><strong>{row.term}</strong></td><td><label className="color-control"><Palette size={14} /><input aria-label={`${copy.analytics.textColor} ${row.term}`} type="color" value={row.textColor} onChange={event => setTerms(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, textColor: event.target.value } : item))} /></label></td><td><label className="color-control"><Palette size={14} /><input aria-label={`${copy.analytics.backgroundColor} ${row.term}`} type="color" value={row.backgroundColor} onChange={event => setTerms(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, backgroundColor: event.target.value } : item))} /></label></td><td><Badge tone={row.status === "complete" ? "success" : "neutral"}>{row.status === "complete" ? copy.analytics.termComplete : copy.analytics.termReady}</Badge></td><td>{ran ? hitsFor(row.term) : copy.analytics.notStarted}</td><td><Button disabled={!ran || hitsFor(row.term) === 0} onClick={() => { setDocumentView({ query: row.term, folder: 0, includeFamily: true, reportTerm: row.term, searchIndexId: null }); navigate("documents"); }}>{copy.analytics.reportOpenDocuments}</Button></td></tr>)}{!terms.length && <tr><td colSpan={6}>{copy.analytics.reportNoTerms}</td></tr>}</tbody></table></div>
      <div className="term-report-summary"><span>{copy.analytics.reportResults}</span><strong>{terms.length} {copy.analytics.term}</strong><strong>{totalHits} {copy.analytics.reportColumnHits}</strong><small>{copy.analytics.reportRunHint}</small></div>
    </Panel>
    <Panel title={copy.analytics.persistentHighlight} subtitle={copy.analytics.persistentHighlightHint} className="analytics-subpanel"><div className="highlight-link-card"><div><span className="field__label">{copy.analytics.highlightSetName}</span><strong>{copy.analytics.highlightSetValue}</strong><small>{selectedFields.length} {copy.analytics.highlightFields}</small></div>{linked ? <Badge tone="success">{copy.analytics.highlightLinked}</Badge> : <Button variant="primary" icon={<Link2 size={16} />} onClick={() => setHighlightOpen(true)}>{copy.analytics.linkHighlight}</Button>}</div><p className="admin-note">{copy.analytics.highlightFieldsHint}</p>{linked && <div className="selected-field-chips">{selectedFields.map(id => <span key={id}>{highlightFields.find(field => field.id === id)?.label}</span>)}</div>}</Panel>

    <Modal open={addOpen} title={copy.analytics.addTerms} onClose={() => setAddOpen(false)} footer={<><Button onClick={() => setAddOpen(false)}>{copy.common.cancel}</Button><Button variant="primary" onClick={addTerms}>{copy.common.save}</Button></>}><p className="admin-note">{copy.analytics.addTermsHint}</p><Field label={copy.analytics.term} required><textarea value={draftTerms} onChange={event => setDraftTerms(event.target.value)} /></Field></Modal>
    <Modal open={setOpen} title={copy.analytics.selectSearchableSet} onClose={() => setSetOpen(false)} footer={<Button variant="primary" onClick={() => setSetOpen(false)}>{copy.common.confirm}</Button>}><div className="analytics-choice-list">{copy.analytics.searchableSets.map(option => <button type="button" className={`analytics-choice ${searchableSet === option ? "is-selected" : ""}`} key={option} onClick={() => setSearchableSet(option)}><strong>{option}</strong><small>{copy.analytics.searchableSetModalHint}</small></button>)}</div></Modal>
    <Modal open={highlightOpen} title={copy.analytics.selectHighlightFields} wide onClose={() => setHighlightOpen(false)} footer={<><Button onClick={() => setHighlightOpen(false)}>{copy.common.cancel}</Button><Button variant="primary" onClick={linkHighlight}>{copy.analytics.linkHighlight}</Button></>}><TransferList items={highlightFields} selectedIds={selectedFields} onChange={setSelectedFields} leftTitle={copy.analytics.highlightFields} rightTitle={copy.analytics.persistentHighlight} /></Modal>
  </div>;
}
