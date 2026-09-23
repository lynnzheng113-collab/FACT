import { useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { copy } from "../constants/copy";
import { useAdministration } from "../state/Administration";
import { fieldTimestamp, type FieldRecord, type FieldCategory } from "../state/fields";
import { Button, Field, Modal, PageHeader, Panel, Tabs } from "../components/UI";
import { FieldChoices } from "../components/FieldChoices";
import { TransferList } from "../components/TransferList";
import "../styles/users.css";
import "../styles/fields.css";

const t = copy.fieldManagement, c = copy.common, w = copy.workspaceManagement;
type Entity = "fields" | "categories" | "choices";
type SaveMode = "save" | "new" | "back";
type Draft = { id: string; name: string; type: string; order: string };
const blank = (): Draft => ({ id: "", name: "", type: "", order: String(t.defaultOrder) });
const typeName = (type: string) => t.typeOptions.find(option => option.id === type)?.label ?? t.empty;
const details = (items: ReadonlyArray<readonly [string, string | number]>) => <dl className="detail-grid">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value === "" ? t.empty : value}</dd></div>)}</dl>;

export function FieldsPage({ notify }: { notify: (message: string) => void }) {
  const { fields, setFields, fieldCategories, setFieldCategories } = useAdministration();
  const [entity, setEntity] = useState<Entity>("fields");
  const [view, setView] = useState<"list" | "form" | "detail">("list");
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<Draft>(blank);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [orderOpen, setOrderOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [checked, setChecked] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);
  const selectedField = fields.find(field => field.id === selectedId);
  const selectedCategory = fieldCategories.find(category => category.id === selectedId);
  const choiceFields = fields.filter(field => field.type === "multiple");
  const choiceField = choiceFields.find(field => field.id === selectedId) ?? choiceFields[0];
  const sortedCategories = [...fieldCategories].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const activeRecord = entity === "categories" ? selectedCategory : selectedField;
  const back = () => { setView("list"); setError(""); setChecked([]); };
  const openRecord = (id: string, nextEntity: Entity = entity) => { setEntity(nextEntity); setSelectedId(id); setView("detail"); setError(""); setChecked([]); window.scrollTo(0, 0); };
  const startNew = () => { setDraft(blank()); setError(""); setView("form"); };
  const startEdit = () => {
    if (!activeRecord) return;
    setDraft({ id: activeRecord.id, name: activeRecord.name, type: selectedField?.type ?? "", order: String(selectedCategory?.order ?? t.defaultOrder) });
    setError(""); setView("form");
  };
  const changeDraft = (key: keyof Draft, value: string) => setDraft(current => ({ ...current, [key]: value }));
  const save = (mode: SaveMode) => {
    const name = draft.name.trim();
    if (!name || (entity === "fields" && !draft.type)) return setError(w.requiredHint);
    const records = entity === "fields" ? fields : fieldCategories;
    if (records.some(record => record.id !== draft.id && record.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return setError(entity === "fields" ? t.duplicateField : t.duplicateCategory);
    if (entity === "categories" && (!draft.order.trim() || !Number.isSafeInteger(Number(draft.order)) || Number(draft.order) < 0)) return setError(t.invalidOrder);
    const id = draft.id || crypto.randomUUID();
    const stamp = fieldTimestamp();
    if (entity === "fields") {
      const previous = fields.find(field => field.id === id);
      const record: FieldRecord = { id, name, type: draft.type, choices: previous?.choices ?? [], createdOn: previous?.createdOn || stamp, modifiedOn: stamp };
      setFields(current => draft.id ? current.map(field => field.id === id ? record : field) : [...current, record]);
      notify(t.fieldSaved);
    } else {
      const previous = fieldCategories.find(category => category.id === id);
      const record: FieldCategory = { id, name, order: Number(draft.order), fieldIds: previous?.fieldIds ?? [], createdOn: previous?.createdOn || stamp, modifiedOn: stamp };
      setFieldCategories(current => draft.id ? current.map(category => category.id === id ? record : category) : [...current, record]);
      notify(t.categorySaved);
    }
    setError("");
    if (mode === "new") { setDraft(blank()); setSelectedId(""); window.scrollTo(0, 0); }
    else if (mode === "back") back();
    else openRecord(id);
  };
  const remove = () => {
    if (entity === "fields") {
      setFields(current => current.filter(field => field.id !== selectedId));
      setFieldCategories(current => current.map(category => category.fieldIds.includes(selectedId) ? { ...category, fieldIds: category.fieldIds.filter(id => id !== selectedId), modifiedOn: fieldTimestamp() } : category));
    } else setFieldCategories(current => current.filter(category => category.id !== selectedId));
    setDeleteOpen(false); back(); notify(t.deleted);
  };
  const updateChoices = (field: FieldRecord, choices: FieldRecord["choices"]) => {
    setFields(current => current.map(item => item.id === field.id ? { ...item, choices, modifiedOn: fieldTimestamp() } : item)); notify(t.choicesSaved);
  };
  const fieldTable = (rows: FieldRecord[], selectable = false) => <div className="table-scroll"><table><thead><tr>
    {selectable && <th><input type="checkbox" aria-label={t.selectFields} checked={rows.length > 0 && rows.every(field => checked.includes(field.id))} onChange={e => setChecked(e.target.checked ? rows.map(field => field.id) : [])} /></th>}
    {t.columns.map(label => <th key={label}>{label}</th>)}
  </tr></thead><tbody>{rows.map(field => <tr key={field.id}>
    {selectable && <td><input type="checkbox" aria-label={field.name} checked={checked.includes(field.id)} onChange={e => setChecked(current => e.target.checked ? [...current, field.id] : current.filter(id => id !== field.id))} /></td>}
    <td><button className="table-link" onClick={() => openRecord(field.id, "fields")}>{field.name}</button></td><td>{t.document}</td><td>{typeName(field.type)}</td><td><div className="field-links">{sortedCategories.filter(category => category.fieldIds.includes(field.id)).map(category => <button key={category.id} className="table-link" onClick={() => openRecord(category.id, "categories")}>{category.name}</button>)}</div></td>
  </tr>)}{!rows.length && <tr><td colSpan={t.columns.length + Number(selectable)} className="admin-empty">{copy.userManagement.noData}</td></tr>}</tbody></table></div>;
  const history = activeRecord && <div ref={historyRef}><Panel title={w.recordHistory}>{details([[w.createdBy, activeRecord.createdOn ? copy.workspace.user : t.empty], [w.createdOn, activeRecord.createdOn], [w.lastModifiedBy, activeRecord.modifiedOn ? copy.workspace.user : t.empty], [w.lastModifiedOn, activeRecord.modifiedOn]])}</Panel></div>;
  const settings = <><Panel><div className="tabs"><span className="field-settings">{t.fieldSettings}</span><button type="button" disabled title={t.advancedUnavailable}>{t.advancedSettings}</button></div>{details(t.settings)}</Panel><Panel title={t.dashboard}>{details(t.dashboardSettings)}</Panel></>;
  return <div className="page users-admin fields-admin">
    <PageHeader title={t.title} subtitle={t.subtitle} ids={t.ids} priorities={[]} />
    <Tabs items={[t.choices, t.categories, t.fields]} active={t[entity]} onChange={label => { setEntity(label === t.fields ? "fields" : label === t.categories ? "categories" : "choices"); setSelectedId(""); setFilter(""); back(); }} />
    {entity !== "choices" && view === "list" && <>
      <div className="admin-toolbar"><Button variant="primary" icon={<Plus size={17} />} onClick={startNew}>{entity === "fields" ? t.newField : t.newCategory}</Button><strong>{entity === "fields" ? t.allFields : t.allCategories}</strong><label className="admin-search"><Search size={16} /><input aria-label={entity === "fields" ? t.filterFields : t.filterCategories} placeholder={entity === "fields" ? t.filterFields : t.filterCategories} value={filter} onChange={e => setFilter(e.target.value)} /></label></div>
      <Panel className="table-panel admin-list">{entity === "fields" ? fieldTable(fields.filter(field => `${field.name} ${typeName(field.type)}`.toLowerCase().includes(filter.toLowerCase()))) : <div className="table-scroll"><table><thead><tr>{t.categoryColumns.map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{sortedCategories.filter(category => category.name.toLowerCase().includes(filter.toLowerCase())).map(category => <tr key={category.id}><td><button className="table-link" onClick={() => openRecord(category.id)}>{category.name}</button></td><td>{category.order}</td><td><div className="field-links">{category.fieldIds.map(id => fields.find(field => field.id === id)).filter((field): field is FieldRecord => !!field).map(field => <button key={field.id} className="table-link" onClick={() => openRecord(field.id, "fields")}>{field.name}</button>)}</div></td></tr>)}{!sortedCategories.some(category => category.name.toLowerCase().includes(filter.toLowerCase())) && <tr><td colSpan={t.categoryColumns.length} className="admin-empty">{copy.userManagement.noData}</td></tr>}</tbody></table></div>}</Panel>
    </>}
    {entity !== "choices" && view === "form" && <form noValidate onSubmit={e => { e.preventDefault(); save("save"); }}>
      <div className="admin-actions"><Button type="submit" variant="primary">{c.save}</Button><Button onClick={() => save("new")}>{w.saveAndNew}</Button><Button onClick={() => save("back")}>{w.saveAndBack}</Button><Button onClick={() => draft.id ? openRecord(draft.id) : back()}>{c.cancel}</Button></div>
      {error && <p role="alert" className="form-alert">{error}</p>}
      <Panel title={entity === "fields" ? t.fieldInformation : t.categoryDetails}><div className="admin-identity-form field-form">
        <Field label={w.name} required><input aria-label={w.name} value={draft.name} onChange={e => changeDraft("name", e.target.value)} autoFocus /></Field>
        {entity === "fields" ? <><Field label={t.objectType} required><select aria-label={t.objectType} value="document" onChange={() => {}}><option value="document">{t.document}</option></select></Field><Field label={t.fieldType} required><select aria-label={t.fieldType} value={draft.type} disabled={!!draft.id} onChange={e => changeDraft("type", e.target.value)}><option value="">{w.select}</option>{t.typeOptions.map(option => <option key={option.id} value={option.id} disabled={option.id !== "multiple"}>{option.label}</option>)}</select></Field>{!draft.type && <p className="admin-note">{t.typeHint}</p>}</> : <Field label={t.order} required><div className="field-order"><input type="number" aria-label={t.order} value={draft.order} min={t.defaultOrder} onChange={e => changeDraft("order", e.target.value)} /><Button onClick={() => setOrderOpen(true)}>{t.viewOrder}</Button></div></Field>}
      </div></Panel>
      {entity === "fields" && draft.type === "multiple" && settings}
    </form>}
    {entity !== "choices" && view === "detail" && activeRecord && <>
      <div className="admin-actions"><Button variant="primary" onClick={startEdit}>{c.edit}</Button><Button onClick={() => setDeleteOpen(true)}>{w.delete}</Button><Button onClick={back}>{c.back}</Button><span title={t.advancedUnavailable}><Button disabled>{w.editPermissions}</Button></span><Button onClick={() => historyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}>{w.viewAudit}</Button></div>
      {entity === "fields" && selectedField ? <>
        <Panel title={t.fieldInformation}>{details([[w.name, selectedField.name], [t.objectType, t.document], [t.fieldType, typeName(selectedField.type)]])}</Panel>
        {selectedField.type === "multiple" && <>{settings}<FieldChoices key={selectedField.id} choices={selectedField.choices} onChange={choices => updateChoices(selectedField, choices)} /></>}
      </> : selectedCategory && <>
        <Panel title={t.categoryDetails}>{details([[w.name, selectedCategory.name], [t.order, selectedCategory.order]])}</Panel>
        <Panel title={t.fields} className="table-panel" actions={<><Button onClick={() => { setLinks([...selectedCategory.fieldIds]); setLinkOpen(true); }}>{t.link}</Button><Button disabled={!checked.length} onClick={() => { setFieldCategories(current => current.map(category => category.id === selectedId ? { ...category, fieldIds: category.fieldIds.filter(id => !checked.includes(id)), modifiedOn: fieldTimestamp() } : category)); setChecked([]); notify(t.unlinked); }}>{t.unlink}</Button></>}>{fieldTable(fields.filter(field => selectedCategory.fieldIds.includes(field.id)), true)}</Panel>
      </>}
      {history}
    </>}
    {entity === "choices" && <>
      <div className="admin-toolbar"><Field label={t.chooseField}><select aria-label={t.chooseField} value={choiceField?.id ?? ""} onChange={e => setSelectedId(e.target.value)}>{!choiceFields.length && <option value="">{w.select}</option>}{choiceFields.map(field => <option key={field.id} value={field.id}>{field.name}</option>)}</select></Field></div>
      {choiceField ? <FieldChoices key={choiceField.id} choices={choiceField.choices} onChange={choices => updateChoices(choiceField, choices)} /> : <Panel><p className="admin-empty">{t.noChoiceField}</p><Button variant="primary" onClick={() => { setEntity("fields"); startNew(); }}>{t.newField}</Button></Panel>}
    </>}
    <p className="admin-note">{t.localOnly}</p>
    <Modal open={orderOpen} title={t.orderReference} onClose={() => setOrderOpen(false)} footer={<Button onClick={() => setOrderOpen(false)}>{c.close}</Button>}><p className="admin-note">{t.orderHint}</p><table><thead><tr><th>{w.name}</th><th>{t.order}</th></tr></thead><tbody>{sortedCategories.map(category => <tr key={category.id}><td>{category.name}</td><td>{category.order}</td></tr>)}</tbody></table></Modal>
    {linkOpen && selectedCategory && <Modal open title={t.selectFieldsTitle} wide onClose={() => setLinkOpen(false)} footer={<><Button variant="primary" onClick={() => { setFieldCategories(current => current.map(category => category.id === selectedId ? { ...category, fieldIds: [...links], modifiedOn: fieldTimestamp() } : category)); setChecked([]); setLinkOpen(false); notify(t.linked); }}>{copy.userManagement.apply}</Button><Button onClick={() => setLinkOpen(false)}>{c.cancel}</Button></>}><TransferList items={fields.map(field => ({ id: field.id, label: field.name, detail: typeName(field.type) }))} selectedIds={links} onChange={setLinks} leftTitle={t.availableFields} rightTitle={t.selectedFields} /></Modal>}
    <Modal open={deleteOpen} title={t.deleteTitle} onClose={() => setDeleteOpen(false)} footer={<><Button onClick={() => setDeleteOpen(false)}>{c.cancel}</Button><Button variant="danger" onClick={remove}>{w.delete}</Button></>}><p>{entity === "fields" ? t.deleteFieldHint : t.deleteCategoryHint}</p></Modal>
  </div>;
}
