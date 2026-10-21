import { useState } from "react";
import { copy } from "../constants/copy";
import { useAdministration, type SavedSearch } from "../state/Administration";
import { createId } from "../state/ids";
import { defaultSearchDefinition, evaluateSearch, searchDefinitionError, searchValue, type SearchDefinition, type SearchFieldId, type SearchCondition, type SearchSort } from "../state/savedSearch";
import { Button, CheckRow, Field, Modal, Tabs } from "./UI";

const t = copy.savedSearchEditor;
const label = (id: string) => t.fieldOptions.find(f => f.id === id)?.label ?? id;
export function SavedSearchEditor({ search, initialName, initialQuery = "", onClose, onSave }: {
  search?: SavedSearch; initialName?: string; initialQuery?: string;
  onClose: () => void; onSave: (search: SavedSearch, run: boolean) => void;
}) {
  const { savedSearches } = useAdministration();
  const [name, setName] = useState(search?.name ?? initialName ?? t.extractedOnly);
  const [owner, setOwner] = useState(search?.owner ?? t.public);
  const [folder, setFolder] = useState(search?.folder ?? 0);
  const [draft, setDraft] = useState<SearchDefinition>(() => structuredClone(search?.definition ?? {
    ...defaultSearchDefinition(), related: search?.includeFamily ? "family" : "none",
    conditions: (search?.query || initialQuery) ? [{ id: createId(), field: "extractedText", operator: "contains", value: search?.query || initialQuery }] : [],
  }));
  const [tab, setTab] = useState<string>(t.conditions);
  const [error, setError] = useState<string | null>(null);
  const [fieldQuery, setFieldQuery] = useState("");
  const [preview, setPreview] = useState<SearchDefinition | null>(null);
  const patch = (value: Partial<SearchDefinition>) => { setDraft(current => ({ ...current, ...value })); setPreview(null); setError(null); };
  const move = <T,>(items: T[], index: number, direction: number): T[] => { const next = [...items]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; return next; };
  const submit = (save: boolean, run: boolean) => {
    const message = save && !name.trim() ? t.errors.name : save && savedSearches.some(s => s.id !== search?.id && s.name.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase()) ? t.errors.duplicate : searchDefinitionError(draft);
    if (message) { setError(message); return; }
    setError(null);
    if (!save) { setPreview(structuredClone(draft)); return; }
    onSave({ ...search, id: search?.id ?? createId(), name: name.trim(), owner, visibility: owner === t.public ? "public" : "private", folder, folderName: copy.documents.searchFolderOptions[folder], query: "", includeFamily: draft.related === "family", selectedFields: [...draft.fields], definition: structuredClone(draft), revision: (search?.revision ?? 0) + 1 }, run);
  };
  const previewRows = preview ? evaluateSearch(preview) : [];
  return <Modal open wide title={t.title} onClose={onClose} footer={<>
    <Button variant="primary" onClick={() => submit(true, true)}>{t.saveSearch}</Button><Button onClick={() => submit(false, true)}>{t.search}</Button><Button onClick={() => submit(true, false)}>{copy.common.save}</Button><Button onClick={onClose}>{copy.common.cancel}</Button>
  </>}>
    {error && <p className="form-alert" role="alert">{error}</p>}
    <div className="saved-search-editor">
      <section className="saved-search-editor__information" aria-label={t.information}>
        <h3>{t.information}</h3>
        <Field label={t.name} required><input aria-label={t.name} value={name} onChange={e => setName(e.target.value)} /></Field>
        <Field label={t.owner} required><div className="inline-actions"><select aria-label={t.owner} value={owner} onChange={e => setOwner(e.target.value)}><option>{t.public}</option><option>{copy.documents.savedSearchOwnerMe}</option>{owner !== t.public && owner !== copy.documents.savedSearchOwnerMe && <option>{owner}</option>}</select><Button onClick={() => setOwner(copy.documents.savedSearchOwnerMe)}>{t.me}</Button></div></Field>
        <CheckRow label={t.manualRerun} checked={draft.manualRerun} onChange={() => patch({ manualRerun: !draft.manualRerun })} />
        <Field label={t.scope}><label><input type="radio" name="search-scope" checked={draft.scope === "workspace"} onChange={() => patch({ scope: "workspace" })} />{t.entireWorkspace}</label><label><input type="radio" name="search-scope" checked={draft.scope === "folders"} onChange={() => patch({ scope: "folders" })} />{t.selectedFolders}</label></Field>
        {draft.scope === "folders" && <div className="saved-search-editor__folders">{copy.documents.folderItems.map((name, index) => <CheckRow key={name} label={name} checked={draft.folders.includes(index)} onChange={() => patch({ folders: draft.folders.includes(index) ? draft.folders.filter(i => i !== index) : [...draft.folders, index] })} />)}<CheckRow label={t.includeSubfolders} checked={draft.includeSubfolders} onChange={() => patch({ includeSubfolders: !draft.includeSubfolders })} /><p className="admin-note">{t.scopeHint}</p></div>}
        <Field label={copy.documents.savedSearchFolder}><select aria-label={copy.documents.savedSearchFolder} value={folder} onChange={e => setFolder(Number(e.target.value))}>{copy.documents.searchFolderOptions.map((name, index) => <option key={name} value={index}>{name}</option>)}</select></Field>
        <Field label={t.notes}><textarea aria-label={t.notes} value={draft.notes} onChange={e => patch({ notes: e.target.value })} /></Field>
      </section>
      <section className="saved-search-editor__configuration">
        <Tabs items={[t.conditions, t.fields, t.sort]} active={tab} onChange={setTab} />
        {tab === t.conditions && <div className="saved-search-editor__tab">
          <div className="inline-actions"><Button onClick={() => patch({ conditions: [...draft.conditions, { id: createId(), field: "extractedText", operator: "contains", value: "" }] })}>{t.condition}</Button><select aria-label={t.related} value={draft.related} onChange={e => patch({ related: e.target.value as SearchDefinition["related"] })}><option value="none">{t.none}</option><option value="family">{t.family}</option></select></div>
          {draft.conditions.length > 1 && <Field label={t.match}><select aria-label={t.match} value={draft.match} onChange={e => patch({ match: e.target.value as "all" | "any" })}><option value="all">{t.all}</option><option value="any">{t.any}</option></select></Field>}
          {!draft.conditions.length && <p className="admin-note">{t.noConditions}</p>}
          {draft.conditions.map((condition, index) => <section className="saved-search-condition" key={condition.id}>
            <Field label={t.field}><select aria-label={`${t.field} ${index + 1}`} value={condition.field} onChange={e => patch({ conditions: draft.conditions.map(c => c.id === condition.id ? { ...c, field: e.target.value as SearchFieldId } : c) })}>{t.fieldOptions.map(field => <option key={field.id} value={field.id}>{field.label}</option>)}</select></Field>
            <Field label={t.operator}><select aria-label={`${t.operator} ${index + 1}`} value={condition.operator} onChange={e => patch({ conditions: draft.conditions.map(c => c.id === condition.id ? { ...c, operator: e.target.value as SearchCondition["operator"] } : c) })}>{t.operators.map(op => <option key={op.id} value={op.id}>{op.label}</option>)}</select></Field>
            {!["isSet", "isNotSet"].includes(condition.operator) && <Field label={t.value} required><input aria-label={`${t.value} ${index + 1}`} value={condition.value} onChange={e => patch({ conditions: draft.conditions.map(c => c.id === condition.id ? { ...c, value: e.target.value } : c) })} /></Field>}
            <Button onClick={() => patch({ conditions: draft.conditions.filter(c => c.id !== condition.id) })}>{t.remove}</Button>
          </section>)}
        </div>}
        {tab === t.fields && <div className="saved-search-editor__tab">
          <p>{t.fieldsHint}</p><div className="inline-actions"><Button onClick={() => patch({ fields: ["extractedText"] })}>{t.extractedOnly}</Button></div>
          <div className="saved-search-fields">
            <section><h3>{t.available}</h3><input aria-label={t.fieldSearch} placeholder={t.fieldSearch} value={fieldQuery} onChange={e => setFieldQuery(e.target.value)} /><Button onClick={() => patch({ fields: [...draft.fields, ...t.fieldOptions.filter(f => !draft.fields.includes(f.id as SearchFieldId)).map(f => f.id as SearchFieldId)] })}>{t.addAll}</Button>
              {t.fieldOptions.filter(f => !draft.fields.includes(f.id as SearchFieldId) && f.label.toLowerCase().includes(fieldQuery.toLowerCase())).map(f => <div className="saved-search-field" key={f.id}><span>{f.label}<small>{f.type}</small></span><Button onClick={() => patch({ fields: [...draft.fields, f.id as SearchFieldId] })}>{t.add}</Button></div>)}
            </section>
            <section><h3>{t.selected}</h3><Button onClick={() => patch({ fields: [] })}>{t.removeAll}</Button>{draft.fields.map((id, i) => <div className="saved-search-field" key={id}><strong>{label(id)}</strong><div className="inline-actions"><Button disabled={i === 0} onClick={() => patch({ fields: move(draft.fields, i, -1) })}>{t.up}</Button><Button disabled={i === draft.fields.length - 1} onClick={() => patch({ fields: move(draft.fields, i, 1) })}>{t.down}</Button><Button onClick={() => patch({ fields: draft.fields.filter(f => f !== id) })}>{t.remove}</Button></div></div>)}</section>
          </div>{!draft.fields.includes("extractedText") && <p className="form-alert" role="status">{t.noLongText}</p>}
        </div>}
        {tab === t.sort && <div className="saved-search-editor__tab"><Button disabled={draft.sorts.length >= t.fieldOptions.length - 1} onClick={() => { const field = t.fieldOptions.find(f => f.id !== "extractedText" && !draft.sorts.some(s => s.field === f.id)); if (field) patch({ sorts: [...draft.sorts, { id: createId(), field: field.id as SearchSort["field"], direction: "asc" }] }); }}>{t.addSort}</Button>
          {!draft.sorts.length && <p>{t.noSort}</p>}{draft.sorts.map((sort, index) => <section key={sort.id} className="saved-search-condition"><Field label={t.sortField}><select aria-label={`${t.sortField} ${index + 1}`} value={sort.field} onChange={e => patch({ sorts: draft.sorts.map(s => s.id === sort.id ? { ...s, field: e.target.value as SearchSort["field"] } : s) })}>{t.fieldOptions.filter(f => f.id !== "extractedText").map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></Field><Field label={t.order}><select aria-label={`${t.order} ${index + 1}`} value={sort.direction} onChange={e => patch({ sorts: draft.sorts.map(s => s.id === sort.id ? { ...s, direction: e.target.value as "asc" | "desc" } : s) })}><option value="asc">{t.asc}</option><option value="desc">{t.desc}</option></select></Field><div className="inline-actions"><Button disabled={index === 0} onClick={() => patch({ sorts: move(draft.sorts, index, -1) })}>{t.up}</Button><Button disabled={index === draft.sorts.length - 1} onClick={() => patch({ sorts: move(draft.sorts, index, 1) })}>{t.down}</Button><Button onClick={() => patch({ sorts: draft.sorts.filter(s => s.id !== sort.id) })}>{t.remove}</Button></div></section>)}
        </div>}
      </section>
    </div>
    {preview && <section className="saved-search-preview"><h3>{t.preview}</h3><p>{t.count}{copy.fieldManagement.separator}{previewRows.length}</p><p className="admin-note">{t.previewHint}</p><p className="admin-note">{t.unsaved}</p><div className="table-scroll"><table><thead><tr>{preview.fields.map(id => <th key={id}>{label(id)}</th>)}</tr></thead><tbody>{previewRows.map(doc => <tr key={doc.id}>{preview.fields.map(id => <td key={id}>{searchValue(doc, id)}</td>)}</tr>)}{!previewRows.length && <tr><td colSpan={preview.fields.length}>{t.empty}</td></tr>}</tbody></table></div></section>}
  </Modal>;
}
