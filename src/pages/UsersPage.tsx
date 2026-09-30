import { useState, type ReactNode } from "react";
import { Plus, Search, Users } from "lucide-react";
import { copy } from "../constants/copy";
import { useAdministration, type GroupRecord, type UserRecord } from "../state/Administration";
import { Button, Field, Modal, PageHeader, Panel, Tabs } from "../components/UI";
import "../styles/users.css";
import { blankUser, ClientPicker, OtherDetails, UserForm } from "../components/UserForm";
import { TransferList } from "../components/TransferList";
import { PermissionPreview } from "../components/PermissionPreview";
import { initialPermissions, type PermissionSet } from "../state/permissions";
import { WorkspacePermissions } from "../components/WorkspacePermissions";
import { createId } from "../state/ids";

type Entity = "users" | "groups";
type SaveMode = "save" | "new" | "back";
const text = copy.userManagement;
const common = copy.workspaceManagement;
const fullName = (user: UserRecord) => `${user.lastName}${text.nameSeparator}${user.firstName}`;
const newGroup = (): GroupRecord => ({ id: "", name: "", clientId: "", userIds: [], workspaceIds: [], keywords: "", notes: "", createdOn: "", modifiedOn: "" });
const now = () => new Date().toLocaleString(text.dateLocale, { hour12: false });
const validIP = (value: string) => {
  if (value.includes(":")) { try { return new URL(`http://[${value}]/`).hostname.startsWith("["); } catch { return false; } }
  const parts = value.split(".");
  return parts.length === 4 && parts.every(part => /^\d{1,3}$/.test(part) && Number(part) <= 255);
};

export function UsersPage({ notify, status }: { notify: (message: string) => void; status?: ReactNode }) {
  const { clients, users, setUsers, groups, setGroups, workspaces, setWorkspaces, permissions, setPermissions } = useAdministration();
  const [statusOpen, setStatusOpen] = useState(false);
  const [entity, setEntity] = useState<Entity>("users");
  const [view, setView] = useState<"list" | "form" | "detail">("list");
  const [selectedId, setSelectedId] = useState("");
  const [userForm, setUserForm] = useState<UserRecord>(blankUser);
  const [groupForm, setGroupForm] = useState<GroupRecord>(newGroup);
  const [section, setSection] = useState(0);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [pendingSave, setPendingSave] = useState<SaveMode | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [memberDraft, setMemberDraft] = useState<string[]>([]);
  const [checkedMembers, setCheckedMembers] = useState<string[]>([]);
  const [addedOpen, setAddedOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<{ groupId: string; workspaceId: string } | null>(null);
  const [previewGroupId, setPreviewGroupId] = useState("");
  const [previewWorkspaceId, setPreviewWorkspaceId] = useState("");
  const [permissionEditTarget, setPermissionEditTarget] = useState<{ groupId: string; workspaceId: string } | null>(null);
  const [workspaceDraft, setWorkspaceDraft] = useState<string[]>([]);
  const [groupMembershipOpen, setGroupMembershipOpen] = useState(false);
  const [groupMembershipDraft, setGroupMembershipDraft] = useState<string[]>([]);
  const selectedUser = users.find(user => user.id === selectedId);
  const selectedGroup = groups.find(group => group.id === selectedId);
  const clientName = (id: string) => clients.find(client => client.id === id)?.name ?? common.notProvided;
  const tabs: string[] = entity === "users" ? [text.userInformation] : [text.groupInformation];
  const detailTabs = [...tabs, common.recordHistory];
  const membership = entity === "groups" ? groups.filter(group => group.id === selectedId) : groups.filter(group => group.userIds.includes(selectedId));
  const linkedWorkspaces = workspaces.filter(workspace => membership.some(group => group.workspaceIds.includes(workspace.id)));
  const previewGroups = entity === "groups" ? (selectedGroup ? [selectedGroup] : []) : membership;
  const previewWorkspaces = workspaces.filter(workspace => previewGroups.some(group => group.id === previewGroupId && group.workspaceIds.includes(workspace.id)));
  const openSecurityPreview = () => { const group = previewGroups[0]; const workspace = group ? workspaces.find(item => group.workspaceIds.includes(item.id)) : undefined; setPreviewGroupId(group?.id ?? ""); setPreviewWorkspaceId(workspace?.id ?? ""); setPreviewOpen(true); };
  const openPermissionEditor = () => { openSecurityPreview(); };
  const openRecord = (id: string) => { setSelectedId(id); setView("detail"); setSection(0); setCheckedMembers([]); const group = groups.find(item => item.id === id); const user = users.find(item => item.id === id); setWorkspaceDraft(group ? [...group.workspaceIds] : []); setGroupMembershipDraft(user ? groups.filter(item => item.userIds.includes(user.id)).map(item => item.id) : []); };
  const openNew = () => { setUserForm(blankUser()); setGroupForm(newGroup()); setError(""); setSection(0); setView("form"); };
  const back = () => { setView("list"); setError(""); setSection(0); };
  const edit = () => { if (selectedUser) setUserForm({ ...selectedUser }); if (selectedGroup) setGroupForm({ ...selectedGroup }); setError(""); setSection(0); setView("form"); };
  const commit = (mode: SaveMode) => {
    let id: string;
    if (entity === "users") {
      id = userForm.id || createId();
      const record = { ...userForm, id, firstName: userForm.firstName.trim(), lastName: userForm.lastName.trim(), email: userForm.email.trim(), createdOn: userForm.createdOn || now(), modifiedOn: now() };
      setUsers(current => record.id === userForm.id ? current.map(item => item.id === record.id ? record : item) : [...current, record]);
      notify(text.userSaved);
    } else {
      id = groupForm.id || String(Math.max(text.idStart - 1, ...groups.map(group => Number(group.id)).filter(Number.isFinite)) + 1);
      const record = { ...groupForm, id, name: groupForm.name.trim(), createdOn: groupForm.createdOn || now(), modifiedOn: now() };
      setGroups(current => groupForm.id ? current.map(item => item.id === id ? record : item) : [...current, record]);
      notify(text.groupSaved);
    }
    setPendingSave(null); setError("");
    if (mode === "new") { setUserForm({ ...blankUser(), clientId: userForm.clientId }); setGroupForm({ ...newGroup(), clientId: groupForm.clientId }); setSection(0); window.scrollTo(0, 0); }
    else if (mode === "back") back();
    else openRecord(id);
  };
  const save = (mode: SaveMode) => {
    setError("");
    if (entity === "users") {
      if (!userForm.firstName.trim() || !userForm.lastName.trim() || !userForm.email.trim() || !userForm.type || !userForm.clientId) { setSection(0); return setError(text.requiredHint); }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email.trim())) return setError(text.invalidEmail);
      if (users.some(user => user.id !== userForm.id && user.email.toLowerCase() === userForm.email.trim().toLowerCase())) return setError(text.duplicateEmail);
      if (userForm.trustedIPs.split(/\r?\n/).map(ip => ip.trim()).filter(Boolean).some(ip => !validIP(ip))) return setError(text.invalidIPs);
      if (userForm.disableOn && Number.isNaN(Date.parse(`${userForm.disableOn}Z`))) return setError(text.invalidDate);
      if (userForm.access && !users.find(user => user.id === userForm.id)?.access) return setPendingSave(mode);
    } else {
      if (!groupForm.name.trim() || !groupForm.clientId) { setSection(0); return setError(text.requiredHint); }
      if (groups.some(group => group.id !== groupForm.id && group.clientId === groupForm.clientId && group.name.toLowerCase() === groupForm.name.trim().toLowerCase())) return setError(text.duplicateGroup);
    }
    commit(mode);
  };
  const removeRecord = () => {
    if (entity === "users") { setUsers(current => current.filter(user => user.id !== selectedId)); setGroups(current => current.map(group => ({ ...group, userIds: group.userIds.filter(id => id !== selectedId) }))); }
    else {
      setGroups(current => current.filter(group => group.id !== selectedId));
      setWorkspaces(current => current.map(workspace => workspace.adminGroupId === selectedId ? { ...workspace, adminGroupId: undefined } : workspace));
      setPermissions(current => Object.fromEntries(Object.entries(current).map(([workspaceId, values]) => [workspaceId, Object.fromEntries(Object.entries(values).filter(([groupId]) => groupId !== selectedId))])));
    }
    setDeleteOpen(false); back(); notify(text.deleted);
  };
  const visibleUsers = users.filter(user => `${fullName(user)} ${user.email} ${clientName(user.clientId)}`.toLowerCase().includes(search.toLowerCase()));
  const visibleGroups = groups.filter(group => `${group.name} ${clientName(group.clientId)}`.toLowerCase().includes(search.toLowerCase()));
  const detail = (items: Array<[string, string]>) => <dl className="detail-grid">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || common.notProvided}</dd></div>)}</dl>;
  const workspaceTable = <Panel title={common.allWorkspaces} className="table-panel"><div className="table-scroll"><table><thead><tr>{text.columns.workspaces.map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{linkedWorkspaces.map(workspace => <tr key={workspace.id}><td>{workspace.name}</td><td>{workspace.clientName}</td><td>{workspace.matterName}</td><td>{workspace.status}</td></tr>)}{!linkedWorkspaces.length && <tr><td colSpan={4} className="admin-empty">{text.noData}</td></tr>}</tbody></table></div></Panel>;
  if (statusOpen) return <div className="page users-admin"><PageHeader title={text.title} subtitle={text.subtitle} ids={text.ids} priorities={[]} /><Tabs items={[text.users, text.groups, copy.userStatus.title]} active={copy.userStatus.title} onChange={label => { setStatusOpen(label === copy.userStatus.title); if (label !== copy.userStatus.title) { setEntity(label === text.users ? "users" : "groups"); back(); } }} />{status}</div>;
  return <div className="page users-admin">
    <PageHeader title={text.title} subtitle={text.subtitle} ids={text.ids} priorities={[]} />
    <Tabs items={[text.users, text.groups, copy.userStatus.title]} active={text[entity]} onChange={label => { if (label === copy.userStatus.title) { setStatusOpen(true); return; } setEntity(label === text.users ? "users" : "groups"); back(); setSearch(""); setSelectedId(""); }} />
    {view === "list" && <>
      <div className="admin-toolbar"><Button variant="primary" icon={<Plus size={17} />} onClick={openNew}>{entity === "users" ? text.newUser : text.newGroup}</Button><strong>{entity === "users" ? text.allUsers : text.allGroups}</strong><label className="admin-search"><Search size={16} /><input aria-label={entity === "users" ? text.searchUsers : text.searchGroups} placeholder={entity === "users" ? text.searchUsers : text.searchGroups} value={search} onChange={e => setSearch(e.target.value)} /></label></div>
      <Panel className="table-panel admin-list"><div className="table-scroll"><table><thead><tr>{text.columns[entity].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>
        {entity === "users" ? visibleUsers.map(user => <tr key={user.id}><td><button className="table-link" onClick={() => openRecord(user.id)}>{fullName(user)}</button></td><td>{clientName(user.clientId)}</td><td>{user.email}</td><td>{clientName(user.clientId)}</td><td>{user.type}</td><td>{copy.workspace.user}</td><td>{user.createdOn}</td></tr>) : visibleGroups.map(group => <tr key={group.id}><td>{group.id}</td><td><button className="table-link" onClick={() => openRecord(group.id)}>{group.name}</button></td><td>{clientName(group.clientId)}</td></tr>)}
        {!(entity === "users" ? visibleUsers : visibleGroups).length && <tr><td colSpan={text.columns[entity].length} className="admin-empty"><Users size={24} /><p>{search ? text.noData : entity === "users" ? text.noUsers : text.noGroups}</p></td></tr>}
      </tbody></table></div><div className="admin-list-footer">{text.total} {(entity === "users" ? visibleUsers : visibleGroups).length}</div></Panel>
    </>}
    {view === "form" && <>
      <div className="admin-actions"><Button variant="primary" onClick={() => save("save")}>{copy.common.save}</Button><Button onClick={() => save("new")}>{common.saveAndNew}</Button><Button onClick={() => save("back")}>{common.saveAndBack}</Button><Button onClick={() => selectedId && (userForm.id || groupForm.id) ? openRecord(selectedId) : back()}>{copy.common.cancel}</Button></div>
      {error && <div role="alert" className="form-alert">{error}</div>}
      <Tabs items={tabs} active={tabs[section]} onChange={label => setSection(tabs.indexOf(label))} />
      {entity === "users" ? <UserForm value={userForm} onChange={setUserForm} /> : <Panel title={tabs[section]}><div className="admin-identity-form"><Field label={common.name} required><input aria-label={common.name} value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} /></Field><Field label={common.client} required><ClientPicker value={groupForm.clientId} onChange={id => setGroupForm({ ...groupForm, clientId: id })} /></Field></div><OtherDetails keywords={groupForm.keywords} notes={groupForm.notes} onChange={(key, value) => setGroupForm({ ...groupForm, [key]: value })} /></Panel>}
    </>}
    {view === "detail" && (selectedUser || selectedGroup) && <>
      <div className="admin-actions"><Button variant="primary" onClick={edit}>{copy.common.edit}</Button><Button onClick={() => setDeleteOpen(true)}>{common.delete}</Button><Button onClick={back}>{copy.common.back}</Button><Button onClick={openSecurityPreview}>{text.previewSecurity}</Button><Button onClick={openPermissionEditor} disabled={!previewGroups.some(group => group.workspaceIds.length)}>{copy.permissionManagement.edit}</Button><Button onClick={() => setSection(1)}>{common.viewAudit}</Button></div>
      <Tabs items={detailTabs} active={detailTabs[section]} onChange={label => setSection(detailTabs.indexOf(label))} />
      <Panel title={entity === "users" && selectedUser ? fullName(selectedUser) : selectedGroup?.name}>
        {section === 0 && (entity === "users" && selectedUser ? detail([[text.firstName, selectedUser.firstName], [text.lastName, selectedUser.lastName], [text.email, selectedUser.email], [text.type, selectedUser.type], [common.client, clientName(selectedUser.clientId)], [text.relativityAccess, selectedUser.access ? text.enabled : text.disabled], [text.disableOn, selectedUser.disableOn], [text.trustedIPs, selectedUser.trustedIPs], [common.keywords, selectedUser.keywords], [common.notes, selectedUser.notes]]) : selectedGroup && detail([[common.name, selectedGroup.name], [common.client, clientName(selectedGroup.clientId)], [text.groupType, text.systemGroup], [common.keywords, selectedGroup.keywords], [common.notes, selectedGroup.notes]]))}
        {section === 1 && detail([[common.createdBy, copy.workspace.user], [common.createdOn, (selectedUser ?? selectedGroup)?.createdOn ?? ""], [common.lastModifiedBy, copy.workspace.user], [common.lastModifiedOn, (selectedUser ?? selectedGroup)?.modifiedOn ?? ""]])}
      </Panel>
      {entity === "groups" && selectedGroup && <Panel title={text.users} className="table-panel" actions={<><Button onClick={() => { setMemberDraft([]); setPickerOpen(true); }}>{text.add}</Button><Button disabled={!checkedMembers.length} onClick={() => { setGroups(current => current.map(group => group.id === selectedId ? { ...group, userIds: group.userIds.filter(id => !checkedMembers.includes(id)), modifiedOn: now() } : group)); setCheckedMembers([]); notify(text.removed); }}>{text.remove}</Button></>}>
        <div className="table-scroll"><table><thead><tr><th><input type="checkbox" aria-label={text.selectAll} checked={selectedGroup.userIds.length > 0 && selectedGroup.userIds.every(id => checkedMembers.includes(id))} onChange={e => setCheckedMembers(e.target.checked ? selectedGroup.userIds : [])} /></th>{text.columns.members.map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>
          {users.filter(user => selectedGroup.userIds.includes(user.id)).map(user => <tr key={user.id}><td><input type="checkbox" aria-label={fullName(user)} checked={checkedMembers.includes(user.id)} onChange={e => setCheckedMembers(current => e.target.checked ? [...current, user.id] : current.filter(id => id !== user.id))} /></td><td>{fullName(user)}</td><td>{user.email}</td><td>{user.type}</td></tr>)}
          {!selectedGroup.userIds.length && <tr><td colSpan={4} className="admin-empty">{text.noData}</td></tr>}
        </tbody></table></div>
      </Panel>}
      {entity === "users" && <Panel title={text.groups} actions={<Button onClick={() => { setGroupMembershipDraft(membership.map(group => group.id)); setGroupMembershipOpen(true); }}>{text.editGroupMembership}</Button>}>{membership.length ? membership.map(group => <p key={group.id}>{group.name}</p>) : <p>{text.noData}</p>}<p className="admin-note">{text.accessHint}</p></Panel>}
      {entity === "groups" && selectedGroup && <Panel title={text.workspaceAssociations} actions={<Button variant="primary" onClick={() => { setGroups(current => current.map(group => group.id === selectedGroup.id ? { ...group, workspaceIds: [...workspaceDraft], modifiedOn: now() } : group)); setPermissions(current => { const next = { ...current }; for (const workspaceId of workspaceDraft) next[workspaceId] = { ...(next[workspaceId] ?? {}), [selectedGroup.id]: next[workspaceId]?.[selectedGroup.id] ?? initialPermissions(selectedGroup.name.includes("Managers")) }; return next; }); notify(text.workspaceAssociationsSaved); }}>{text.saveWorkspaceAssociations}</Button>}><div className="permission-checks">{workspaces.map(workspace => <label className="admin-check" key={workspace.id}><input type="checkbox" checked={workspaceDraft.includes(workspace.id)} onChange={event => setWorkspaceDraft(current => event.target.checked ? [...new Set([...current, workspace.id])] : current.filter(id => id !== workspace.id))} />{workspace.name}</label>)}</div></Panel>}
      {workspaceTable}
    </>}
    <p className="admin-note">{text.localOnly}</p>
    <Modal open={pendingSave !== null} title={text.enableUser} onClose={() => setPendingSave(null)} footer={<><Button onClick={() => setPendingSave(null)}>{text.no}</Button><Button variant="primary" onClick={() => pendingSave && commit(pendingSave)}>{text.yes}</Button></>}><p>{text.enableMessage}</p></Modal>
    <Modal open={deleteOpen} title={text.deleteTitle} onClose={() => setDeleteOpen(false)} footer={<><Button onClick={() => setDeleteOpen(false)}>{copy.common.cancel}</Button><Button variant="danger" onClick={removeRecord}>{common.delete}</Button></>}><p>{text.deleteMessage}</p></Modal>
    {pickerOpen && selectedGroup && <Modal open title={text.selectUsers} onClose={() => setPickerOpen(false)} wide footer={<><Button onClick={() => setPickerOpen(false)}>{copy.common.cancel}</Button><Button variant="primary" disabled={!memberDraft.length} onClick={() => { setGroups(current => current.map(group => group.id === selectedId ? { ...group, userIds: [...new Set([...group.userIds, ...memberDraft])], modifiedOn: now() } : group)); setPickerOpen(false); setAddedOpen(true); }}>{text.apply}</Button></>}><TransferList items={users.filter(user => !selectedGroup.userIds.includes(user.id)).map(user => ({ id: user.id, label: fullName(user), detail: user.email }))} selectedIds={memberDraft} onChange={setMemberDraft} leftTitle={text.availableUsers} rightTitle={text.selectedUsers} /></Modal>}
    {groupMembershipOpen && selectedUser && <Modal open title={text.editGroupMembership} onClose={() => setGroupMembershipOpen(false)} wide footer={<><Button onClick={() => setGroupMembershipOpen(false)}>{copy.common.cancel}</Button><Button variant="primary" onClick={() => { setGroups(current => current.map(group => ({ ...group, userIds: groupMembershipDraft.includes(group.id) ? [...new Set([...group.userIds, selectedUser.id])] : group.userIds.filter(id => id !== selectedUser.id), modifiedOn: group.userIds.includes(selectedUser.id) !== groupMembershipDraft.includes(group.id) ? now() : group.modifiedOn }))); setGroupMembershipOpen(false); notify(text.groupMembershipSaved); }}>{text.apply}</Button></>}><TransferList items={groups.map(group => ({ id: group.id, label: group.name, detail: clientName(group.clientId) }))} selectedIds={groupMembershipDraft} onChange={setGroupMembershipDraft} leftTitle={text.availableGroups} rightTitle={text.selectedGroups} /></Modal>}
    <Modal open={addedOpen} title={text.addedTitle} onClose={() => setAddedOpen(false)} footer={<Button variant="primary" onClick={() => setAddedOpen(false)}>{text.okay}</Button>}><p>{text.addedMessage}</p></Modal>
    <Modal open={previewOpen} title={text.previewSecurity} onClose={() => setPreviewOpen(false)} footer={<><Button onClick={() => setPreviewOpen(false)}>{copy.common.cancel}</Button><Button disabled={!previewGroupId || !previewWorkspaceId} onClick={() => { setPermissionEditTarget({ groupId: previewGroupId, workspaceId: previewWorkspaceId }); setPreviewOpen(false); }}>{copy.permissionManagement.edit}</Button><Button variant="primary" disabled={!previewGroupId || !previewWorkspaceId} onClick={() => { setPreviewTarget({ groupId: previewGroupId, workspaceId: previewWorkspaceId }); setPreviewOpen(false); }}>{copy.permissionManagement.openPreview}</Button></>}>
      <p>{text.securityBoundary}</p>
      <div className="preview-picker-grid"><Field label={copy.permissionManagement.previewGroup} required><select value={previewGroupId} onChange={e => { setPreviewGroupId(e.target.value); const group = previewGroups.find(item => item.id === e.target.value); setPreviewWorkspaceId(workspaces.find(item => group?.workspaceIds.includes(item.id))?.id ?? ""); }}>{previewGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select></Field><Field label={copy.permissionManagement.previewWorkspace} required><select value={previewWorkspaceId} onChange={e => setPreviewWorkspaceId(e.target.value)}>{previewWorkspaces.map(workspace => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</select></Field></div>
      {!previewGroups.length || !previewWorkspaces.length ? <p className="admin-note">{copy.permissionManagement.previewUnavailable}</p> : <p className="admin-note">{text.accessHint}</p>}
    </Modal>
    {permissionEditTarget && <WorkspacePermissions open workspace={workspaces.find(item => item.id === permissionEditTarget.workspaceId)!} onClose={() => setPermissionEditTarget(null)} notify={notify} />}
    {previewTarget && <PermissionPreview workspaceName={workspaces.find(item => item.id === previewTarget.workspaceId)?.name ?? common.notProvided} groupName={groups.find(item => item.id === previewTarget.groupId)?.name ?? common.notProvided} permissions={permissions[previewTarget.workspaceId]?.[previewTarget.groupId] ?? ({ reviewCenter: false, role: "reviewer", flags: {} } satisfies PermissionSet)} onExit={() => setPreviewTarget(null)} />}
  </div>;
}
