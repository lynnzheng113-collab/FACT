import { Fragment, useState } from "react";
import { Files, FolderOpen, ListChecks, Network } from "lucide-react";
import { copy } from "../constants/copy";
import { permissionActions, type PermissionSet } from "../state/permissions";
import { Button } from "./UI";

export function PermissionPreview({ workspaceName, groupName, permissions, onExit }: { workspaceName: string; groupName: string; permissions: PermissionSet; onExit: () => void }) {
  const t = copy.permissionManagement;
  const tabs = t.tabRows.filter(row => permissions.flags[`tab.${row.id}`]);
  const [selected, setSelected] = useState(tabs.some(row => row.id === "documents") ? "documents" : tabs[0]?.id);
  const [query, setQuery] = useState("");
  const [previewMode, setPreviewMode] = useState<"pages" | "settings">("pages");
  const icons = { documents: Files, reviewQueues: ListChecks, reviewCenter: Network, lists: ListChecks, reviewManagement: FolderOpen };
  const active = tabs.find(row => row.id === selected);
  const allowed = selected === "documents" ? permissions.flags["object.document.view"] : selected === "lists" ? permissions.flags["object.list.view"] : selected === "reviewQueues" ? permissions.flags["object.batch.view"] : true;
  const settingRows = t.objectRows.map(row => ({ row, values: permissionActions.filter(action => permissions.flags[`object.${row.id}.${action}`]).map(action => ({ action, label: action === "view" ? t.view : action === "edit" ? t.editAction : action === "delete" ? t.deleteAction : action === "add" ? t.add : t.editSecurity })) }));
  return <section className="permission-preview" role="dialog" aria-modal="true" aria-label={copy.userManagement.previewSecurity}>
    <header className="permission-preview-banner"><span>{t.previewAs}{t.separator}<strong>{groupName}</strong></span><div className="permission-preview-mode"><Button variant={previewMode === "pages" ? "primary" : "quiet"} onClick={() => setPreviewMode("pages")}>{t.previewPages}</Button><Button variant={previewMode === "settings" ? "primary" : "quiet"} onClick={() => setPreviewMode("settings")}>{t.previewSettings}</Button><Button onClick={onExit}>{t.exitPreview}</Button></div></header>
    <div className="permission-preview-title"><strong>{workspaceName}</strong>{previewMode === "pages" && <span>{active?.label}</span>}</div>
    {previewMode === "settings" ? <main className="permission-preview-settings"><p className="permission-notice">{t.previewSettingsHint}</p><div className="table-scroll"><table className="permission-matrix"><thead><tr><th>{t.permissionName}</th>{permissionActions.map(action => <th key={action}>{action === "view" ? t.view : action === "edit" ? t.editAction : action === "delete" ? t.deleteAction : action === "add" ? t.add : t.editSecurity}</th>)}</tr></thead><tbody>{settingRows.map(({ row, values }) => <Fragment key={row.id}><tr><td>{row.label}</td>{permissionActions.map(action => <td key={action}>{values.some(item => item.action === action) ? t.on : t.off}</td>)}</tr>{row.id === "document" && t.documentActions.map(action => <tr key={action.id}><td colSpan={permissionActions.length + 1}><span className="admin-note">{action.label}{t.separator}{permissions.flags[`document.${action.id}`] ? t.on : t.off}</span></td></tr>)}</Fragment>)}</tbody></table></div></main> : <div className="permission-preview-layout"><nav aria-label={t.tabs}>{tabs.map(row => { const Icon = icons[row.id as keyof typeof icons]; return <button type="button" className={selected === row.id ? "is-active" : ""} key={row.id} onClick={() => { setSelected(row.id); setQuery(""); }}><Icon size={22} /><span>{row.label}</span></button>; })}</nav>
      <main>{!active ? <div className="permission-empty"><FolderOpen /><p>{t.noTabs}</p></div> : !allowed ? <div className="permission-empty"><p>{t.noObjectAccess}</p></div> : selected === "documents" ? <div className="permission-document-preview">
        {permissions.flags["other.folders"] && <aside><strong>{t.settingSections[0].items[0].label}</strong><p>{workspaceName}</p></aside>}
        <div><h2>{active.label}</h2><div className="table-scroll"><table><thead><tr>{t.documentColumns.map(label => <th key={label}>{label}</th>)}</tr></thead><tbody><tr><td colSpan={t.documentColumns.length} className="admin-empty">{copy.userManagement.noData}</td></tr></tbody></table></div></div>
      </div> : selected === "reviewManagement" ? <><h2>{t.library}</h2><div className="admin-toolbar"><strong>{t.queueTemplates}</strong><input type="search" aria-label={copy.userManagement.filter} placeholder={copy.userManagement.filter} value={query} onChange={e => setQuery(e.target.value)} /></div><div className="table-scroll"><table><thead><tr><th>{copy.workspaceManagement.name}</th><th>{t.queueType}</th></tr></thead><tbody>{t.libraryRows.map((label, index) => ({ label, index })).filter(row => row.label.toLowerCase().includes(query.toLowerCase())).map(row => <tr key={row.label}><td>{row.label}</td><td>{row.index === t.prioritizedRow ? t.prioritized : t.savedSearch}</td></tr>)}</tbody></table></div></> : <div className="permission-empty"><FolderOpen size={48} /><h2>{selected === "reviewQueues" ? t.noQueues : selected === "reviewCenter" ? t.noWorkspaceQueues : copy.userManagement.noData}</h2>{selected === "reviewQueues" && <p>{t.noAssignedQueues}</p>}</div>}</main>
    </div>}
  </section>;
}
