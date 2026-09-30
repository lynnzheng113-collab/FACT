import { createContext, useContext, useState, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { copy } from "../constants/copy";
import { Badge, Button, Field, Modal, PageHeader, Panel } from "../components/UI";

type Props = { onBack: () => void; notify: (message: string) => void };
type PasswordEntry = { id: string; type: string; description: string; passwords: string[]; file: string; custodian: string };
type TableSection = { title: string; columns: readonly string[]; rows: readonly (readonly string[])[] };
type ReportRun = { id: string; title: string; time: string; sets: string; sections: TableSection[]; note: string };
type Candidate = { name: string; size: number; readable: boolean };
type ReplacementRow = { candidate: Candidate; storageId: string; extension: string; originalExtension: string; originalSize: string; originalStatus: string; status: "success" | "warning" | "failed"; reason: string };
type Batch = { id: string; name: string; rows: ReplacementRow[]; state: "ready" | "complete" | "republished" };
function useSupportState() {
  const [fileStates, setFileStates] = useState<Record<string, keyof typeof copy.processing.sets.fileExceptionsView.statusLabels>>({});
  const [entries, setEntries] = useState<PasswordEntry[]>(copy.processing.passwordBank.rows.map(row => ({ ...row, passwords: [...row.passwords] })));
  const [audits, setAudits] = useState<string[][]>(copy.processing.passwordBank.auditRows.map(row => [...row]));
  const [reports, setReports] = useState<ReportRun[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  return { entries, setEntries, audits, setAudits, reports, setReports, batches, setBatches, fileStates, setFileStates };
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

async function readZip(file: File): Promise<Candidate[]> {
  const fail = () => new Error(copy.processing.replacementPage.invalidZip);
  const tail = new DataView(await file.slice(Math.max(0, file.size - 65557)).arrayBuffer());
  let end = tail.byteLength - 22;
  while (end >= 0 && tail.getUint32(end, true) !== 0x06054b50) end--;
  if (end < 0 || tail.getUint16(end + 4, true) !== 0 || tail.getUint16(end + 6, true) !== 0) throw fail();
  const count = tail.getUint16(end + 10, true), size = tail.getUint32(end + 12, true), offset = tail.getUint32(end + 16, true);
  if (!count || count > 10000 || size > 16777216 || offset + size > file.size) throw fail();
  const buffer = await file.slice(offset, offset + size).arrayBuffer(); const view = new DataView(buffer); const result: Candidate[] = []; let p = 0;
  for (let i = 0; i < count; i++) {
    if (p + 46 > size || view.getUint32(p, true) !== 0x02014b50) throw fail();
    const flags = view.getUint16(p + 8, true), method = view.getUint16(p + 10, true), bytes = view.getUint32(p + 24, true);
    const nameSize = view.getUint16(p + 28, true), extra = view.getUint16(p + 30, true), comment = view.getUint16(p + 32, true);
    if (p + 46 + nameSize + extra + comment > size || bytes === 0xffffffff) throw fail();
    const path = new TextDecoder().decode(new Uint8Array(buffer, p + 46, nameSize));
    if (!path.endsWith("/")) result.push({ name: path.split(/[\\/]/).pop()!, size: bytes, readable: !(flags & 1) && (method === 0 || method === 8) });
    p += 46 + nameSize + extra + comment;
  }
  if (!result.length) throw fail(); return result;
}

export function ReplacementFilesPage({ onBack }: Props) {
  const t = copy.processing.replacementPage;
  const { batches, setBatches, fileStates, setFileStates } = useSupport();
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [sample, setSample] = useState(false), [includeWarnings, setIncludeWarnings] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [system, setSystem] = useState("");
  const batch = batches.find(batch => batch.id === activeId);
  const begin = () => { setOpen(true); setFile(null); setSample(false); setError(""); setActiveId(null); setIncludeWarnings(false); setSystem(""); };
  const upload = async () => {
    if (!sample && (!file || !file.name.toLowerCase().endsWith(".zip") || file.size > t.maxBytes)) { setError(t.invalid); return; }
    setBusy(true); setError("");
    try {
      const candidates: readonly Candidate[] = sample ? t.sampleCandidates : await readZip(file!);
      const ids = candidates.map(candidate => candidate.name.slice(0, candidate.name.lastIndexOf(".")));
      const rows = candidates.map((candidate, i): ReplacementRow => {
        const storageId = ids[i], extension = candidate.name.slice(candidate.name.lastIndexOf(".")).toLowerCase();
        const fixture = t.originals.find(original => original.storageId === storageId);
        const originalFile = copy.processing.sets.fileExceptionsView.rows.find(row => row.storageId === storageId);
        const original = fixture ? { ...fixture, status: (originalFile && fileStates[originalFile.id]) || fixture.status } : undefined;
        const failed = !candidate.readable || ids.indexOf(storageId) !== i || !original || original.status !== "open";
        const warning = original && (original.extension !== extension || Math.abs(candidate.size - original.size) > original.size * 0.1);
        return { candidate, storageId, extension, originalExtension: original?.extension ?? t.dash, originalSize: original ? String(original.size) : t.dash, originalStatus: original ? copy.processing.sets.fileExceptionsView.statusLabels[original.status] : t.dash, status: failed ? "failed" : warning ? "warning" : "success", reason: !candidate.readable ? t.reasonExtract : ids.indexOf(storageId) !== i ? t.reasonDuplicate : !original ? t.reasonMissing : original.status !== "open" ? t.reasonResolved : warning ? t.reasonWarning : t.reasonMatch };
      });
      const next: Batch = { id: crypto.randomUUID(), name: sample ? t.sampleName : file!.name, rows, state: "ready" };
      setBatches(current => [next, ...current]); setActiveId(next.id); setSystem(t.uploadNotice);
    } catch (error) { setError(error instanceof Error ? error.message : t.readError); } finally { setBusy(false); }
  };
  const advance = (state: Batch["state"]) => {
    if (state === "complete" && batch) {
      const ids = batch.rows.filter(row => row.status !== "failed").map(row => row.storageId);
      setFileStates(current => ({ ...current, ...Object.fromEntries(copy.processing.sets.fileExceptionsView.rows.filter(row => ids.includes(row.storageId)).map(row => [row.id, "resolved" as const])) }));
    }
    setBatches(current => current.map(item => item.id === activeId ? { ...item, state } : item)); setSystem(state === "complete" ? t.replaceSystem : t.publishSystem);
  };
  const counts = (batch: Batch, status: ReplacementRow["status"]) => batch.rows.filter(row => row.status === status).length;
  const log = batch ? { title: t.log, columns: t.logColumns, rows: batch.rows.map(row => [row.candidate.name, row.extension, String(row.candidate.size), row.storageId, row.originalExtension, row.originalSize, row.originalStatus, t[row.status], row.reason]) } : null;
  return <div className="page processing-support-page"><Back onBack={onBack} /><PageHeader title={t.title} subtitle={t.subtitle} ids={copy.processing.ids} />
    <Panel title={t.title} actions={<Button variant="primary" onClick={begin}>{t.new}</Button>}><div className="table-scroll"><table><thead><tr>{t.columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{batches.map(batch => <tr key={batch.id}><td><button className="table-link" onClick={() => { setActiveId(batch.id); setOpen(true); setSystem(""); setIncludeWarnings(false); }}>{batch.name}</button></td><td><Badge tone={batch.state === "ready" ? "warning" : "success"}>{t[batch.state]}</Badge></td><td>{counts(batch, "success")}</td><td>{counts(batch, "warning")}</td><td>{counts(batch, "failed")}</td></tr>)}{!batches.length && <tr><td colSpan={t.columns.length}>{t.empty}</td></tr>}</tbody></table></div></Panel>
    <Modal open={open} wide title={t.new} onClose={() => { if (!busy) setOpen(false); }} footer={<><Button disabled={busy} onClick={() => setOpen(false)}>{copy.common.close}</Button>{batch?.state === "ready" && <Button variant="primary" disabled={(!counts(batch, "success") && !counts(batch, "warning")) || (counts(batch, "warning") > 0 && !includeWarnings)} onClick={() => advance("complete")}>{t.retry}</Button>}{batch?.state === "complete" && <Button variant="primary" onClick={() => advance("republished")}>{t.republish}</Button>}</>}>
      {!batch ? <div className="processing-support-form"><p>{t.zipHint}</p><Field label={t.select}><input aria-label={t.select} type="file" accept=".zip" disabled={busy} onChange={e => { setFile(e.target.files?.[0] ?? null); setSample(false); setError(""); }} /></Field><Button disabled={busy} onClick={() => { setSample(true); setFile(null); setError(""); }}>{t.demo}</Button>{sample && <strong>{t.sampleName}</strong>}<Button variant="primary" disabled={busy || (!sample && !file)} onClick={() => void upload()}>{t.upload}</Button>{error && <p role="alert" className="processing-form-error">{error}</p>}</div> : <><div className="processing-replacement-counts">{(["success", "warning", "failed"] as const).map(status => <div key={status}><Badge tone={status === "success" ? "success" : status === "warning" ? "warning" : "danger"}>{t[status]}</Badge><strong>{counts(batch, status)}</strong></div>)}</div>{log && <div className="processing-replacement-log"><Table section={log} /></div>}<Button onClick={() => log && DownloadCSV(t.exportName, [log.columns, ...log.rows])}>{t.export}</Button><p>{t.retryHint}</p>{batch.state === "ready" && counts(batch, "warning") > 0 && <label className="processing-support-choice"><input type="checkbox" checked={includeWarnings} onChange={e => setIncludeWarnings(e.target.checked)} />{t.warningConfirm}</label>}{batch.state !== "ready" && <Badge tone="success">{t[batch.state]}</Badge>}</>}
      {system && <div className="processing-system-notice" role="status"><strong>{t.systemTitle}</strong><p>{system}</p></div>}
    </Modal>
  </div>;
}
