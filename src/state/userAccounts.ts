import type { UserRecord } from "./Administration";

export function accountStage(user: UserRecord) { return user.accountStage ?? "active"; }
export function accountStatus(user: UserRecord) { return user.access ? accountStage(user) : "disabled"; }
export function inviteUser(user: UserRecord): UserRecord {
  const sentAt = new Date();
  return { ...user, accountStage: "pending", invitedAt: sentAt.toISOString(),
    inviteExpiresAt: new Date(sentAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), modifiedOn: sentAt.toISOString() };
}
