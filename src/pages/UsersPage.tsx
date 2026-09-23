import { useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { copy } from "../constants/copy";
import { useAdministration, type GroupRecord, type UserRecord } from "../state/Administration";
import { Button, Field, Modal, PageHeader, Panel, Tabs } from "../components/UI";
import "../styles/users.css";
import { blankUser, ClientPicker, OtherDetails, UserForm } from "../components/UserForm";
import { TransferList } from "../components/TransferList";

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

export function UsersPage({ notify }: { notify: (message: string) => void }) {
  const { clients, users, setUsers, groups, setGroups, workspaces, setWorkspaces, setPermissions } = useAdministration();
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
  const selectedUser = users.find(user => user.id === selectedId);
  const selectedGroup = groups.find(group => group.id === selectedId);
  const clientName = (id: string) => clients.find(client => client.id === id)?.name ?? common.notProvided;
  const tabs: string[] = entity === "users" ? [text.userInformation, text.otherUserDetails] : [text.groupInformation, text.otherGroupDetails];
  const detailTabs = [...tabs, common.recordHistory];
  const membership = entity === "groups" ? groups.filter(group => group.id === selectedId) : groups.filter(group => group.userIds.includes(selectedId));
  const linkedWorkspaces = workspaces.filter(workspace => membership.some(group => group.workspaceIds.includes(workspace.id)));
  const openRecord = (id: string) => { setSelectedId(id); setView("detail"); setSection(0); setCheckedMembers([]); };
  const openNew = () => { setUserForm(blankUser()); setGroupForm(newGroup()); setError(""); setSection(0); setView("form"); };
  const back = () => { setView("list"); setError(""); setSection(0); };
  const edit = () => { if (selectedUser) setUserForm({ ...selectedUser }); if (selectedGroup) setGroupForm({ ...selectedGroup }); setError(""); setSection(0); setView("form"); };
  const commit = (mode: SaveMode) => {
    let id: string;
    if (entity === "users") {
      id = userForm.id || crypto.randomUUID();
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
  return <div className="page users-admin">
    <PageHeader title={text.title} subtitle={text.subtitle} ids={text.ids} priorities={[]} />
    <Tabs items={[text.users, text.groups]} active={text[entity]} onChange={label => { setEntity(label === text.users ? "users" : "groups"); back(); setSearch(""); setSelectedId(""); }} />
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
      {entity === "users" ? <UserForm value={userForm} onChange={setUserForm} other={section === 1} /> : <Panel title={tabs[section]}>{section === 0 ? <div className="admin-identity-form"><Field label={common.name} required><input aria-label={common.name} value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} /></Field><Field label={common.client} required><ClientPicker value={groupForm.clientId} onChange={id => setGroupForm({ ...groupForm, clientId: id })} /></Field></div> : <OtherDetails keywords={groupForm.keywords} notes={groupForm.notes} onChange={(key, value) => setGroupForm({ ...groupForm, [key]: value })} />}</Panel>}
    </>}
    {view === "detail" && (selectedUser || selectedGroup) && <>
      <div className="admin-actions"><Button variant="primary" onClick={edit}>{copy.common.edit}</Button><Button onClick={() => setDeleteOpen(true)}>{common.delete}</Button><Button onClick={back}>{copy.common.back}</Button><Button onClick={() => setPreviewOpen(true)}>{text.previewSecurity}</Button><Button onClick={() => setSection(2)}>{common.viewAudit}</Button></div>
      <Tabs items={detailTabs} active={detailTabs[section]} onChange={label => setSection(detailTabs.indexOf(label))} />
      <Panel title={entity === "users" && selectedUser ? fullName(selectedUser) : selectedGroup?.name}>
        {section === 0 && (entity === "users" && selectedUser ? detail([[text.firstName, selectedUser.firstName], [text.lastName, selectedUser.lastName], [text.email, selectedUser.email], [text.type, selectedUser.type], [common.client, clientName(selectedUser.clientId)], [text.relativityAccess, selectedUser.access ? text.enabled : text.disabled], [text.disableOn, selectedUser.disableOn], [text.trustedIPs, selectedUser.trustedIPs]]) : selectedGroup && detail([[common.name, selectedGroup.name], [common.client, clientName(selectedGroup.clientId)], [text.groupType, text.systemGroup]]))}
        {section === 1 && detail([[common.keywords, (selectedUser ?? selectedGroup)?.keywords ?? ""], [common.notes, (selectedUser ?? selectedGroup)?.notes ?? ""]])}
        {section === 2 && detail([[common.createdBy, copy.workspace.user], [common.createdOn, (selectedUser ?? selectedGroup)?.createdOn ?? ""], [common.lastModifiedBy, copy.workspace.user], [common.lastModifiedOn, (selectedUser ?? selectedGroup)?.modifiedOn ?? ""]])}
      </Panel>
      {entity === "groups" && selectedGroup && <Panel title={text.users} className="table-panel" actions={<><Button onClick={() => { setMemberDraft([]); setPickerOpen(true); }}>{text.add}</Button><Button disabled={!checkedMembers.length} onClick={() => { setGroups(current => current.map(group => group.id === selectedId ? { ...group, userIds: group.userIds.filter(id => !checkedMembers.includes(id)), modifiedOn: now() } : group)); setCheckedMembers([]); notify(text.removed); }}>{text.remove}</Button></>}>
        <div className="table-scroll"><table><thead><tr><th><input type="checkbox" aria-label={text.selectAll} checked={selectedGroup.userIds.length > 0 && selectedGroup.userIds.every(id => checkedMembers.includes(id))} onChange={e => setCheckedMembers(e.target.checked ? selectedGroup.userIds : [])} /></th>{text.columns.members.map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>
          {users.filter(user => selectedGroup.userIds.includes(user.id)).map(user => <tr key={user.id}><td><input type="checkbox" aria-label={fullName(user)} checked={checkedMembers.includes(user.id)} onChange={e => setCheckedMembers(current => e.target.checked ? [...current, user.id] : current.filter(id => id !== user.id))} /></td><td>{fullName(user)}</td><td>{user.email}</td><td>{user.type}</td></tr>)}
          {!selectedGroup.userIds.length && <tr><td colSpan={4} className="admin-empty">{text.noData}</td></tr>}
        </tbody></table></div>
      </Panel>}
      {entity === "users" && <Panel title={text.groups}>{membership.length ? membership.map(group => <p key={group.id}>{group.name}</p>) : <p>{text.noData}</p>}<p className="admin-note">{text.accessHint}</p></Panel>}
      {workspaceTable}
    </>}
    <p className="admin-note">{text.localOnly}</p>
    <Modal open={pendingSave !== null} title={text.enableUser} onClose={() => setPendingSave(null)} footer={<><Button onClick={() => setPendingSave(null)}>{text.no}</Button><Button variant="primary" onClick={() => pendingSave && commit(pendingSave)}>{text.yes}</Button></>}><p>{text.enableMessage}</p></Modal>
    <Modal open={deleteOpen} title={text.deleteTitle} onClose={() => setDeleteOpen(false)} footer={<><Button onClick={() => setDeleteOpen(false)}>{copy.common.cancel}</Button><Button variant="danger" onClick={removeRecord}>{common.delete}</Button></>}><p>{text.deleteMessage}</p></Modal>
    {pickerOpen && selectedGroup && <Modal open title={text.selectUsers} onClose={() => setPickerOpen(false)} wide footer={<><Button onClick={() => setPickerOpen(false)}>{copy.common.cancel}</Button><Button variant="primary" disabled={!memberDraft.length} onClick={() => { setGroups(current => current.map(group => group.id === selectedId ? { ...group, userIds: [...new Set([...group.userIds, ...memberDraft])], modifiedOn: now() } : group)); setPickerOpen(false); setAddedOpen(true); }}>{text.apply}</Button></>}><TransferList items={users.filter(user => !selectedGroup.userIds.includes(user.id)).map(user => ({ id: user.id, label: fullName(user), detail: user.email }))} selectedIds={memberDraft} onChange={setMemberDraft} leftTitle={text.availableUsers} rightTitle={text.selectedUsers} /></Modal>}
    <Modal open={addedOpen} title={text.addedTitle} onClose={() => setAddedOpen(false)} footer={<Button variant="primary" onClick={() => setAddedOpen(false)}>{text.okay}</Button>}><p>{text.addedMessage}</p></Modal>
    <Modal open={previewOpen} title={text.previewSecurity} onClose={() => setPreviewOpen(false)} footer={<Button onClick={() => setPreviewOpen(false)}>{copy.common.close}</Button>}><p>{text.securityBoundary}</p><h3 className="admin-selection">{text.groups}</h3>{membership.map(group => <p key={group.id}>{group.name}</p>)}{!membership.length && <p>{text.noData}</p>}<h3 className="admin-selection">{common.allWorkspaces}</h3>{linkedWorkspaces.map(workspace => <p key={workspace.id}>{workspace.name}</p>)}{!linkedWorkspaces.length && <p>{text.noData}</p>}<p className="admin-note">{text.accessHint}</p></Modal>
  </div>;
}
