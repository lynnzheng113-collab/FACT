import { useState } from "react";
import { copy } from "../constants/copy";
import { useAdministration } from "../state/Administration";
import type { Role } from "../state/navigation";
import { Badge, Button, PageHeader, Panel } from "../components/UI";


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
  const { workspaces, users, groups } = useAdministration();
  const [filters, setFilters] = useState<string[]>(["", "", "", "", "", "", ""]);
  const t = copy.userStatus;
  const workspaceName = (id: string | null) => workspaces.find(workspace => workspace.id === id)?.name ?? copy.access.platformScope;
  const current = t.currentAccounts[role];
  const workspaceUserIds = new Set(groups.filter(group => workspaceId ? group.workspaceIds.includes(workspaceId) : true).flatMap(group => group.userIds));
  const rows = [
    { id: copy.access.accounts[role].id, name: copy.access.accounts[role].name, email: current.email, currentCase: current.currentCase, clientName: current.clientName, webServer: current.webServer, status: t.online, lastUpdate: current.lastUpdate },
    ...(workspaceId ? [] : t.samples),
    ...users.filter(user => workspaceUserIds.has(user.id)).map(user => ({ id: user.id, name: `${user.lastName}${copy.userManagement.nameSeparator}${user.firstName}`, email: user.email, currentCase: workspaceName(workspaceId), clientName: workspaces.find(workspace => workspace.id === workspaceId)?.clientName ?? copy.fieldManagement.empty, webServer: t.unassigned, status: t.offline, lastUpdate: user.modifiedOn || copy.fieldManagement.empty })),
  ].filter(row => row.name.toLowerCase().includes(filters[0].toLowerCase()) && row.email.toLowerCase().includes(filters[1].toLowerCase()) && row.currentCase.toLowerCase().includes(filters[2].toLowerCase()) && row.clientName.toLowerCase().includes(filters[3].toLowerCase()) && row.webServer.toLowerCase().includes(filters[4].toLowerCase()) && row.status.toLowerCase().includes(filters[5].toLowerCase()) && row.lastUpdate.toLowerCase().includes(filters[6].toLowerCase()));
  return <Panel title={workspaceId ? `${t.title} · ${workspaceName(workspaceId)}` : t.title} subtitle={t.hint} className="table-panel user-status-panel"><div className="table-scroll"><table><thead><tr>{t.columns.map(label => <th key={label}>{label}</th>)}</tr><tr className="user-status-filters">{t.filterLabels.map((label, index) => <th key={label + index}><input aria-label={`${t.columns[index]} ${t.filters[index]}`} placeholder={t.filters[index]} value={filters[index]} onChange={event => setFilters(current => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /></th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{row.name}</td><td>{row.email}</td><td>{row.currentCase}</td><td>{row.clientName}</td><td>{row.webServer}</td><td>{row.status}</td><td>{row.lastUpdate}</td></tr>)}{!rows.length && <tr><td colSpan={t.columns.length}>{copy.userManagement.noData}</td></tr>}</tbody></table></div>
  </Panel>;
}

export function BatchesPage({ role, onReview }: { role: Role; onReview: () => void }) {
  const { batchOwner, setBatchOwner } = useAdministration();
  const account = copy.access.accounts[role];
  const t = copy.modules;
  return <div className="page"><PageHeader title={t.batchTitle} subtitle={t.batchHint} ids={copy.review.ids} priorities={[]} />
    <Panel className="table-panel"><div className="table-scroll"><table><thead><tr>{t.batchColumns.map(label => <th key={label}>{label}</th>)}</tr></thead><tbody><tr><td>{t.batchName}</td><td><Badge tone={batchOwner ? "info" : "neutral"}>{batchOwner ? t.checkedOut : copy.common.ready}</Badge></td><td>{batchOwner ?? t.unassigned}</td><td><div className="module-toolbar">{!batchOwner ? <Button variant="primary" onClick={() => setBatchOwner(account.name)}>{t.checkout}</Button> : <><Button variant="primary" disabled={batchOwner !== account.name} onClick={onReview}>{t.openBatch}</Button><Button disabled={batchOwner !== account.name} onClick={() => setBatchOwner(null)}>{t.release}</Button></>}</div></td></tr></tbody></table></div></Panel>
  </div>;
}
