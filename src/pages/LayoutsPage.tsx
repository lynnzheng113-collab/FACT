import { useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { copy } from "../constants/copy";
import { useAdministration } from "../state/Administration";
import { fieldTimestamp } from "../state/fields";
import { defaultSections, withExampleFields, type LayoutRecord } from "../state/layouts";
import { Button, Field, Modal, Panel, Toggle } from "../components/UI";
import { LayoutBuilder } from "../components/LayoutBuilder";
import { LayoutPreview } from "../components/LayoutPreview";
import "../styles/layouts.css";

const t = copy.layoutManagement, f = copy.fieldManagement, c = copy.common, w = copy.workspaceManagement;
type Draft = { id: string; name: string; order: string; copyPrevious: boolean; keywords: string; notes: string };
const blank = (): Draft => ({ id: "", name: "", order: "", copyPrevious: false, keywords: "", notes: "" });
const detail = (items: Array<[string, string | number]>) => <dl className="detail-grid">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value === "" ? f.empty : value}</dd></div>)}</dl>;

export function LayoutsPage({ notify }: { notify: (message: string) => void }) {
  const { layouts, setLayouts, fields, setFields } = useAdministration();
  const [view, setView] = useState<"list" | "form" | "detail">("list");
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<Draft>(blank);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [orderOpen, setOrderOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const history = useRef<HTMLDivElement>(null);
  const selected = layouts.find(layout => layout.id === selectedId);
  const sorted = [...layouts].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const change = (key: keyof Draft, value: string | boolean) => setDraft(current => ({ ...current, [key]: value }));
  const back = () => { setView("list"); setError(""); };
  const open = (id: string) => { setSelectedId(id); setView("detail"); setError(""); };
  const loadExamples = () => { setFields(current => withExampleFields(current)); notify(t.loadedFields); };
  const save = (mode: "save" | "new" | "back") => {
    const name = draft.name.trim();
    if (!name || !draft.order.trim()) return setError(w.requiredHint);
    if (!Number.isSafeInteger(Number(draft.order)) || Number(draft.order) < 0) return setError(f.invalidOrder);
    if (layouts.some(layout => layout.id !== draft.id && layout.name.toLowerCase() === name.toLowerCase())) return setError(t.duplicate);
    const previous = layouts.find(layout => layout.id === draft.id);
    const id = draft.id || crypto.randomUUID();
    const record: LayoutRecord = { ...draft, id, name, order: Number(draft.order), sections: previous?.sections ?? defaultSections(fields), createdOn: previous?.createdOn ?? fieldTimestamp(), modifiedOn: fieldTimestamp() };
    if (!record.copyPrevious) record.sections = record.sections.map(section => ({ ...section, items: section.items.map(item => ({ ...item, allowCopy: false })) }));
    setLayouts(current => previous ? current.map(layout => layout.id === id ? record : layout) : [...current, record]);
    notify(t.saved); setError("");
    if (mode === "new") { setDraft(blank()); setSelectedId(""); }
    else if (mode === "back") back();
    else open(id);
  };
  return <div className="layouts-page">
    {view === "list" && <>
      <div className="admin-toolbar"><Button variant="primary" icon={<Plus size={17} />} onClick={() => { setDraft(blank()); setView("form"); setError(""); }}>{t.new}</Button><strong>{t.all}</strong><Button onClick={loadExamples}>{t.loadFields}</Button><label className="admin-search"><Search size={16} /><input aria-label={t.filter} placeholder={t.filter} value={search} onChange={e => setSearch(e.target.value)} /></label></div>
      <Panel className="table-panel admin-list"><div className="table-scroll"><table><thead><tr>{t.columns.map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{sorted.filter(layout => layout.name.toLowerCase().includes(search.toLowerCase())).map(layout => <tr key={layout.id}><td>{f.document}</td><td><button className="table-link" onClick={() => open(layout.id)}>{layout.name}</button></td><td>{layout.order}</td><td>{layout.copyPrevious ? copy.userManagement.yes : copy.userManagement.no}</td></tr>)}{!sorted.some(layout => layout.name.toLowerCase().includes(search.toLowerCase())) && <tr><td colSpan={t.columns.length} className="admin-empty">{copy.userManagement.noData}</td></tr>}</tbody></table></div></Panel>
    </>}
    {view === "form" && <form noValidate onSubmit={e => { e.preventDefault(); save("save"); }}>
      <div className="admin-actions"><Button variant="primary" type="submit">{c.save}</Button><Button onClick={() => save("new")}>{w.saveAndNew}</Button><Button onClick={() => save("back")}>{w.saveAndBack}</Button><Button onClick={() => draft.id ? open(draft.id) : back()}>{c.cancel}</Button></div>
      {error && <p className="form-alert" role="alert">{error}</p>}
      <Panel title={t.information}><div className="admin-identity-form field-form">
        <Field label={f.objectType} required><select aria-label={f.objectType} defaultValue="document"><option value="document">{f.document}</option></select></Field>
        <Field label={w.name} required><input aria-label={w.name} value={draft.name} onChange={e => change("name", e.target.value)} autoFocus /></Field>
        <Field label={f.order} required><div className="field-order"><input type="number" min={t.defaultOrder} aria-label={f.order} value={draft.order} onChange={e => change("order", e.target.value)} /><Button onClick={() => setOrderOpen(true)}>{f.viewOrder}</Button></div></Field>
        <Field label={t.copyPrevious}><Toggle label={t.copyPrevious} checked={draft.copyPrevious} onChange={() => change("copyPrevious", !draft.copyPrevious)} /></Field>
        <Field label={t.overwrite}><span>{t.disabled}</span></Field>
        <Field label={t.applications}><span title={f.advancedUnavailable}><Button disabled>{w.select}</Button></span></Field>
      </div></Panel>
      <Panel title={w.other}><div className="admin-identity-form field-form"><Field label={w.keywords}><input aria-label={w.keywords} value={draft.keywords} onChange={e => change("keywords", e.target.value)} /></Field><Field label={w.notes}><textarea aria-label={w.notes} value={draft.notes} onChange={e => change("notes", e.target.value)} /></Field></div></Panel>
    </form>}
    {view === "detail" && selected && <>
      <div className="admin-actions"><Button variant="primary" onClick={() => { setDraft({ ...selected, order: String(selected.order) }); setView("form"); }}>{c.edit}</Button><Button onClick={() => setDeleteOpen(true)}>{w.delete}</Button><Button onClick={back}>{c.back}</Button><span title={f.advancedUnavailable}><Button disabled>{w.editPermissions}</Button></span><Button onClick={() => history.current?.scrollIntoView({ behavior: "smooth", block: "center" })}>{w.viewAudit}</Button></div>
      <div className="layout-detail"><div><Panel title={t.information}>{detail([[f.objectType, f.document], [w.name, selected.name], [f.order, selected.order], [t.copyPrevious, selected.copyPrevious ? copy.userManagement.yes : copy.userManagement.no], [t.overwrite, t.disabled], [t.applications, f.empty]])}</Panel><Panel title={w.other}>{detail([[w.keywords, selected.keywords], [w.notes, selected.notes]])}</Panel><div ref={history}><Panel title={w.recordHistory}>{detail([[w.createdBy, copy.workspace.user], [w.createdOn, selected.createdOn], [w.lastModifiedBy, copy.workspace.user], [w.lastModifiedOn, selected.modifiedOn]])}</Panel></div></div><Panel title={t.build}><div className="layout-detail-actions"><Button variant="primary" onClick={() => setBuilderOpen(true)}>{t.build}</Button><Button onClick={() => setPreviewOpen(true)}>{t.preview}</Button><Button onClick={loadExamples}>{t.loadFields}</Button></div></Panel></div>
    </>}
    <Modal open={orderOpen} title={f.orderReference} onClose={() => setOrderOpen(false)} footer={<Button onClick={() => setOrderOpen(false)}>{c.close}</Button>}><p>{t.orderReferenceHint}</p><table><thead><tr><th>{w.name}</th><th>{f.order}</th></tr></thead><tbody>{sorted.map(layout => <tr key={layout.id}><td>{layout.name}</td><td>{layout.order}</td></tr>)}{!sorted.length && <tr><td colSpan={2}>{copy.userManagement.noData}</td></tr>}</tbody></table></Modal>
    <Modal open={deleteOpen} title={t.deleteTitle} onClose={() => setDeleteOpen(false)} footer={<><Button onClick={() => setDeleteOpen(false)}>{c.cancel}</Button><Button variant="danger" onClick={() => { setLayouts(current => current.filter(layout => layout.id !== selectedId)); setDeleteOpen(false); back(); notify(f.deleted); }}>{w.delete}</Button></>}><p>{t.deleteHint}</p></Modal>
    {builderOpen && selected && <LayoutBuilder layout={selected} fields={fields} onClose={() => setBuilderOpen(false)} onSave={sections => { setLayouts(current => current.map(layout => layout.id === selectedId ? { ...layout, sections, modifiedOn: fieldTimestamp() } : layout)); notify(t.saved); }} />}
    {previewOpen && selected && <LayoutPreview layout={selected} fields={fields} onClose={() => setPreviewOpen(false)} />}
  </div>;
}
