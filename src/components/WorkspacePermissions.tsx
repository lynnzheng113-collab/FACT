import { useEffect, useState } from "react";
import { copy } from "../constants/copy";
import { useAdministration, type WorkspaceRecord } from "../state/Administration";
import { type PermissionSet } from "../state/permissions";
import { Button, Modal } from "./UI";
import { TransferList } from "./TransferList";
import { PermissionEditor } from "./PermissionEditor";
import { PermissionPreview } from "./PermissionPreview";
import "../styles/permissions.css";

export function WorkspacePermissions(props: { open: boolean; workspace: WorkspaceRecord; onClose: () => void; notify: (message: string) => void }) {
  return props.open ? <PermissionsContent key={props.workspace.id} {...props} /> : null;
}

function PermissionsContent({ workspace, onClose, notify }: { workspace: WorkspaceRecord; onClose: () => void; notify: (message: string) => void }) {
  const text = copy.userManagement, t = copy.permissionManagement;
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);
  const { groups, setGroups, users, permissions, setPermissions, setWorkspaces } = useAdministration();
  const [mode, setMode] = useState<"groups" | "assign" | "edit" | "copy" | "preview">("groups");
  const [draft, setDraft] = useState<string[]>([]);
  const [viewGroupId, setViewGroupId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const linkedGroups = groups.filter(group => group.workspaceIds.includes(workspace.id));
  const selectedGroup = groups.find(group => group.id === viewGroupId);
  const activeGroup = linkedGroups.find(group => group.id === activeId);
  const getPermissions = (id: string) => permissions[workspace.id]?.[id] ?? { reviewCenter: false, role: "reviewer", flags: {} } as PermissionSet;
  const savePermissions = (id: string, value: PermissionSet) => setPermissions(current => ({ ...current, [workspace.id]: { ...current[workspace.id], [id]: structuredClone(value) } }));
  const save = () => {
    setGroups(current => current.map(group => ({ ...group, workspaceIds: draft.includes(group.id) ? [...new Set([...group.workspaceIds, workspace.id])] : group.workspaceIds.filter(id => id !== workspace.id) })));
    setPermissions(current => ({ ...current, [workspace.id]: Object.fromEntries(draft.map(id => [id, { ...(current[workspace.id]?.[id] ?? { reviewCenter: false, role: "reviewer", flags: {} }), flags: { ...(current[workspace.id]?.[id]?.flags ?? {}), "object.workspace.view": true } }])) }));
    if (workspace.adminGroupId && !draft.includes(workspace.adminGroupId)) setWorkspaces(current => current.map(item => item.id === workspace.id ? { ...item, adminGroupId: undefined } : item));
    setMode("groups"); notify(text.permissionsSaved);
  };
  if (mode === "edit" && activeGroup) return <PermissionEditor key={activeGroup.id} workspace={workspace} group={activeGroup} groups={linkedGroups} initial={getPermissions(activeId)} onBack={() => setMode("groups")} onClose={onClose} onSwitch={setActiveId} onSave={value => { savePermissions(activeId, value); setMode("groups"); notify(t.saved); }} />;
  if (mode === "preview" && activeGroup) return <PermissionPreview workspaceName={workspace.name} groupName={activeGroup.name} permissions={getPermissions(activeId)} onExit={onClose} />;
  if (mode === "copy" && activeGroup) return <Modal open title={t.copyTitle} onClose={onClose} footer={<><Button onClick={() => setMode("groups")}>{copy.common.back}</Button><Button variant="primary" disabled={!sourceId || !linkedGroups.some(group => group.id === sourceId && group.id !== activeId)} onClick={() => { savePermissions(activeId, getPermissions(sourceId)); setMode("groups"); notify(t.copied); }}>{t.copyPermissions}</Button></>}><div className="permission-selection"><span><strong>{text.selectedWorkspace}</strong>{workspace.name}</span><label><strong>{t.copyFrom}</strong><select aria-label={t.copyFrom} value={sourceId} onChange={e => setSourceId(e.target.value)}><option value="">{copy.workspaceManagement.select}</option>{linkedGroups.filter(group => group.id !== activeId).map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label><span><strong>{t.copyTo}</strong>{activeGroup.name}</span></div><p className="admin-note">{t.copyHint}</p>{linkedGroups.length < 2 && <p>{t.noSource}</p>}</Modal>;
  return <div className="permission-dialog"><Modal open title={mode === "assign" ? text.addRemoveGroups : text.manageWorkspacePermissions} onClose={onClose} wide footer={mode === "assign" ? <><Button onClick={() => setMode("groups")}>{copy.common.cancel}</Button><Button variant="primary" onClick={save}>{copy.common.save}</Button></> : <><Button variant="primary" onClick={() => { setDraft(linkedGroups.map(group => group.id)); setMode("assign"); setViewGroupId(null); }}>{text.addRemoveGroups}</Button><Button onClick={onClose}>{copy.common.close}</Button></>}>
    <p className="admin-selection"><strong>{text.selectedWorkspace}</strong> {workspace.name}</p>
    <div className="item-security-steps" aria-label={copy.itemSecurity.steps}><span className="is-active">{copy.itemSecurity.stepGroups}</span><span>{copy.itemSecurity.stepPermissions}</span></div>
    <p className="permission-notice">{copy.itemSecurity.includedViewHint}</p>
    {mode === "assign" ? <TransferList items={groups.map(group => ({ id: group.id, label: group.name }))} selectedIds={draft} onChange={setDraft} leftTitle={text.availableGroups} rightTitle={text.groupsInWorkspace} /> : <>
      <h3>{copy.itemSecurity.groupsInScope}</h3><div className="table-scroll"><table className="permission-groups"><thead><tr><th>{text.columns.groups[1]}</th><th>{copy.itemSecurity.view}</th><th>{t.actions}</th></tr></thead><tbody>
        {linkedGroups.map(group => <tr key={group.id}><td>{group.name}</td><td>{copy.itemSecurity.view}</td><td><div className="permission-row-actions"><Button onClick={() => setViewGroupId(group.id)}>{text.viewUsers}</Button><Button onClick={() => { setActiveId(group.id); setMode("edit"); }}>{t.edit}</Button><Button onClick={() => { setActiveId(group.id); setSourceId(""); setMode("copy"); }}>{t.copy}</Button><Button onClick={() => { setActiveId(group.id); setMode("preview"); }}>{t.preview}</Button></div></td></tr>)}
        {!linkedGroups.length && <tr><td colSpan={3} className="admin-empty">{t.exampleHint}</td></tr>}
      </tbody></table></div>
      {selectedGroup && <section className="admin-preview"><h3>{selectedGroup.name}</h3>{users.filter(user => selectedGroup.userIds.includes(user.id)).map(user => <p key={user.id}>{user.lastName}{text.nameSeparator}{user.firstName}{t.separator}{user.email}</p>)}{!users.some(user => selectedGroup.userIds.includes(user.id)) && <p>{text.noData}</p>}</section>}
    </>}
  </Modal></div>;
}
