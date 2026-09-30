import { useState } from "react";
import { copy } from "../constants/copy";
import { useAdministration, type WorkspaceRecord } from "../state/Administration";
import { Button, Field, Modal } from "./UI";

const t = copy.permissionManagement;
const fallbackResource = { resourcePool: t.resourceOptions[0], databaseLocation: t.databaseOptions[0], defaultFileRepository: t.repositoryOptions[0], dataGridFileRepository: t.repositoryOptions[1], defaultCacheLocation: t.cacheOptions[0], downloadHandlerUrl: t.downloadHandlerDefault };

export function WorkspaceResourceInfo({ workspace }: { workspace: WorkspaceRecord }) {
  const { setWorkspaces } = useAdministration();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => ({ ...fallbackResource, ...workspace }));
  const value = (key: keyof typeof fallbackResource) => workspace[key] || fallbackResource[key];
  const update = (key: keyof typeof fallbackResource, next: string) => setDraft(current => ({ ...current, [key]: next }));
  const save = () => { setWorkspaces(current => current.map(item => item.id === workspace.id ? { ...item, ...draft } : item)); setEditing(false); };
  return <section className="workspace-resource-info"><div className="admin-toolbar"><h3>{t.resourceInfo}</h3>{editing ? <><Button variant="primary" onClick={save}>{copy.common.save}</Button><Button onClick={() => { setDraft({ ...fallbackResource, ...workspace }); setEditing(false); }}>{copy.common.cancel}</Button></> : <Button onClick={() => { setDraft({ ...fallbackResource, ...workspace }); setEditing(true); }}>{copy.common.edit}</Button>}</div>
    <div className="workspace-resource-grid">
      <Field label={t.resourcePool} required><select value={editing ? draft.resourcePool : value("resourcePool")} disabled={!editing} onChange={e => update("resourcePool", e.target.value)}>{t.resourceOptions.map(option => <option key={option}>{option}</option>)}</select></Field>
      <Field label={t.databaseLocation} required><select value={editing ? draft.databaseLocation : value("databaseLocation")} disabled={!editing} onChange={e => update("databaseLocation", e.target.value)}>{t.databaseOptions.map(option => <option key={option}>{option}</option>)}</select></Field>
      <Field label={t.defaultFileRepository} required><select value={editing ? draft.defaultFileRepository : value("defaultFileRepository")} disabled={!editing} onChange={e => update("defaultFileRepository", e.target.value)}>{t.repositoryOptions.map(option => <option key={option}>{option}</option>)}</select></Field>
      <Field label={t.dataGridFileRepository}><select value={editing ? draft.dataGridFileRepository : value("dataGridFileRepository")} disabled={!editing} onChange={e => update("dataGridFileRepository", e.target.value)}>{t.repositoryOptions.map(option => <option key={option}>{option}</option>)}</select></Field>
      <Field label={t.defaultCacheLocation} required><select value={editing ? draft.defaultCacheLocation : value("defaultCacheLocation")} disabled={!editing} onChange={e => update("defaultCacheLocation", e.target.value)}>{t.cacheOptions.map(option => <option key={option}>{option}</option>)}</select></Field>
      <Field label={t.downloadHandlerUrl} required><input value={editing ? draft.downloadHandlerUrl : value("downloadHandlerUrl")} disabled={!editing} onChange={e => update("downloadHandlerUrl", e.target.value)} /></Field>
    </div>
  </section>;
}

export function WorkspaceAdvanced({ workspace, notify }: { workspace: WorkspaceRecord; notify: (message: string) => void }) {
  const { groups, setWorkspaces } = useAdministration();
  const [editing, setEditing] = useState(false);
  const [picker, setPicker] = useState(false);
  const [draft, setDraft] = useState(() => ({ status: workspace.status || t.statusActive, sqlFullTextLanguage: workspace.sqlFullTextLanguage || t.sqlLanguages[0], adminGroupId: workspace.adminGroupId || "", keywords: workspace.keywords || "", notes: workspace.notes || "" }));
  const [pickId, setPickId] = useState(draft.adminGroupId);
  const [query, setQuery] = useState("");
  const groupName = (id: string) => groups.find(group => group.id === id)?.name ?? copy.workspaceManagement.notProvided;
  const save = () => { setWorkspaces(current => current.map(item => item.id === workspace.id ? { ...item, ...draft } : item)); setEditing(false); notify(t.advancedSaved); };
  return <section className="workspace-advanced"><div className="admin-toolbar"><h3>{t.advanced}</h3>{editing ? <><Button variant="primary" onClick={save}>{copy.common.save}</Button><Button onClick={() => { setDraft({ status: workspace.status || t.statusActive, sqlFullTextLanguage: workspace.sqlFullTextLanguage || t.sqlLanguages[0], adminGroupId: workspace.adminGroupId || "", keywords: workspace.keywords || "", notes: workspace.notes || "" }); setEditing(false); }}>{copy.common.cancel}</Button></> : <Button onClick={() => setEditing(true)}>{copy.common.edit}</Button>}</div>
    <div className="workspace-advanced-grid">
      <Field label={copy.workspaceManagement.status} required><div className="admin-radio-group">{t.statusOptions.map(option => <label className="admin-check" key={option}><input type="radio" name={`workspace-status-${workspace.id}`} disabled={!editing} checked={draft.status === option} onChange={() => setDraft(current => ({ ...current, status: option }))} />{option}</label>)}</div></Field>
      <Field label={t.sqlFullTextLanguage} required><select disabled={!editing} value={draft.sqlFullTextLanguage} onChange={e => setDraft(current => ({ ...current, sqlFullTextLanguage: e.target.value }))}>{t.sqlLanguages.map(option => <option key={option}>{option}</option>)}</select></Field>
      <Field label={t.workspaceAdminGroup}><div className="admin-client-picker"><span>{groupName(draft.adminGroupId)}</span><Button disabled={!editing} onClick={() => { setPickId(draft.adminGroupId); setQuery(""); setPicker(true); }}>{copy.workspaceManagement.select}</Button></div></Field>
      <Field label={copy.workspaceManagement.keywords}><input disabled={!editing} value={draft.keywords} placeholder={t.keywordsHint} onChange={e => setDraft(current => ({ ...current, keywords: e.target.value }))} /></Field>
      <Field label={copy.workspaceManagement.notes}><textarea disabled={!editing} value={draft.notes} placeholder={t.notesHint} onChange={e => setDraft(current => ({ ...current, notes: e.target.value }))} /></Field>
    </div>
    <Modal open={picker} title={t.selectAdmin} onClose={() => setPicker(false)} footer={<><Button onClick={() => setPicker(false)}>{copy.common.cancel}</Button><Button variant="primary" disabled={!pickId} onClick={() => { setDraft(current => ({ ...current, adminGroupId: pickId })); setPicker(false); }}>{t.set}</Button></>}>
      <input type="search" aria-label={copy.userManagement.searchGroups} placeholder={copy.userManagement.searchGroups} value={query} onChange={e => setQuery(e.target.value)} />
      <div className="permission-checks">{groups.filter(group => group.name.toLowerCase().includes(query.toLowerCase())).map(group => <label className="admin-check" key={group.id}><input type="radio" name="workspace-admin-group" checked={pickId === group.id} onChange={() => setPickId(group.id)} />{group.name}</label>)}{!groups.length && <p>{copy.userManagement.noGroups}</p>}</div>
    </Modal>
  </section>;
}
