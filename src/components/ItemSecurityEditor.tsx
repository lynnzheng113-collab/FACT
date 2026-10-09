import { useMemo, useState } from "react";
import { copy } from "../constants/copy";
import type { GroupRecord } from "../state/Administration";
import { Button, Modal, Toggle } from "./UI";
import { TransferList } from "./TransferList";

type PermissionRow = { id: string; label: string };
type PermissionSection = { id: string; label: string; rows: PermissionRow[] };
export type ItemPermissionDraft = Record<string, Record<string, boolean>>;
const basicPermissionIds = new Set(["view", "edit", "delete", "add", "security"]);

export function ItemSecurityEditor({
  open,
  title,
  itemName,
  workspaceName,
  groups,
  initialIncludedIds,
  initialPermissions,
  sections,
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  itemName: string;
  workspaceName: string;
  groups: GroupRecord[];
  initialIncludedIds: string[];
  initialPermissions?: ItemPermissionDraft;
  sections: PermissionSection[];
  onClose: () => void;
  onSave: (includedIds: string[], permissions: ItemPermissionDraft) => void;
}) {
  return open ? <ItemSecurityContent key={`${title}-${itemName}`} {...{ title, itemName, workspaceName, groups, initialIncludedIds, initialPermissions, sections, onClose, onSave }} /> : null;
}

function ItemSecurityContent({ title, itemName, workspaceName, groups, initialIncludedIds, initialPermissions, sections, onClose, onSave }: Omit<Parameters<typeof ItemSecurityEditor>[0], "open">) {
  const t = copy.itemSecurity;
  const [step, setStep] = useState<"groups" | "permissions">("groups");
  const [includedIds, setIncludedIds] = useState(initialIncludedIds);
  const [selectedGroupId, setSelectedGroupId] = useState(initialIncludedIds[0] ?? "");
  const [draft, setDraft] = useState<ItemPermissionDraft>(() => structuredClone(initialPermissions ?? {}));
  const includedGroups = groups.filter(group => includedIds.includes(group.id));
  const selectedGroup = includedGroups.find(group => group.id === selectedGroupId) ?? includedGroups[0];
  const selectedPermissions = selectedGroup ? draft[selectedGroup.id] ?? {} : {};
  const groupItems = useMemo(() => groups.map(group => ({ id: group.id, label: group.name, detail: `${group.userIds.length} ${t.members}` })), [groups, t.members]);
  const setPermission = (permissionId: string, value: boolean) => {
    if (!selectedGroup) return;
    setDraft(current => {
      const permissions = { ...(current[selectedGroup.id] ?? {}), [permissionId]: value };
      if (permissionId !== "view" && value) permissions.view = true;
      if (permissionId === "view" && !value) basicPermissionIds.forEach(id => { permissions[id] = false; });
      return { ...current, [selectedGroup.id]: permissions };
    });
  };
  const continueToPermissions = () => {
    const next = includedIds[0] ?? "";
    setDraft(current => Object.fromEntries(includedIds.map(id => [id, { ...(current[id] ?? {}), view: true }])));
    setSelectedGroupId(current => includedIds.includes(current) ? current : next);
    setStep("permissions");
  };
  const save = () => { onSave(includedIds, draft); onClose(); };
  return <div className="permission-dialog">
    <Modal open wide title={title} onClose={onClose} footer={step === "groups" ? <><Button onClick={onClose}>{copy.common.cancel}</Button><Button variant="primary" disabled={!includedIds.length} onClick={continueToPermissions}>{t.continueToPermissions}</Button></> : <><Button onClick={() => setStep("groups")}>{t.backToGroups}</Button><Button variant="primary" onClick={save}>{copy.common.save}</Button></>}>
      <div className="permission-selection"><span><strong>{t.workspace}</strong>{workspaceName}</span><span><strong>{t.item}</strong>{itemName}</span></div>
      <div className="item-security-steps" aria-label={t.steps}><span className={step === "groups" ? "is-active" : ""}>{t.stepGroups}</span><span className={step === "permissions" ? "is-active" : ""}>{t.stepPermissions}</span></div>
      {step === "groups" ? <section>
        <h3>{t.groupsInScope}</h3><p className="permission-notice">{t.includedViewHint}</p>
        <TransferList items={groupItems} selectedIds={includedIds} onChange={setIncludedIds} leftTitle={t.availableGroups} rightTitle={t.includedGroups} />
      </section> : <section>
        <div className="permission-selection"><label><strong>{t.selectedGroup}</strong><select aria-label={t.selectedGroup} value={selectedGroup?.id ?? ""} onChange={event => setSelectedGroupId(event.target.value)}>{includedGroups.map(group => <option value={group.id} key={group.id}>{group.name}</option>)}</select></label></div>
        {!selectedGroup ? <p className="admin-empty">{t.noIncludedGroups}</p> : <div className="item-security-permissions">{sections.map(section => <section key={section.id}><h3>{section.label}</h3>{section.rows.map(row => basicPermissionIds.has(row.id) ? <label className="item-security-check" key={row.id}><input type="checkbox" checked={!!selectedPermissions[row.id]} onChange={() => setPermission(row.id, !selectedPermissions[row.id])} />{row.label}</label> : <Toggle key={row.id} label={row.label} checked={!!selectedPermissions[row.id]} onChange={() => setPermission(row.id, !selectedPermissions[row.id])} />)}</section>)}</div>}
      </section>}
    </Modal>
  </div>;
}
