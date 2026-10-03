import { createContext, useContext, useState, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { copy } from "../constants/copy";
import { Badge, Button, Field, Modal, PageHeader, Panel } from "../components/UI";

type Props = { onBack: () => void; notify: (message: string) => void };
type PasswordEntry = { id: string; type: string; description: string; passwords: string[]; file: string; custodian: string };
type TableSection = { title: string; columns: readonly string[]; rows: readonly (readonly string[])[] };
type ReportRun = { id: string; title: string; time: string; sets: string; sections: TableSection[]; note: string };
function useSupportState() {
  const [fileStates, setFileStates] = useState<Record<string, keyof typeof copy.processing.sets.fileExceptionsView.statusLabels>>({});
  const [entries, setEntries] = useState<PasswordEntry[]>(copy.processing.passwordBank.rows.map(row => ({ ...row, passwords: [...row.passwords] })));
  const [audits, setAudits] = useState<string[][]>(copy.processing.passwordBank.auditRows.map(row => [...row]));
  const [reports, setReports] = useState<ReportRun[]>([]);
  return { entries, setEntries, audits, setAudits, reports, setReports, fileStates, setFileStates };
}
const SupportContext = createContext<ReturnType<typeof useSupportState> | null>(null);
export function ProcessingSupportProvider({ children }: { children: ReactNode }) { const state = useSupportState(); return <SupportContext.Provider value={state}>{children}</SupportContext.Provider>; }
const useSupport = () => useContext(SupportContext)!;
export const useProcessingFileState = () => { const { fileStates, setFileStates } = useSupport(); return { fileStates, setFileStates }; };
function DownloadCSV(name: string, rows: readonly (readonly string[])[]) {
  const csv = rows.map(row => row.map(cell => `"${(/^[=+@-]/.test(cell) ? "'" : "") + cell.replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Table({ section }: { section: TableSection }) { return <section className="processing-support-section"><h3>{section.title}</h3><div className="table-scroll"><table><thead><tr>{section.columns.map((column, i) => <th key={i}>{column}</th>)}</tr></thead><tbody>{section.rows.map((row, i) => <tr key={i}>{row.map((value, j) => <td key={j}>{value}</td>)}</tr>)}</tbody></table></div></section>; }
function Back({ onBack }: { onBack: () => void }) { return <div className="module-toolbar"><Button onClick={onBack} icon={<ArrowLeft size={16} />}>{copy.processing.backToDirectory}</Button></div>; }

export function PasswordBankPage({ onBack, notify }: Props) {
  const t = copy.processing.passwordBank;
  const { entries, setEntries, audits, setAudits } = useSupport();
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<PasswordEntry | null>(null);
  const [passwords, setPasswords] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const edit = (entry?: PasswordEntry) => { setEditing(entry ? { ...entry } : { id: "", description: "", type: "passwords", passwords: [], file: "", custodian: "" }); setPasswords(entry?.passwords.join("\n") ?? ""); setShow(false); setError(false); };
  const type = t.types.find(type => type.id === editing?.type) ?? t.types[0];
  const hint = type.id === "lotus" ? t.lotusHint : type.id === "email" ? t.emailHint : type.id === "ad1" ? t.ad1Hint : t.passwordHint;
  const save = () => {
    if (!editing) return;
    const lines = passwords.split(/\r?\n/).filter(line => line.length > 0);
    const extension = editing.file.slice(editing.file.lastIndexOf(".")).toLowerCase();
    const valid = type.id === "passwords" ? lines.length > 0 : type.id === "lotus" ? editing.file.toLowerCase() === "user.id" : Boolean(editing.file) && type.accept.split(",").includes(extension);
    if (!valid) { setError(true); return; }
    const entry = { ...editing, id: editing.id || crypto.randomUUID(), passwords: lines };
    setEntries(current => editing.id ? current.map(item => item.id === editing.id ? entry : item) : [...current, entry]);
    setAudits(current => [[new Date().toISOString(), editing.id ? t.updateAction : t.createAction, entry.description], ...current]);
    setEditing(null); notify(t.saved);
  };
  return <div className="page processing-support-page"><Back onBack={onBack} /><PageHeader title={t.title} subtitle={t.subtitle} ids={copy.processing.ids} />
    <Panel title={t.entries} actions={<><Button variant="primary" onClick={() => edit()}>{t.new}</Button><Button disabled={!selected.length} onClick={() => setDeleteOpen(true)}>{t.delete}</Button><Button onClick={() => setAuditOpen(true)}>{t.audit}</Button></>}>
      <p className="admin-note">{t.demo}</p><div className="table-scroll"><table><thead><tr><th><input type="checkbox" aria-label={copy.common.all} checked={entries.length > 0 && selected.length === entries.length} onChange={e => setSelected(e.target.checked ? entries.map(row => row.id) : [])} /></th>{t.columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{entries.map(row => <tr key={row.id}><td><input type="checkbox" aria-label={row.description || row.id} checked={selected.includes(row.id)} onChange={() => setSelected(current => current.includes(row.id) ? current.filter(id => id !== row.id) : [...current, row.id])} /></td><td><button className="table-link" onClick={() => edit(row)}>{row.description || row.id}</button></td><td>{t.types.find(type => type.id === row.type)?.label}</td><td>{row.passwords.length}</td><td>{row.file || t.dash}</td><td>{row.custodian || t.dash}</td></tr>)}{!entries.length && <tr><td colSpan={t.columns.length + 1}>{t.empty}</td></tr>}</tbody></table></div>
    </Panel>
    <Modal open={Boolean(editing)} title={editing?.id ? t.edit : t.new} onClose={() => setEditing(null)} footer={<><Button onClick={() => setEditing(null)}>{copy.common.cancel}</Button><Button variant="primary" onClick={save}>{copy.common.save}</Button></>}>
      {editing && <div className="processing-support-form"><Field label={t.type}><select aria-label={t.type} value={editing.type} onChange={e => { setEditing({ ...editing, type: e.target.value, file: "", custodian: "" }); setError(false); }}>{t.types.map(type => <option value={type.id} key={type.id}>{type.label}</option>)}</select></Field><Field label={t.description}><input aria-label={t.description} value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} /></Field><p>{hint}</p><Field label={t.passwords} required={type.id === "passwords"}><textarea aria-label={t.passwords} className={show ? "" : "processing-password-mask"} value={passwords} onChange={e => setPasswords(e.target.value)} autoComplete="off" spellCheck={false} /></Field><p className="admin-note">{t.lineHint}</p><Button onClick={() => setShow(!show)}>{show ? t.hide : t.show}</Button>{type.id !== "passwords" && <Field label={t.upload} required><input aria-label={t.upload} key={type.id} type="file" accept={type.accept} onChange={e => setEditing({ ...editing, file: e.target.files?.[0]?.name ?? "" })} /><small>{editing.file || t.uploadHint}</small></Field>}{type.id === "lotus" && <Field label={t.custodian}><select aria-label={t.custodian} value={editing.custodian} onChange={e => setEditing({ ...editing, custodian: e.target.value })}><option value="">{t.none}</option>{copy.processing.sets.fileExceptionsView.custodianOptions.slice(1).map(name => <option key={name}>{name}</option>)}</select></Field>}{error && <p role="alert" className="processing-form-error">{t.required}</p>}</div>}
    </Modal>
    <Modal open={deleteOpen} title={t.deleteTitle} onClose={() => setDeleteOpen(false)} footer={<><Button onClick={() => setDeleteOpen(false)}>{copy.common.cancel}</Button><Button variant="danger" onClick={() => { setEntries(current => current.filter(row => !selected.includes(row.id))); setAudits(current => [...entries.filter(row => selected.includes(row.id)).map(row => [new Date().toISOString(), t.deleteAction, row.description]), ...current]); setSelected([]); setDeleteOpen(false); notify(t.deleted); }}>{t.delete}</Button></>}><p>{t.deleteHint}</p></Modal>
    <Modal open={auditOpen} title={t.audit} onClose={() => setAuditOpen(false)} footer={<Button onClick={() => setAuditOpen(false)}>{copy.common.close}</Button>}><Table section={{ title: t.audit, columns: t.auditColumns, rows: audits }} /></Modal>
  </div>;
}

export function ReportsPage({ onBack, notify, initialReport = "inventory-summary" }: Props & { initialReport?: string }) {
  const t = copy.processing.reportsPage;
  const { reports, setReports } = useSupport();
  const [reportId, setReportId] = useState(initialReport);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<ReportRun | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const report = t.reports.find(report => report.id === reportId) ?? t.reports[0];
  const eligible = t.sets.filter(set => set.stage > 0 && set.stage >= report.minStage);
  const generate = () => {
    const sets = eligible.filter(set => selected.includes(set.id)); if (!sets.length) return;
    const sections: TableSection[] = sets.flatMap(set => report.sections.map((section, index) => ({ title: `${set.name} · ${section.title}`, columns: section.columns, rows: report.id === "document-exception" && index === 1 && set.stage < 3 ? [[t.notPublished, copy.processing.sets.zero]] : section.rows.map(row => row.map(value => value.replaceAll("{custodian}", set.custodian).replaceAll("{set}", set.name))) })));
    sections.push({ title: t.scope, columns: t.scopeColumns, rows: sets.map(set => [set.name, set.custodian, set.path]) });
    const run = { id: crypto.randomUUID(), title: report.title, time: new Date().toISOString(), sets: sets.map(set => set.name).join(", "), sections, note: report.note };
    setResult(run); setReports(current => [run, ...current]); notify(t.generated);
  };
  return <div className="page processing-support-page"><Back onBack={onBack} /><PageHeader title={t.title} subtitle={t.subtitle} ids={copy.processing.ids} />
    {!result ? <Panel title={t.selectReport} actions={<Button onClick={() => setHistoryOpen(true)}>{t.history}</Button>}><div className="processing-report-selector"><Field label={t.selectReport}><select aria-label={t.selectReport} size={14} value={reportId} onChange={e => { setReportId(e.target.value); setSelected([]); }}>{t.reports.map(report => <option key={report.id} value={report.id}>{report.title}</option>)}</select></Field><section><h3>{t.selectSet}</h3><p className="admin-note">{t.eligibility}</p>{eligible.map(set => <label className="processing-support-choice" key={set.id}><input type="checkbox" checked={selected.includes(set.id)} onChange={() => setSelected(current => current.includes(set.id) ? current.filter(id => id !== set.id) : [...current, set.id])} /><span><strong>{set.name}</strong><small>{set.label}</small></span></label>)}{!eligible.length && <p>{t.noSets}</p>}<Button disabled={!selected.some(id => eligible.some(set => set.id === id))} variant="primary" onClick={generate}>{t.generate}</Button></section></div></Panel> : <Panel title={result.title} actions={<><Button onClick={() => setResult(null)}>{t.new}</Button><Button onClick={() => DownloadCSV(t.exportName, [[result.title, result.time, result.sets], ...result.sections.flatMap(section => [[section.title], section.columns, ...section.rows])])}>{t.export}</Button><Button onClick={() => setHistoryOpen(true)}>{t.history}</Button></>}><p className="admin-note">{t.sample} · {result.time}</p><p>{result.note}</p>{result.sections.map((section, i) => <Table key={i} section={section} />)}</Panel>}
    <Modal open={historyOpen} title={t.history} onClose={() => setHistoryOpen(false)} footer={<Button onClick={() => setHistoryOpen(false)}>{copy.common.close}</Button>}><div className="table-scroll"><table><thead><tr>{t.historyColumns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{reports.map(run => <tr key={run.id}><td>{run.time}</td><td><button className="table-link" onClick={() => { setResult(run); setHistoryOpen(false); }}>{run.title}</button></td><td>{run.sets}</td></tr>)}{!reports.length && <tr><td colSpan={t.historyColumns.length}>{t.empty}</td></tr>}</tbody></table></div></Modal>
  </div>;
}
