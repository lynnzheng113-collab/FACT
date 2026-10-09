import { useRef, useState } from "react";
import { Copy, Download, Pencil, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { copy } from "../constants/copy";
import { useAdministration } from "../state/Administration";
import { fieldTimestamp, type FieldRecord, type FieldCategory } from "../state/fields";
import { createId } from "../state/ids";
import { Button, Field, IconButton, Modal, PageHeader, Panel, Tabs, Toggle } from "../components/UI";
import { LayoutsPage } from "./LayoutsPage";
import { FieldChoices } from "../components/FieldChoices";
import { TransferList } from "../components/TransferList";
import "../styles/users.css";
import "../styles/fields.css";

const t = copy.fieldManagement, c = copy.common, w = copy.workspaceManagement;
type Entity = "fields" | "categories" | "choices" | "layouts";
type SaveMode = "save" | "new" | "back";
type Draft = { id: string; name: string; type: string; order: string };
type FieldPermission = { view: boolean; edit: boolean; delete: boolean; add: boolean };
const blank = (): Draft => ({ id: "", name: "", type: "", order: String(t.defaultOrder) });
const defaultFieldPermission: FieldPermission = { view: true, edit: false, delete: false, add: false };
const typeName = (type: string) => t.typeOptions.find(option => option.id === type)?.label ?? t.empty;
const details = (items: ReadonlyArray<readonly [string, string | number]>) => <dl className="detail-grid">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value === "" ? t.empty : value}</dd></div>)}</dl>;

export function FieldsPage({ notify }: { notify: (message: string) => void }) {
  const { fields, setFields, fieldCategories, setFieldCategories, layouts, groups, users, activeWorkspaceId } = useAdministration();
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
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [fieldPermissions, setFieldPermissions] = useState<Record<string, Record<string, FieldPermission>>>({});
  const [fieldPermissionOverrides, setFieldPermissionOverrides] = useState<Record<string, boolean>>({});
  const [permissionFieldId, setPermissionFieldId] = useState("");
  const [permissionGroupId, setPermissionGroupId] = useState("");
  const [permissionOverride, setPermissionOverride] = useState(false);
  const [permissionDraft, setPermissionDraft] = useState<FieldPermission>(defaultFieldPermission);
  const historyRef = useRef<HTMLDivElement>(null);
  const selectedField = fields.find(field => field.id === selectedId);
  const selectedCategory = fieldCategories.find(category => category.id === selectedId);
  const choiceFields = fields.filter(field => field.type === "multiple");
  const choiceField = choiceFields.find(field => field.id === selectedId) ?? choiceFields[0];
  const sortedCategories = [...fieldCategories].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const activeRecord = entity === "categories" ? selectedCategory : selectedField;
  const permissionField = fields.find(field => field.id === permissionFieldId);
  const permissionGroups = groups.filter(group => activeWorkspaceId ? group.workspaceIds.includes(activeWorkspaceId) : false);
  const permissionGroup = permissionGroups.find(group => group.id === permissionGroupId);
  const permissionUsers = permissionGroup ? users.filter(user => permissionGroup.userIds.includes(user.id)) : [];
  const back = () => { setView("list"); setError(""); setChecked([]); };
  const openRecord = (id: string, nextEntity: Entity = entity) => { setEntity(nextEntity); setSelectedId(id); setView("detail"); setError(""); setChecked([]); window.scrollTo(0, 0); };
  const startNew = () => { setDraft(blank()); setError(""); setView("form"); };
  const startEdit = () => {
    if (!activeRecord) return;
    setDraft({ id: activeRecord.id, name: activeRecord.name, type: selectedField?.type ?? "", order: String(selectedCategory?.order ?? t.defaultOrder) });
    setError(""); setView("form");
  };
  const editField = (field: FieldRecord) => {
    setEntity("fields"); setSelectedId(field.id);
    setDraft({ id: field.id, name: field.name, type: field.type, order: String(t.defaultOrder) });
    setError(""); setChecked([]); setView("form"); window.scrollTo(0, 0);
  };
  const openFieldPermissions = (field: FieldRecord) => {
    setPermissionFieldId(field.id);
    const group = permissionGroups[0];
    setPermissionGroupId(group?.id ?? "");
    setPermissionOverride(fieldPermissionOverrides[field.id] ?? false);
    setPermissionDraft(fieldPermissions[field.id]?.[group?.id ?? ""] ?? defaultFieldPermission);
  };
  const changePermissionGroup = (groupId: string) => {
    setPermissionGroupId(groupId);
    setPermissionDraft(fieldPermissions[permissionFieldId]?.[groupId] ?? defaultFieldPermission);
  };
  const toggleFieldPermission = (key: keyof FieldPermission) => setPermissionDraft(current => {
    const next = { ...current, [key]: !current[key] };
    if (key !== "view" && next[key]) next.view = true;
    if (key === "view" && !next.view) { next.edit = false; next.delete = false; next.add = false; }
    return next;
  });
  const saveFieldPermissions = () => {
    if (!permissionFieldId || !permissionGroupId) return;
    setFieldPermissions(current => ({ ...current, [permissionFieldId]: { ...current[permissionFieldId], [permissionGroupId]: permissionDraft } }));
    setFieldPermissionOverrides(current => ({ ...current, [permissionFieldId]: permissionOverride }));
    setPermissionFieldId("");
    notify(t.permissionSaved);
  };
  const changeDraft = (key: keyof Draft, value: string) => setDraft(current => ({ ...current, [key]: value }));
  const save = (mode: SaveMode) => {
    const name = draft.name.trim();
    if (!name || (entity === "fields" && !draft.type)) return setError(w.requiredHint);
    const records = entity === "fields" ? fields : fieldCategories;
    if (records.some(record => record.id !== draft.id && record.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return setError(entity === "fields" ? t.duplicateField : t.duplicateCategory);
    if (entity === "categories" && (!draft.order.trim() || !Number.isSafeInteger(Number(draft.order)) || Number(draft.order) < 0)) return setError(t.invalidOrder);
    const id = draft.id || createId();
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
      if (layouts.some(layout => layout.sections.some(section => section.items.some(item => item.fieldId === selectedId)))) { setDeleteOpen(false); setError(copy.layoutManagement.fieldInUse); return; }
      setFields(current => current.filter(field => field.id !== selectedId));
      setFieldCategories(current => current.map(category => category.fieldIds.includes(selectedId) ? { ...category, fieldIds: category.fieldIds.filter(id => id !== selectedId), modifiedOn: fieldTimestamp() } : category));
    } else setFieldCategories(current => current.filter(category => category.id !== selectedId));
    setDeleteOpen(false); back(); notify(t.deleted);
  };
  const removeSelected = () => {
    const ids = new Set(checked);
    if (layouts.some(layout => layout.sections.some(section => section.items.some(item => ids.has(item.fieldId))))) {
      setBulkDeleteOpen(false); setError(copy.layoutManagement.fieldInUse); return;
    }
    setFields(current => current.filter(field => !ids.has(field.id)));
    setFieldCategories(current => current.map(category => category.fieldIds.some(id => ids.has(id)) ? { ...category, fieldIds: category.fieldIds.filter(id => !ids.has(id)), modifiedOn: fieldTimestamp() } : category));
    setChecked([]); setBulkDeleteOpen(false); notify(t.deleted);
  };
  const copySelected = () => {
    const selected = fields.filter(field => checked.includes(field.id));
    if (!selected.length) return;
    setFields(current => {
      const names = new Set(current.map(field => field.name.toLocaleLowerCase()));
      const additions = selected.map(field => {
        const base = `${field.name}${t.copySuffix}`;
        let name = base; let index = 2;
        while (names.has(name.toLocaleLowerCase())) name = `${base} ${index++}`;
        names.add(name.toLocaleLowerCase());
        const choiceIds = new Map(field.choices.map(choice => [choice.id, createId()]));
        return { ...field, id: createId(), name, choices: field.choices.map(choice => ({ ...choice, id: choiceIds.get(choice.id) ?? createId(), parentId: choice.parentId ? choiceIds.get(choice.parentId) ?? null : null })), createdOn: fieldTimestamp(), modifiedOn: fieldTimestamp() };
      });
      return [...current, ...additions];
    });
    setChecked([]); notify(t.copied);
  };
  const exportSelected = () => {
    const selected = fields.filter(field => checked.includes(field.id));
    if (!selected.length) return;
    const escapeCsv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const lines = [t.exportColumns, ...selected.map((field, index) => [index + 1, field.name, t.document, typeName(field.type), sortedCategories.filter(category => category.fieldIds.includes(field.id)).map(category => category.name).join(", ")])].map(row => row.map(escapeCsv).join(","));
    const blob = new Blob(["\ufeff", lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = t.exportFilename; link.click(); URL.revokeObjectURL(url);
    notify(t.exported);
  };
  const updateChoices = (field: FieldRecord, choices: FieldRecord["choices"]) => {
    setFields(current => current.map(item => item.id === field.id ? { ...item, choices, modifiedOn: fieldTimestamp() } : item)); notify(t.choicesSaved);
  };
  const fieldTable = (rows: FieldRecord[]) => <div className="table-scroll"><table><thead><tr>
    <th className="field-table-index">{t.index}</th>
    <th className="field-table-selection"><input type="checkbox" aria-label={t.selectFields} checked={rows.length > 0 && rows.every(field => checked.includes(field.id))} onChange={e => setChecked(current => e.target.checked ? [...new Set([...current, ...rows.map(field => field.id)])] : current.filter(id => !rows.some(field => field.id === id)))} /></th>
    <th className="field-table-icon">{t.editColumn}</th><th className="field-table-icon">{t.permissionColumn}</th>
    {t.columns.map(label => <th key={label}>{label}</th>)}
  </tr></thead><tbody>{rows.map((field, index) => <tr key={field.id}>
    <td className="field-table-index">{index + 1}</td>
    <td className="field-table-selection"><input type="checkbox" aria-label={`${t.selectField}: ${field.name}`} checked={checked.includes(field.id)} onChange={e => setChecked(current => e.target.checked ? [...new Set([...current, field.id])] : current.filter(id => id !== field.id))} /></td>
    <td className="field-table-icon"><IconButton label={`${t.fieldEdit}: ${field.name}`} onClick={() => editField(field)}><Pencil size={16} /></IconButton></td>
    <td className="field-table-icon"><IconButton label={`${t.fieldPermissions}: ${field.name}`} onClick={() => openFieldPermissions(field)}><ShieldCheck size={16} /></IconButton></td>
    <td><button className="table-link" onClick={() => openRecord(field.id, "fields")}>{field.name}</button></td><td>{t.document}</td><td>{typeName(field.type)}</td><td><div className="field-links">{sortedCategories.filter(category => category.fieldIds.includes(field.id)).map(category => <button key={category.id} className="table-link" onClick={() => openRecord(category.id, "categories")}>{category.name}</button>)}</div></td>
  </tr>)}{!rows.length && <tr><td colSpan={t.columns.length + 4} className="admin-empty">{copy.userManagement.noData}</td></tr>}</tbody></table></div>;
  const history = activeRecord && <div ref={historyRef}><Panel title={w.recordHistory}>{details([[w.createdBy, activeRecord.createdOn ? copy.workspace.user : t.empty], [w.createdOn, activeRecord.createdOn], [w.lastModifiedBy, activeRecord.modifiedOn ? copy.workspace.user : t.empty], [w.lastModifiedOn, activeRecord.modifiedOn]])}</Panel></div>;
  const settings = <><Panel><div className="tabs"><span className="field-settings">{t.fieldSettings}</span><button type="button" disabled title={t.advancedUnavailable}>{t.advancedSettings}</button></div>{details(t.settings)}</Panel><Panel title={t.dashboard}>{details(t.dashboardSettings)}</Panel></>;
  return <div className="page users-admin fields-admin">
    <PageHeader title={t.title} subtitle={t.subtitle} ids={t.ids} priorities={[]} />
    <Tabs items={[t.choices, t.categories, t.fields, t.layouts]} active={t[entity]} onChange={label => { setEntity(label === t.layouts ? "layouts" : label === t.fields ? "fields" : label === t.categories ? "categories" : "choices"); setSelectedId(""); setFilter(""); back(); }} />
    {entity !== "choices" && entity !== "layouts" && view === "list" && <>
      <div className="admin-toolbar"><Button variant="primary" icon={<Plus size={17} />} onClick={startNew}>{entity === "fields" ? t.newField : t.newCategory}</Button><strong>{entity === "fields" ? t.allFields : t.allCategories}</strong>{entity === "fields" && checked.length > 0 && <div className="field-bulk-actions"><Button icon={<Copy size={15} />} onClick={copySelected}>{t.copySelected}</Button><Button icon={<Download size={15} />} onClick={exportSelected}>{t.exportList}</Button><Button variant="danger" icon={<Trash2 size={15} />} onClick={() => setBulkDeleteOpen(true)}>{t.deleteSelected}</Button></div>}<label className="admin-search"><Search size={16} /><input aria-label={entity === "fields" ? t.filterFields : t.filterCategories} placeholder={entity === "fields" ? t.filterFields : t.filterCategories} value={filter} onChange={e => setFilter(e.target.value)} /></label></div>
      <Panel className="table-panel admin-list">{entity === "fields" ? fieldTable(fields.filter(field => `${field.name} ${typeName(field.type)}`.toLowerCase().includes(filter.toLowerCase()))) : <div className="table-scroll"><table><thead><tr>{t.categoryColumns.map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{sortedCategories.filter(category => category.name.toLowerCase().includes(filter.toLowerCase())).map(category => <tr key={category.id}><td><button className="table-link" onClick={() => openRecord(category.id)}>{category.name}</button></td><td>{category.order}</td><td><div className="field-links">{category.fieldIds.map(id => fields.find(field => field.id === id)).filter((field): field is FieldRecord => !!field).map(field => <button key={field.id} className="table-link" onClick={() => openRecord(field.id, "fields")}>{field.name}</button>)}</div></td></tr>)}{!sortedCategories.some(category => category.name.toLowerCase().includes(filter.toLowerCase())) && <tr><td colSpan={t.categoryColumns.length} className="admin-empty">{copy.userManagement.noData}</td></tr>}</tbody></table></div>}</Panel>
    </>}
    {entity !== "choices" && entity !== "layouts" && view === "form" && <form noValidate onSubmit={e => { e.preventDefault(); save("save"); }}>
      <div className="admin-actions"><Button type="submit" variant="primary">{c.save}</Button><Button onClick={() => save("new")}>{w.saveAndNew}</Button><Button onClick={() => save("back")}>{w.saveAndBack}</Button><Button onClick={() => draft.id ? openRecord(draft.id) : back()}>{c.cancel}</Button></div>
      {error && <p role="alert" className="form-alert">{error}</p>}
      <Panel title={entity === "fields" ? t.fieldInformation : t.categoryDetails}><div className="admin-identity-form field-form">
        <Field label={w.name} required><input aria-label={w.name} value={draft.name} onChange={e => changeDraft("name", e.target.value)} autoFocus /></Field>
        {entity === "fields" ? <><Field label={t.objectType} required><select aria-label={t.objectType} value="document" onChange={() => {}}><option value="document">{t.document}</option></select></Field><Field label={t.fieldType} required><select aria-label={t.fieldType} value={draft.type} disabled={!!draft.id} onChange={e => changeDraft("type", e.target.value)}><option value="">{w.select}</option>{t.typeOptions.map(option => <option key={option.id} value={option.id} disabled={option.id !== "multiple"}>{option.label}</option>)}</select></Field>{!draft.type && <p className="admin-note">{t.typeHint}</p>}</> : <Field label={t.order} required><div className="field-order"><input type="number" aria-label={t.order} value={draft.order} min={t.defaultOrder} onChange={e => changeDraft("order", e.target.value)} /><Button onClick={() => setOrderOpen(true)}>{t.viewOrder}</Button></div></Field>}
      </div></Panel>
      {entity === "fields" && draft.type === "multiple" && settings}
    </form>}
    {entity !== "choices" && entity !== "layouts" && view === "detail" && activeRecord && <>
      <div className="admin-actions"><Button variant="primary" onClick={startEdit}>{c.edit}</Button><Button onClick={() => setDeleteOpen(true)}>{w.delete}</Button><Button onClick={back}>{c.back}</Button><span title={t.advancedUnavailable}><Button disabled>{w.editPermissions}</Button></span><Button onClick={() => historyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}>{w.viewAudit}</Button></div>
      {entity === "fields" && selectedField ? <>
        <Panel title={t.fieldInformation}>{details([[w.name, selectedField.name], [t.objectType, t.document], [t.fieldType, typeName(selectedField.type)]])}</Panel>
        {selectedField.type === "multiple" && <>{settings}<FieldChoices key={selectedField.id} choices={selectedField.choices} onChange={choices => updateChoices(selectedField, choices)} /></>}
      </> : selectedCategory && <>
        <Panel title={t.categoryDetails}>{details([[w.name, selectedCategory.name], [t.order, selectedCategory.order]])}</Panel>
        <Panel title={t.fields} className="table-panel" actions={<><Button onClick={() => { setLinks([...selectedCategory.fieldIds]); setLinkOpen(true); }}>{t.link}</Button><Button disabled={!checked.length} onClick={() => { setFieldCategories(current => current.map(category => category.id === selectedId ? { ...category, fieldIds: category.fieldIds.filter(id => !checked.includes(id)), modifiedOn: fieldTimestamp() } : category)); setChecked([]); notify(t.unlinked); }}>{t.unlink}</Button></>}>{fieldTable(fields.filter(field => selectedCategory.fieldIds.includes(field.id)))}</Panel>
      </>}
      {history}
    </>}
    {entity === "layouts" && <LayoutsPage notify={notify} />}
    {error && view !== "form" && <p className="form-alert" role="alert">{error}</p>}
    {entity === "choices" && <>
      <div className="admin-toolbar"><Field label={t.chooseField}><select aria-label={t.chooseField} value={choiceField?.id ?? ""} onChange={e => setSelectedId(e.target.value)}>{!choiceFields.length && <option value="">{w.select}</option>}{choiceFields.map(field => <option key={field.id} value={field.id}>{field.name}</option>)}</select></Field></div>
      {choiceField ? <FieldChoices key={choiceField.id} choices={choiceField.choices} onChange={choices => updateChoices(choiceField, choices)} /> : <Panel><p className="admin-empty">{t.noChoiceField}</p><Button variant="primary" onClick={() => { setEntity("fields"); startNew(); }}>{t.newField}</Button></Panel>}
    </>}
    <p className="admin-note">{t.localOnly}</p>
    <Modal open={orderOpen} title={t.orderReference} onClose={() => setOrderOpen(false)} footer={<Button onClick={() => setOrderOpen(false)}>{c.close}</Button>}><p className="admin-note">{t.orderHint}</p><table><thead><tr><th>{w.name}</th><th>{t.order}</th></tr></thead><tbody>{sortedCategories.map(category => <tr key={category.id}><td>{category.name}</td><td>{category.order}</td></tr>)}</tbody></table></Modal>
    {linkOpen && selectedCategory && <Modal open title={t.selectFieldsTitle} wide onClose={() => setLinkOpen(false)} footer={<><Button variant="primary" onClick={() => { setFieldCategories(current => current.map(category => category.id === selectedId ? { ...category, fieldIds: [...links], modifiedOn: fieldTimestamp() } : category)); setChecked([]); setLinkOpen(false); notify(t.linked); }}>{copy.userManagement.apply}</Button><Button onClick={() => setLinkOpen(false)}>{c.cancel}</Button></>}><TransferList items={fields.map(field => ({ id: field.id, label: field.name, detail: typeName(field.type) }))} selectedIds={links} onChange={setLinks} leftTitle={t.availableFields} rightTitle={t.selectedFields} /></Modal>}
    <Modal open={Boolean(permissionField)} title={`${t.permissionSettings}${permissionField ? ` · ${permissionField.name}` : ""}`} wide onClose={() => setPermissionFieldId("")} footer={<><Button onClick={() => setPermissionFieldId("")}>{c.cancel}</Button><Button variant="primary" disabled={!permissionGroupId} onClick={saveFieldPermissions}>{c.save}</Button></>}>
      <p className="admin-note">{t.permissionHint}</p>
      <div className="field-permission-inheritance"><Toggle label={t.permissionOverride} checked={permissionOverride} onChange={() => setPermissionOverride(current => !current)} /><span>{t.permissionOverrideHint}</span></div>
      {!permissionGroups.length ? <p className="admin-empty">{t.permissionNoGroups}</p> : <div className="field-permission-layout">
        <section className="field-permission-groups"><Field label={t.permissionGroup}><select aria-label={t.permissionGroup} value={permissionGroupId} onChange={e => changePermissionGroup(e.target.value)}>{permissionGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select></Field><div className="field-permission-members"><strong>{t.permissionUsers}</strong>{permissionUsers.map(user => <span key={user.id}>{user.lastName}{copy.userManagement.nameSeparator}{user.firstName}{t.separator}{user.email}</span>)}{!permissionUsers.length && <span>{t.permissionNoUsers}</span>}</div><p className="admin-note">{t.permissionMembersHint}</p></section>
        <section className="field-permission-actions"><h3>{t.permissionActionsTitle}</h3><p className="admin-note">{permissionGroup?.name ?? t.permissionGroup}</p>{(["view", "edit", "delete", "add"] as const).map(action => <label className="admin-check" key={action}><input type="checkbox" checked={permissionDraft[action]} onChange={() => toggleFieldPermission(action)} />{t.permissionActions[action]}</label>)}</section>
      </div>}
    </Modal>
    <Modal open={bulkDeleteOpen} title={t.bulkDeleteTitle} onClose={() => setBulkDeleteOpen(false)} footer={<><Button onClick={() => setBulkDeleteOpen(false)}>{c.cancel}</Button><Button variant="danger" onClick={removeSelected}>{w.delete}</Button></>}><p>{t.bulkDeleteHint}</p></Modal>
    <Modal open={deleteOpen} title={t.deleteTitle} onClose={() => setDeleteOpen(false)} footer={<><Button onClick={() => setDeleteOpen(false)}>{c.cancel}</Button><Button variant="danger" onClick={remove}>{w.delete}</Button></>}><p>{entity === "fields" ? t.deleteFieldHint : t.deleteCategoryHint}</p></Modal>
  </div>;
}
