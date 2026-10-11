import { useState } from "react";
import { copy } from "../constants/copy";
import { useAdministration, type UserRecord } from "../state/Administration";
import { accountStage, accountStatus, inviteUser } from "../state/userAccounts";
import { Badge, Button, Modal, Panel } from "./UI";

const t = copy.userManagement.account;
type Action = "send" | "resend" | "disable" | "enable" | "reset";
const date = (value?: string) => value ? new Date(value).toLocaleString(copy.userManagement.dateLocale, { hour12: false }) : t.dash;

export function AccountStatus({ user }: { user: UserRecord }) {
  const state = accountStatus(user);
  return <Badge tone={state === "disabled" ? "danger" : state === "active" ? "success" : "warning"}>{t.states[state]}</Badge>;
}
export function InvitationResult({ user }: { user: UserRecord }) {
  return <div className="user-invitation-result"><span>{user.invitedAt ? t.sent : t.notSent}</span>{user.inviteExpiresAt && new Date(user.inviteExpiresAt).getTime() < Date.now() && <Badge tone="warning">{t.expired}</Badge>}</div>;
}

export function UserAccount({ user, compact = false, notify }: { user: UserRecord; compact?: boolean; notify: (message: string) => void }) {
  const { setUsers } = useAdministration();
  const [action, setAction] = useState<Action | null>(null);
  const stage = accountStage(user);
  const invitationAction = user.invitedAt ? "resend" : "send";
  const hints = { send: t.inviteHint, resend: t.resendHint, disable: t.disableHint, enable: t.enableHint, reset: t.resetHint };
  const confirm = () => {
    if (!action) return;
    const stamp = new Date();
    setUsers(current => current.map(item => {
      if (item.id !== user.id) return item;
      if (action === "send" || action === "resend") return item.access && accountStage(item) !== "active" ? inviteUser(item) : item;
      if (action === "reset") return item.access && accountStage(item) === "active"
        ? { ...item, resetSentAt: stamp.toISOString(), resetExpiresAt: new Date(stamp.getTime() + 30 * 60 * 1000).toISOString(), modifiedOn: stamp.toISOString() } : item;
      return { ...item, access: action === "enable", modifiedOn: stamp.toISOString() };
    }));
    notify(action === "send" || action === "resend" ? t.inviteDone : action === "reset" ? t.resetDone : action === "disable" ? t.disableDone : t.enableDone);
    setAction(null);
  };
  const actions = <div className="user-account-actions">
    {stage !== "active" && <Button disabled={!user.access} onClick={() => setAction(invitationAction)}>{t[invitationAction]}</Button>}
    {!compact && stage === "active" && <Button disabled={!user.access} onClick={() => setAction("reset")}>{t.reset}</Button>}
    <Button variant={user.access ? "danger" : "secondary"} onClick={() => setAction(user.access ? "disable" : "enable")}>{user.access ? t.disable : t.enable}</Button>
  </div>;
  const fields: Array<[string, string]> = [[t.inviteTime, date(user.invitedAt)], [t.expires, date(user.inviteExpiresAt)], [t.lastLogin, date(user.lastLoginAt)], [t.resetTime, date(user.resetSentAt)], [t.resetExpires, date(user.resetExpiresAt)]];
  return <>
    {compact ? actions : <Panel title={t.title} actions={<AccountStatus user={user} />}>
      <dl className="detail-grid user-account-details">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}<div><dt>{t.result}</dt><dd><InvitationResult user={user} /></dd></div></dl>
      {actions}<p className="admin-note">{t.demo}</p>
    </Panel>}
    <Modal open={action !== null} title={action ? t[action] : t.title} onClose={() => setAction(null)} footer={<><Button onClick={() => setAction(null)}>{copy.common.cancel}</Button><Button variant={action === "disable" ? "danger" : "primary"} onClick={confirm}>{copy.common.confirm}</Button></>}>
      <div className="user-account-confirm"><strong>{user.email}</strong><p>{action ? hints[action] : t.demo}</p></div>
    </Modal>
  </>;
}
