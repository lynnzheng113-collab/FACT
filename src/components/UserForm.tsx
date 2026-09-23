import { useState } from "react";
import { copy } from "../constants/copy";
import { useAdministration, type UserRecord } from "../state/Administration";
import { Button, Field, Modal, Panel, Toggle } from "./UI";

export function blankUser(): UserRecord {
  return { id: "", firstName: "", lastName: "", email: "", type: "", clientId: "", access: true, disableOn: "", trustedIPs: "", changeSettings: true, changeViewer: false, documentSkip: true, shortcuts: true, ...copy.userManagement.initialSettings, showFilters: true, keywords: "", notes: "", createdOn: "", modifiedOn: "" };
}

export function ClientPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const text = copy.userManagement;
  const { clients } = useAdministration();
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState(value);
  const [search, setSearch] = useState("");
  const filtered = clients.filter(client => `${client.name} ${client.number}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <div className="admin-client-picker"><span>{clients.find(client => client.id === value)?.name}</span><Button onClick={() => { setChosen(value); setSearch(""); setOpen(true); }}>{copy.workspaceManagement.select}</Button>{value && <Button variant="quiet" onClick={() => onChange("")}>{copy.common.clear}</Button>}</div>
    <Modal open={open} title={text.selectClient} onClose={() => setOpen(false)} footer={<><Button onClick={() => setOpen(false)}>{copy.common.cancel}</Button><Button variant="primary" disabled={!chosen} onClick={() => { onChange(chosen); setOpen(false); }}>{text.apply}</Button></>}>
      <input aria-label={text.clientSearch} placeholder={text.clientSearch} value={search} onChange={e => setSearch(e.target.value)} />
      <div className="admin-client-options">{filtered.map(client => <label className="admin-check" key={client.id}><input type="radio" name="client-picker" value={client.id} checked={chosen === client.id} onChange={() => setChosen(client.id)} /><span>{client.name}<small>{client.number}</small></span></label>)}{!filtered.length && <p>{text.noData}</p>}</div>
    </Modal>
  </>;
}

export function OtherDetails({ keywords, notes, onChange }: { keywords: string; notes: string; onChange: (key: "keywords" | "notes", value: string) => void }) {
  return <div className="form-grid"><Field label={copy.workspaceManagement.keywords}><input aria-label={copy.workspaceManagement.keywords} value={keywords} onChange={e => onChange("keywords", e.target.value)} /></Field><Field label={copy.workspaceManagement.notes}><textarea aria-label={copy.workspaceManagement.notes} value={notes} onChange={e => onChange("notes", e.target.value)} /></Field></div>;
}

export function UserForm({ value, onChange, other }: { value: UserRecord; onChange: (value: UserRecord) => void; other: boolean }) {
  const text = copy.userManagement;
  const update = <K extends keyof UserRecord>(key: K, next: UserRecord[K]) => onChange({ ...value, [key]: next });
  if (other) return <Panel title={text.otherUserDetails}><OtherDetails keywords={value.keywords} notes={value.notes} onChange={update} /></Panel>;
  return <>
    <Panel title={text.userInformation}><div className="admin-identity-form">
      {(["firstName", "lastName", "email"] as const).map(key => <Field key={key} label={text[key]} required><input aria-label={text[key]} required type={key === "email" ? "email" : "text"} value={value[key]} onChange={e => update(key, e.target.value)} /></Field>)}
      <Field label={text.type} required><select aria-label={text.type} required value={value.type} onChange={e => update("type", e.target.value)}><option value="">{copy.workspaceManagement.select}</option><option>{text.internal}</option></select></Field>
      <Field label={copy.workspaceManagement.client} required><ClientPicker value={value.clientId} onChange={id => update("clientId", id)} /></Field>
    </div></Panel>
    <Panel title={text.access}><div className="form-grid">
      <Toggle label={text.relativityAccess} checked={value.access} onChange={() => update("access", !value.access)} />
      <Field label={text.disableOn}><input type="datetime-local" aria-label={text.disableOn} value={value.disableOn} onChange={e => update("disableOn", e.target.value)} /></Field>
      <Field label={text.trustedIPs} hint={text.trustedIPsHint}><textarea aria-label={text.trustedIPs} value={value.trustedIPs} onChange={e => update("trustedIPs", e.target.value)} /></Field>
    </div></Panel>
    <Panel title={text.permissions}><div className="form-grid">
      {(["changeSettings", "changeViewer", "documentSkip", "shortcuts"] as const).map(key => <Toggle key={key} label={text[key]} checked={value[key]} onChange={() => update(key, !value[key])} />)}
    </div></Panel>
    <Panel title={text.defaults}><div className="form-grid">
      <Field label={text.pageLength} required><select aria-label={text.pageLength} value={value.pageLength} onChange={e => update("pageLength", e.target.value)}>{text.pageLengths.map(option => <option key={option}>{option}</option>)}</select></Field>
      <Field label={text.documentViewer}><span>{text.defaultViewer}</span></Field>
      <Field label={text.viewerPreference} required><select aria-label={text.viewerPreference} value={value.viewerPreference} onChange={e => update("viewerPreference", e.target.value)}><option>{text.viewer}</option></select></Field>
      <Toggle label={text.showFilters} checked={value.showFilters} onChange={() => update("showFilters", !value.showFilters)} />
      <Field label={text.searchOwner}><div className="admin-radio-group">{[text.public, text.user].map(option => <label key={option} className="admin-check"><input type="radio" name="search-owner" checked={value.searchOwner === option} onChange={() => update("searchOwner", option)} />{option}</label>)}</div></Field>
      <Field label={text.skipPreference}><span>{text.normal}</span></Field>
      <Field label={text.notifications}><div className="admin-radio-group">{text.notificationOptions.map(option => <label key={option} className="admin-check"><input type="radio" name="user-notifications" checked={value.notifications === option} onChange={() => update("notifications", option)} />{option}</label>)}</div></Field>
    </div></Panel>
  </>;
}
