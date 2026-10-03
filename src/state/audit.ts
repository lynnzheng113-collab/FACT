import { copy } from '../constants/copy';

export type AuditChange = { field: string; type: string; oldValue: string | null; newValue: string | null; required?: boolean };
export type AuditRecord = {
  id: string; timestamp: string; workspaceId: string; workspaceName: string;
  user: string; userId: string; action: string; objectType: string; objectId: string; objectName: string;
  executionTime: number; changes: AuditChange[]; details: string; query?: string;
  source: 'sample' | 'session'; reverts?: string;
};
export type AuditFilters = { workspace: string; user: string; action: string; objectType: string; auditId: string; objectId: string; minTime: string; start: string; end: string; details: string; operator: 'like' | 'notLike' };
export const emptyFilters: AuditFilters = { workspace: '', user: '', action: '', objectType: '', auditId: '', objectId: '', minTime: '', start: '', end: '', details: '', operator: 'like' };
export const dateInput = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export function initialFilters(): AuditFilters {
  const today = new Date(); const start = new Date(today); start.setDate(start.getDate() - 6);
  return { ...emptyFilters, start: dateInput(start), end: dateInput(today) };
}
export const detailsJSON = (r: AuditRecord) => ({ ID: r.id, Timestamp: r.timestamp, ArtifactName: r.objectName, ActionName: r.action, ObjectTypeName: r.objectType, ArtifactID: r.objectId, UserName: r.user, UserID: r.userId, WorkspaceId: r.workspaceId, WorkspaceName: r.workspaceName, ExecutionTime: r.executionTime, Details: r.details, FieldChanges: r.changes, ...(r.query ? { QueryText: r.query } : {}), ...(r.reverts ? { RevertsAuditID: r.reverts } : {}) });
export function createAuditSamples(): AuditRecord[] {
  const t = copy.audit; const now = new Date();
  return t.samples.map((s, index): AuditRecord => {
    const date = new Date(now); date.setDate(date.getDate() - s.days); date.setHours(s.hour, s.minute, 0, 0);
    if (date > now) date.setDate(date.getDate() - 1);
    const workspace = copy.workspaceManagement.workspaces[Math.max(0, s.workspace)];
    return { id: `${t.sampleIdPrefix}${index + 1}`, timestamp: date.toISOString(), workspaceId: s.workspace < 0 ? 'admin' : workspace.id,
      workspaceName: s.workspace < 0 ? t.adminCase : workspace.name, user: s.actor === 'admin' ? copy.access.accounts.admin.name : copy.access.accounts.reviewer.name,
      userId: copy.access.accounts[s.actor].id, action: s.action, objectType: s.objectType, objectId: s.objectId, objectName: s.objectName,
      executionTime: s.executionTime, changes: s.changes.map(c => ({ ...c })), details: s.details, query: s.query || undefined, source: 'sample' };
  }).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
export function filterAudits(entries: AuditRecord[], f: AuditFilters, scope: string): AuditRecord[] {
  const needle = f.details.trim().toLocaleLowerCase();
  return entries.filter(r => {
    const day = dateInput(new Date(r.timestamp));
    const detailMatch = JSON.stringify(detailsJSON(r)).toLocaleLowerCase().includes(needle);
    return (!scope || r.workspaceId === scope) && (!f.workspace || r.workspaceId === f.workspace) && (!f.user || r.userId === f.user)
      && (!f.action || r.action === f.action) && (!f.objectType || r.objectType === f.objectType)
      && (!f.auditId || r.id.toLowerCase().includes(f.auditId.toLowerCase())) && (!f.objectId || r.objectId.includes(f.objectId))
      && (!f.minTime || r.executionTime >= Number(f.minTime)) && (!f.start || day >= f.start) && (!f.end || day <= f.end)
      && (!needle || (f.operator === 'like' ? detailMatch : !detailMatch));
  });
}
const updateActions = ['Update', 'Update - Mass Edit', 'Update - Propagation'];
const revertTypes = ['Currency', 'Date', 'Decimal', 'Fixed Length Text', 'Single Choice', 'Single Object', 'User', 'Whole Number', 'Yes/No'];
export function revertReason(r: AuditRecord, all: AuditRecord[]): string | null {
  const t = copy.audit.revertReasons;
  if (r.source !== 'sample') return t.session;
  if (r.objectType !== 'Document' || !updateActions.includes(r.action) || !r.changes.length) return t.action;
  const newer = all.some(other => other.id !== r.id && other.workspaceId === r.workspaceId && other.objectId === r.objectId && other.objectType === 'Document' && updateActions.includes(other.action) && other.timestamp >= r.timestamp);
  if (newer) return t.latest;
  if (r.changes.some(c => !revertTypes.includes(c.type))) return t.type;
  if (r.changes.some(c => c.required && c.oldValue === null)) return t.required;
  return null;
}
export function revertAudits(targets: AuditRecord[], all: AuditRecord[], actor: string, actorId: string): AuditRecord[] {
  return targets.filter(r => !revertReason(r, all)).map((r, i) => ({ ...r, id: crypto.randomUUID(), timestamp: new Date(Date.now() + i).toISOString(), user: actor, userId: actorId,
    changes: r.changes.map(c => ({ ...c, oldValue: c.newValue, newValue: c.oldValue })), reverts: r.id, details: copy.audit.revertedDetail + r.id, query: undefined }));
}
