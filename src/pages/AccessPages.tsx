import { useState } from "react";
import { copy } from "../constants/copy";
import { useAdministration } from "../state/Administration";
import type { Role } from "../state/navigation";
import { Badge, Button, PageHeader, Panel } from "../components/UI";

export type AuditEntry = { id: string; time: string; user: string; action: string; workspace: string };

export function WorkspaceSelectionPage({ onEnter }: { onEnter: (id: string) => void }) {
  const { workspaces } = useAdministration();
  const [filter, setFilter] = useState("");
  return <div className="page"><PageHeader title={copy.access.selection} subtitle={copy.access.selectHint} ids={copy.workspaceManagement.ids} priorities={[]} />
    <input className="module-filter" aria-label={copy.common.search} placeholder={copy.common.search} value={filter} onChange={event => setFilter(event.target.value)} />
    <div className="workspace-cards">{workspaces.filter(workspace => workspace.name.toLowerCase().includes(filter.toLowerCase())).map(workspace => <Panel key={workspace.id} title={workspace.name} subtitle={workspace.clientName}>
      <p>{workspace.matterName}</p><Button variant="primary" onClick={() => onEnter(workspace.id)}>{copy.workspaceManagement.openWorkspace}</Button>
    </Panel>)}</div>
  </div>;
}

export function UserStatusPage({ role, workspaceId }: { role: Role; workspaceId: string | null }) {
  const { workspaces, users } = useAdministration();
  const [filter, setFilter] = useState("");
  const t = copy.userStatus;
  const workspaceName = (id: string | null) => workspaces.find(workspace => workspace.id === id)?.name ?? copy.access.platformScope;
  const rows = [
    { id: copy.access.accounts[role].id, name: copy.access.accounts[role].name, role: copy.access.roles[role], workspace: workspaceName(workspaceId), status: t.online, source: t.current },
    ...t.samples.map(user => ({ ...user, role: copy.access.roles.reviewer, workspace: workspaceName(user.workspaceId), status: t.online, source: t.sample })),
    ...users.map(user => ({ id: user.id, name: `${user.lastName}${copy.userManagement.nameSeparator}${user.firstName}`, role: user.type, workspace: copy.fieldManagement.empty, status: t.offline, source: t.account })),
  ].filter(row => `${row.name} ${row.workspace}`.toLowerCase().includes(filter.toLowerCase()));
  return <Panel title={t.title} subtitle={t.hint} className="table-panel"><div className="module-toolbar"><input aria-label={t.filter} placeholder={t.filter} value={filter} onChange={event => setFilter(event.target.value)} /></div>
    <div className="table-scroll"><table><thead><tr>{t.columns.map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{row.name}</td><td>{row.role}</td><td><Badge tone={row.status === t.online ? "success" : "neutral"}>{row.status}</Badge></td><td>{row.workspace}</td><td>{row.source}</td></tr>)}{!rows.length && <tr><td colSpan={t.columns.length}>{copy.userManagement.noData}</td></tr>}</tbody></table></div>
  </Panel>;
}

export function AuditPage({ entries }: { entries: AuditEntry[] }) {
  const [filter, setFilter] = useState("");
  const t = copy.audit;
  const rows = entries.filter(entry => `${entry.user} ${entry.action} ${entry.workspace}`.toLowerCase().includes(filter.toLowerCase()));
  return <div className="page"><PageHeader title={t.title} subtitle={t.hint} ids={t.title} priorities={[]} />
    <input className="module-filter" aria-label={t.filter} placeholder={t.filter} value={filter} onChange={event => setFilter(event.target.value)} />
    <Panel className="table-panel"><div className="table-scroll"><table><thead><tr>{t.columns.map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{row.time}</td><td>{row.user}</td><td>{row.action}</td><td>{row.workspace}</td></tr>)}{!rows.length && <tr><td colSpan={t.columns.length}>{t.empty}</td></tr>}</tbody></table></div></Panel>
  </div>;
}

export function BatchesPage({ role, onReview }: { role: Role; onReview: () => void }) {
  const { batchOwner, setBatchOwner } = useAdministration();
  const account = copy.access.accounts[role];
  const t = copy.modules;
  return <div className="page"><PageHeader title={t.batchTitle} subtitle={t.batchHint} ids={copy.review.ids} priorities={[]} />
    <Panel className="table-panel"><div className="table-scroll"><table><thead><tr>{t.batchColumns.map(label => <th key={label}>{label}</th>)}</tr></thead><tbody><tr><td>{t.batchName}</td><td><Badge tone={batchOwner ? "info" : "neutral"}>{batchOwner ? t.checkedOut : copy.common.ready}</Badge></td><td>{batchOwner ?? t.unassigned}</td><td><div className="module-toolbar">{!batchOwner ? <Button variant="primary" onClick={() => setBatchOwner(account.name)}>{t.checkout}</Button> : <><Button variant="primary" disabled={batchOwner !== account.name} onClick={onReview}>{t.openBatch}</Button><Button disabled={batchOwner !== account.name} onClick={() => setBatchOwner(null)}>{t.release}</Button></>}</div></td></tr></tbody></table></div></Panel>
  </div>;
}
