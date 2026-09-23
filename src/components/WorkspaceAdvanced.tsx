import { useState } from "react";
import { copy } from "../constants/copy";
import { useAdministration, type WorkspaceRecord } from "../state/Administration";
import { Button, Modal } from "./UI";

export function WorkspaceAdvanced({ workspace, notify }: { workspace: WorkspaceRecord; notify: (message: string) => void }) {
  const t = copy.permissionManagement;
  const { groups, setWorkspaces } = useAdministration();
  const [editing, setEditing] = useState(false);
  const [picker, setPicker] = useState(false);
  const [draftId, setDraftId] = useState(workspace.adminGroupId ?? "");
  const [pickId, setPickId] = useState("");
  const [query, setQuery] = useState("");
  const groupName = (id: string | undefined) => groups.find(group => group.id === id)?.name ?? copy.workspaceManagement.notProvided;
  return <section className="workspace-advanced"><div className="admin-toolbar"><h3>{t.advanced}</h3>{editing ? <><Button variant="primary" onClick={() => { setWorkspaces(current => current.map(item => item.id === workspace.id ? { ...item, adminGroupId: draftId || undefined } : item)); setEditing(false); notify(t.advancedSaved); }}>{copy.common.save}</Button><Button onClick={() => setEditing(false)}>{copy.common.cancel}</Button></> : <Button onClick={() => { setDraftId(workspace.adminGroupId ?? ""); setEditing(true); }}>{copy.common.edit}</Button>}</div>
    <dl className="detail-grid"><div><dt>{copy.workspaceManagement.status}</dt><dd>{workspace.status}</dd></div><div><dt>{t.workspaceAdminGroup}</dt><dd>{groupName(editing ? draftId : workspace.adminGroupId)}{editing && <Button onClick={() => { setPickId(draftId); setQuery(""); setPicker(true); }}>{copy.workspaceManagement.select}</Button>}</dd></div></dl>
    <Modal open={picker} title={t.selectAdmin} onClose={() => setPicker(false)} footer={<><Button onClick={() => setPicker(false)}>{copy.common.cancel}</Button><Button variant="primary" disabled={!pickId} onClick={() => { setDraftId(pickId); setPicker(false); }}>{t.set}</Button></>}>
      <input type="search" aria-label={copy.userManagement.searchGroups} placeholder={copy.userManagement.searchGroups} value={query} onChange={e => setQuery(e.target.value)} />
      <div className="permission-checks">{groups.filter(group => group.name.toLowerCase().includes(query.toLowerCase())).map(group => <label className="admin-check" key={group.id}><input type="radio" name="workspace-admin-group" checked={pickId === group.id} onChange={() => setPickId(group.id)} />{group.name}</label>)}{!groups.length && <p>{copy.userManagement.noGroups}</p>}</div>
    </Modal>
  </section>;
}
