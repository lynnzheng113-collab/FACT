import { useState } from "react";
import { copy } from "../constants/copy";
import { type GroupRecord, type WorkspaceRecord } from "../state/Administration";
import { permissionActions, permissionChanges, samePermissions, setReviewFeature, type PermissionSet, type ReviewRole } from "../state/permissions";
import { Button, Modal, Toggle } from "./UI";

const t = copy.permissionManagement;
type Section = "features" | "objects" | "tabs" | "other";
export function PermissionEditor({ workspace, group, groups, initial, onSave, onBack, onClose, onSwitch }: {
  workspace: WorkspaceRecord; group: GroupRecord; groups: GroupRecord[]; initial: PermissionSet;
  onSave: (value: PermissionSet) => void; onBack: () => void; onClose: () => void; onSwitch: (id: string) => void;
}) {
  const [draft, setDraft] = useState<PermissionSet>(() => structuredClone(initial));
  const [section, setSection] = useState<Section>("features");
  const [query, setQuery] = useState("");
  const [details, setDetails] = useState(false);
  const [summary, setSummary] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const dirty = !samePermissions(initial, draft);
  const leave = (action: () => void) => dirty ? setPending(() => action) : action();
  const match = (label: string) => label.toLowerCase().includes(query.trim().toLowerCase());
  const flag = (key: string) => !!draft.flags[key];
  const toggle = (key: string) => setDraft(current => ({ ...current, flags: { ...current.flags, [key]: !current.flags[key] } }));
  const setObject = (id: string, action: string) => setDraft(current => {
    const flags = { ...current.flags };
    if (action === "none") permissionActions.forEach(a => { flags[`object.${id}.${a}`] = false; });
    else {
      flags[`object.${id}.${action}`] = !flags[`object.${id}.${action}`];
      if (action !== "view" && flags[`object.${id}.${action}`]) flags[`object.${id}.view`] = true;
      if (action === "view" && !flags[`object.${id}.view`]) permissionActions.forEach(a => { flags[`object.${id}.${a}`] = false; });
    }
    return { ...current, flags };
  });
  const actionLabels = { none: t.none, view: t.view, edit: t.editAction, delete: t.deleteAction, add: t.add, security: t.editSecurity };
  const changes = permissionChanges(initial, draft);
  const roleSelect = <select aria-label={t.role} disabled={!draft.reviewCenter} value={draft.role} onChange={e => setDraft(current => setReviewFeature(current, current.reviewCenter, e.target.value as ReviewRole))}>
    <option value="reviewer">{t.reviewer}</option><option value="powerUser">{t.powerUser}</option><option disabled>{t.administrator}</option>
  </select>;
  return <div className="permission-dialog">
    <Modal open wide title={summary ? t.summary : t.title} onClose={() => leave(onClose)} footer={summary ? <>
      <Button onClick={() => setSummary(false)}>{copy.common.back}</Button><Button variant="primary" disabled={!dirty} onClick={() => onSave(draft)}>{copy.common.save}</Button>
    </> : <><Button variant="primary" disabled={!dirty} onClick={() => setSummary(true)}>{t.reviewSave}</Button><Button disabled={!dirty} onClick={() => setDraft(structuredClone(initial))}>{t.revert}</Button><Button onClick={() => leave(onClose)}>{copy.common.close}</Button></>}>
      <div className="permission-selection"><span><strong>{copy.userManagement.selectedWorkspace}</strong>{workspace.name}</span><label><strong>{t.selectedGroup}</strong><select aria-label={t.selectedGroup} value={group.id} onChange={e => { const id = e.target.value; leave(() => onSwitch(id)); }}>{groups.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label></div>
      {summary ? <div className="permission-summary"><p className="permission-notice">{t.summaryHint}</p>{changes.map(category => <details key={category.id} open><summary>{category.title}</summary>{category.rows.length ? <div className="table-scroll"><table><thead><tr><th>{t.permissionName}</th><th>{t.before}</th><th>{t.after}</th></tr></thead><tbody>{category.rows.map(row => <tr key={row.label}><td>{row.label}</td><td>{row.before}</td><td>{row.after}</td></tr>)}</tbody></table></div> : <p className="admin-note">{t.noChanges}</p>}</details>)}</div> : <div className="permission-layout">
        <nav className="permission-nav" aria-label={t.title}><Button onClick={() => leave(onBack)}>{t.groups}</Button>{(["features", "objects", "tabs", "other"] as Section[]).map(id => <button type="button" key={id} aria-current={section === id ? "page" : undefined} onClick={() => { setSection(id); setQuery(""); setDetails(false); }}>{t[id]}</button>)}</nav>
        <section className="permission-content"><h3>{t[section]}</h3><input type="search" aria-label={t.search} placeholder={t.search} value={query} onChange={e => setQuery(e.target.value)} />
          {section === "features" && <div className={details ? "permission-feature-grid has-details" : "permission-feature-grid"}>
            <div><h4>{t.reviewActions}</h4>{[{ label: t.manageImage, key: "feature.manageImage" }, { label: t.code, key: "object.document.edit" }, { label: t.sentiment, key: "feature.sentiment" }].filter(item => match(item.label)).map(item => <div className="permission-feature" key={item.key}><Toggle label={item.label} checked={flag(item.key)} onChange={() => toggle(item.key)} /></div>)}
              <h4>{t.reviewApps}</h4>{match(t.reviewCenter) && <div className="permission-feature"><Toggle label={t.reviewCenter} checked={draft.reviewCenter} onChange={() => { setDraft(current => setReviewFeature(current, !current.reviewCenter)); setDetails(true); }} />{!details && roleSelect}<Button variant="quiet" onClick={() => setDetails(!details)}>{details ? t.collapse : t.details}</Button></div>}
            </div>
            {details && <aside className="permission-feature-details"><Button variant="quiet" onClick={() => setDetails(false)}>{t.collapse}</Button><h3>{t.reviewCenter}</h3>{roleSelect}<p className="admin-note">{t.roleBoundary}</p><h4>{t.objectItems}</h4>{draft.role === "powerUser" && <p>{t.objectRows[0].label}{t.separator}{t.view}{t.valueSeparator}{t.editAction}</p>}<p>{t.objectRows[4].label}{t.separator}{t.view}</p><p>{t.objectRows[5].label}{t.separator}{t.view}</p><h4>{t.tabItems}</h4>{t.tabRows.filter(row => row.id === "reviewQueues" || (draft.role === "powerUser" && ["documents", "reviewCenter"].includes(row.id))).map(row => <p key={row.id}>{row.label}</p>)}</aside>}
            {!match(t.reviewCenter) && ![t.manageImage, t.code, t.sentiment].some(match) && <p>{copy.userManagement.noData}</p>}
          </div>}
          {section === "objects" && <div className="table-scroll"><table className="permission-matrix"><thead><tr><th>{t.permissionName}</th>{(["none", ...permissionActions] as const).map(action => <th key={action}>{actionLabels[action]}</th>)}</tr></thead><tbody>{t.objectRows.filter(row => match(row.label)).map(row => <ObjectRows key={row.id} id={row.id} label={row.label} flag={flag} onAction={setObject} onToggle={toggle} actionLabels={actionLabels} />)}{!t.objectRows.some(row => match(row.label)) && <tr><td colSpan={7} className="admin-empty">{copy.userManagement.noData}</td></tr>}</tbody></table></div>}
          {section === "tabs" && <div className="permission-checks">{t.tabRows.filter(row => match(row.label)).map(row => <label className="admin-check" key={row.id}><input type="checkbox" checked={flag(`tab.${row.id}`)} onChange={() => toggle(`tab.${row.id}`)} />{row.label}</label>)}{!t.tabRows.some(row => match(row.label)) && <p>{copy.userManagement.noData}</p>}</div>}
          {section === "other" && <div className="permission-settings">{t.settingSections.map(category => <section key={category.id}><h4>{category.label}</h4>{category.items.filter(row => match(row.label)).map(row => <label className="admin-check" key={row.id}><input type="checkbox" checked={flag(`other.${row.id}`)} onChange={() => toggle(`other.${row.id}`)} />{row.label}</label>)}</section>)}</div>}
        </section>
      </div>}
    </Modal>
    <Modal open={!!pending} title={t.discardTitle} onClose={() => setPending(null)} footer={<><Button onClick={() => setPending(null)}>{t.keepEditing}</Button><Button variant="danger" onClick={() => { const action = pending; setPending(null); action?.(); }}>{t.discard}</Button></>}><p>{t.discardMessage}</p></Modal>
  </div>;
}

function ObjectRows({ id, label, flag, onAction, onToggle, actionLabels }: { id: string; label: string; flag: (key: string) => boolean; onAction: (id: string, action: string) => void; onToggle: (key: string) => void; actionLabels: Record<string, string> }) {
  return <><tr><td>{label}</td>{["none", ...permissionActions].map(action => <td key={action}><input type="checkbox" aria-label={`${label}${t.separator}${actionLabels[action]}`} checked={action === "none" ? !permissionActions.some(a => flag(`object.${id}.${a}`)) : flag(`object.${id}.${action}`)} onChange={() => onAction(id, action)} /></td>)}</tr>{id === "document" && t.documentActions.map(row => <tr key={row.id}><td colSpan={7}><Toggle label={row.label} checked={flag(`document.${row.id}`)} onChange={() => onToggle(`document.${row.id}`)} /></td></tr>)}</>;
}
