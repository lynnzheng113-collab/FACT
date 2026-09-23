import { useState } from "react";
import { copy } from "../constants/copy";
import { useAdministration, type WorkspaceRecord } from "../state/Administration";
import { Button, Modal } from "./UI";
import { TransferList } from "./TransferList";

export function WorkspacePermissions(props: { open: boolean; workspace: WorkspaceRecord; onClose: () => void; notify: (message: string) => void }) {
  return props.open ? <PermissionsContent {...props} /> : null;
}

function PermissionsContent({ workspace, onClose, notify }: { workspace: WorkspaceRecord; onClose: () => void; notify: (message: string) => void }) {
  const text = copy.userManagement;
  const { groups, setGroups, users } = useAdministration();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const [viewGroupId, setViewGroupId] = useState<string | null>(null);
  const linkedGroups = groups.filter(group => group.workspaceIds.includes(workspace.id));
  const selectedGroup = groups.find(group => group.id === viewGroupId);
  const save = () => {
    setGroups(current => current.map(group => ({ ...group, workspaceIds: draft.includes(group.id) ? [...new Set([...group.workspaceIds, workspace.id])] : group.workspaceIds.filter(id => id !== workspace.id) })));
    setEditing(false);
    notify(text.permissionsSaved);
  };
  return <Modal open title={editing ? text.addRemoveGroups : text.manageWorkspacePermissions} onClose={onClose} wide footer={editing ? <><Button onClick={() => setEditing(false)}>{copy.common.cancel}</Button><Button variant="primary" onClick={save}>{copy.common.save}</Button></> : <><Button variant="primary" onClick={() => { setDraft(linkedGroups.map(group => group.id)); setEditing(true); setViewGroupId(null); }}>{text.addRemoveGroups}</Button><Button onClick={onClose}>{copy.common.close}</Button></>}>
    <p className="admin-selection"><strong>{text.selectedWorkspace}</strong> {workspace.name}</p>
    {editing ? <TransferList items={groups.map(group => ({ id: group.id, label: group.name }))} selectedIds={draft} onChange={setDraft} leftTitle={text.availableGroups} rightTitle={text.groupsInWorkspace} /> : <>
      <h3>{text.groupList}</h3>
      <div className="table-scroll"><table><thead><tr><th>{text.columns.groups[1]}</th><th>{text.users}</th></tr></thead><tbody>
        {linkedGroups.map(group => <tr key={group.id}><td>{group.name}</td><td><Button onClick={() => setViewGroupId(group.id)}>{text.viewUsers}</Button></td></tr>)}
        {!linkedGroups.length && <tr><td colSpan={2} className="admin-empty">{text.noData}</td></tr>}
      </tbody></table></div>
      {selectedGroup && <section className="admin-preview"><h3>{selectedGroup.name}</h3>{users.filter(user => selectedGroup.userIds.includes(user.id)).map(user => <p key={user.id}>{user.lastName}{text.nameSeparator}{user.firstName} — {user.email}</p>)}{!selectedGroup.userIds.length && <p>{text.noData}</p>}</section>}
      <p className="admin-note">{text.securityBoundary}</p>
    </>}
  </Modal>;
}
