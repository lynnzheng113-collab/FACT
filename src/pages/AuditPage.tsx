import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { BarChart3, ChevronRight, Download, Filter, RotateCcw } from 'lucide-react';
import { copy } from '../constants/copy';
import { Badge, Button, Modal, PageHeader, Panel, Tabs } from '../components/UI';
import { useAdministration } from '../state/Administration';
import { detailsJSON, emptyFilters, filterAudits, initialFilters, revertAudits, revertReason, type AuditFilters, type AuditRecord } from '../state/audit';
import { downloadAudits } from '../state/auditExport';
import '../styles/audit.css';

const t = copy.audit;
const formatTime = (value: string) => new Date(value).toLocaleString(copy.userManagement.dateLocale, { hour12: false });
const value = (v: string | null) => v === null ? t.nil : v;
const countBy = (rows: AuditRecord[], key: 'action' | 'user') => Object.entries(rows.reduce<Record<string, number>>((counts, row) => ({ ...counts, [row[key]]: (counts[row[key]] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);

export function AuditPage({ entries, setEntries }: { entries: AuditRecord[]; setEntries: Dispatch<SetStateAction<AuditRecord[]>> }) {
  const { workspaces } = useAdministration();
  const [mode, setMode] = useState('instance'), [workspaceId, setWorkspaceId] = useState(workspaces[0]?.id ?? '');
  const [draft, setDraft] = useState<AuditFilters>(initialFilters), [filters, setFilters] = useState<AuditFilters>(initialFilters);
  const [filterOpen, setFilterOpen] = useState(false), [dashboard, setDashboard] = useState(true);
  const [groupBy, setGroupBy] = useState<'action' | 'user'>('action'), [pivotOn, setPivotOn] = useState<'action' | 'objectType'>('action');
  const [sort, setSort] = useState('desc'), [size, setSize] = useState<number>(t.pageSizes[0]), [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]), [detail, setDetail] = useState<AuditRecord | null>(null), [detailTab, setDetailTab] = useState<string>(t.table);
  const [dialog, setDialog] = useState<'export' | 'revert' | null>(null), [range, setRange] = useState('filtered'), [format, setFormat] = useState<string>(t.formats[0]);
  const [error, setError] = useState(''), [feedback, setFeedback] = useState('');
  const scope = mode === 'workspace' ? workspaceId || '__empty__' : '';
  const filtered = filterAudits(entries, filters, scope);
  const sorted = [...filtered].sort((a, b) => sort === 'desc' ? b.timestamp.localeCompare(a.timestamp) : a.timestamp.localeCompare(b.timestamp));
  const pageCount = Math.max(1, Math.ceil(sorted.length / size)), currentPage = Math.min(page, pageCount), rows = sorted.slice((currentPage - 1) * size, currentPage * size);
  const targets = range === 'selected' ? filtered.filter(r => selected.includes(r.id)) : filtered;
  const eligible = targets.filter(r => !revertReason(r, entries));
  const groups = countBy(filtered, groupBy), maxCount = Math.max(1, ...groups.map(g => g[1]));
  const pivotValues = [...new Set(filtered.map(r => r[pivotOn]))].sort(), users = [...new Set(filtered.map(r => r.user))];
  const workspacesForFilters = [...new Map(entries.map(r => [r.workspaceId, r.workspaceName])).entries()];
  const actions = [...new Set(entries.map(r => r.action))].sort(), objectTypes = [...new Set(entries.map(r => r.objectType))].sort();
  const userOptions = [...new Map(entries.map(r => [r.userId, r.user])).entries()];
  const change = <K extends keyof AuditFilters>(key: K, v: AuditFilters[K]) => setDraft(current => ({ ...current, [key]: v }));
  function commit(next: AuditFilters) { setFilters(next); setDraft(next); setSelected([]); setPage(1); setError(''); setFeedback(''); }
  function resetScope(nextMode: string, id = workspaceId) { setMode(nextMode); setWorkspaceId(id); commit({ ...filters, workspace: '' }); }
  function openDialog(next: 'export' | 'revert') { setDialog(next); setRange(selected.length ? 'selected' : 'filtered'); setFeedback(''); }
  useEffect(() => {
    if (!dialog && !detail) return;
    const focus = document.activeElement as HTMLElement | null;
    const modal = document.querySelector<HTMLElement>('.audit-page [role="dialog"]');
    modal?.querySelector<HTMLElement>('button')?.focus();
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setDialog(null); setDetail(null); }
      if (event.key === 'Tab' && modal) {
        const controls = Array.from(modal.querySelectorAll<HTMLElement>('button:not(:disabled),select,input:not(:disabled),[tabindex="0"]'));
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', listener);
    return () => { document.removeEventListener('keydown', listener); focus?.focus(); };
  }, [dialog, detail]);
  const fieldFilter = (label: string, key: keyof AuditFilters, options: string[] | [string, string][]) => <label>{label}<select aria-label={label} value={draft[key]} onChange={e => change(key, e.target.value)}><option value="">{t.all}</option>{options.map(o => <option key={typeof o === 'string' ? o : o[0]} value={typeof o === 'string' ? o : o[0]}>{typeof o === 'string' ? o : o[1]}</option>)}</select></label>;
  const rangeSelect = <label>{dialog === 'revert' ? t.scan : t.exportRange}<select aria-label={dialog === 'revert' ? t.scan : t.exportRange} value={range} onChange={e => setRange(e.target.value)}><option value="filtered">{t.filtered}</option><option value="selected" disabled={!selected.length}>{t.selectedRows}</option></select></label>;
  const currentFieldValue = (r: AuditRecord, field: string) => [...entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).find(other => other.workspaceId === r.workspaceId && other.objectId === r.objectId && other.objectType === r.objectType && other.changes.some(c => c.field === field))?.changes.find(c => c.field === field)?.newValue ?? null;
  return <div className="page audit-page">
    <PageHeader title={t.title} subtitle={t.hint} ids={t.ids} priorities={[]} actions={<Button icon={<BarChart3 size={16} />} onClick={() => setDashboard(!dashboard)}>{dashboard ? t.hideDashboard : t.showDashboard}</Button>} />
    <div className="audit-scope"><label>{t.scope}<select aria-label={t.scope} value={mode} onChange={e => resetScope(e.target.value)}><option value="instance">{t.instance}</option><option value="workspace">{t.workspaceMode}</option></select></label>
      {mode === 'workspace' && <label>{t.workspace}<select aria-label={t.workspace} value={workspaceId} onChange={e => resetScope(mode, e.target.value)}>{!workspaces.length && <option value="">{t.emptyWorkspaces}</option>}{workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>}
      <Badge tone="info">{t.demo}</Badge>
    </div>
    <p className="audit-scope-hint">{mode === 'instance' ? t.instanceHint : t.workspaceHint}</p>
    <Panel className="audit-controls">
      <form onSubmit={e => { e.preventDefault(); if (draft.start && draft.end && draft.start > draft.end) return setError(t.dateError); commit(draft); }}>
        <div className="audit-filter-primary"><Button onClick={() => commit(initialFilters())}>{t.last7}</Button><Button onClick={() => commit({ ...filters, start: '', end: '' })}>{t.allDates}</Button>
          <label>{t.start}<input type="date" value={draft.start} onChange={e => change('start', e.target.value)} /></label><label>{t.end}<input type="date" value={draft.end} onChange={e => change('end', e.target.value)} /></label>
          <Button icon={<Filter size={16} />} onClick={() => setFilterOpen(!filterOpen)}>{t.filters}</Button><Button type="submit" variant="primary">{t.apply}</Button><Button onClick={() => commit({ ...emptyFilters })}>{t.reset}</Button>
        </div>
        {filterOpen && <div className="audit-filter-grid">
          {mode === 'instance' && fieldFilter(t.workspace, 'workspace', workspacesForFilters)}{fieldFilter(t.user, 'user', userOptions)}{fieldFilter(t.action, 'action', actions)}{fieldFilter(t.objectType, 'objectType', objectTypes)}
          <label>{t.auditId}<input value={draft.auditId} onChange={e => change('auditId', e.target.value)} /></label><label>{t.objectId}<input value={draft.objectId} onChange={e => change('objectId', e.target.value)} /></label>
          <label>{t.minTime}<input type="number" min={0} value={draft.minTime} onChange={e => change('minTime', e.target.value)} /></label>
          <div className="audit-details-filter"><label>{t.operator}<select aria-label={t.operator} value={draft.operator} onChange={e => change('operator', e.target.value as 'like' | 'notLike')}><option value="like">{t.contains}</option><option value="notLike">{t.notContains}</option></select></label><label>{t.detailsTerm}<input value={draft.details} onChange={e => change('details', e.target.value)} /></label></div>
          <p className="audit-filter-note">{t.filterHint}</p>
        </div>}
        {error && <p className="audit-error" role="alert">{error}</p>}
      </form>
    </Panel>
    {dashboard && <>
      <div className="audit-metrics"><div><strong>{filtered.length}</strong><span>{t.count}</span></div><div><strong>{users.length}</strong><span>{t.usersCount}</span></div><div><strong>{new Set(filtered.map(r => r.action)).size}</strong><span>{t.actionsCount}</span></div><div><strong className="audit-latest">{filtered.length ? formatTime([...filtered].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0].timestamp) : t.dash}</strong><span>{t.latest}</span></div></div>
      <div className="audit-dashboard"><Panel title={groupBy === 'action' ? t.byAction : t.byUser} actions={<label>{t.groupBy}<select aria-label={t.groupBy} value={groupBy} onChange={e => setGroupBy(e.target.value as 'action' | 'user')}><option value="action">{t.action}</option><option value="user">{t.user}</option></select></label>}>
        <div className="audit-bars">{groups.map(([name, count]) => <button type="button" key={name} className="audit-bar" aria-pressed={groupBy === 'action' ? filters.action === name : userOptions.find(u => u[0] === filters.user)?.[1] === name} onClick={() => { const key = groupBy === 'action' ? 'action' : 'user'; const v = groupBy === 'action' ? name : userOptions.find(u => u[1] === name)?.[0] ?? ''; commit({ ...filters, [key]: filters[key] === v ? '' : v }); }}><span>{name}</span><span className="audit-bar-track"><i style={{ width: `${count / maxCount * 100}%` }} /></span><strong>{count}</strong></button>)}{!groups.length && <p>{t.empty}</p>}</div><p className="audit-muted">{t.chartHint}</p>
      </Panel><Panel title={t.pivotTitle} actions={<label>{t.pivotOn}<select aria-label={t.pivotOn} value={pivotOn} onChange={e => setPivotOn(e.target.value as 'action' | 'objectType')}><option value="action">{t.action}</option><option value="objectType">{t.objectType}</option></select></label>}><div className="audit-pivot"><table><thead><tr><th>{t.user}</th>{pivotValues.map(v => <th key={v}>{v}</th>)}<th>{copy.common.total}</th></tr></thead><tbody>{users.map(u => <tr key={u}><th>{u}</th>{pivotValues.map(v => <td key={v}>{filtered.filter(r => r.user === u && r[pivotOn] === v).length}</td>)}<td><strong>{filtered.filter(r => r.user === u).length}</strong></td></tr>)}</tbody></table>{!users.length && <p>{t.empty}</p>}</div></Panel></div>
    </>}
    <Panel title={t.list} className="table-panel audit-list" actions={<label>{t.sort}<select aria-label={t.sort} value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}><option value="desc">{t.newest}</option><option value="asc">{t.oldest}</option></select></label>}>
      <div className="table-scroll"><table><thead><tr><th><input type="checkbox" aria-label={t.selectAll} checked={rows.length > 0 && rows.every(r => selected.includes(r.id))} onChange={e => setSelected(e.target.checked ? [...new Set([...selected, ...rows.map(r => r.id)])] : selected.filter(id => !rows.some(r => r.id === id)))} /></th>{[t.details, t.auditId, t.timestamp, t.workspace, t.objectName, t.action, t.objectType, t.executionTime, t.objectId, t.user, t.field, t.oldValue, t.newValue, t.source].map(h => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.map(r => <tr key={r.id} className={selected.includes(r.id) ? 'audit-selected' : ''}><td><input type="checkbox" aria-label={`${t.selectRow} ${r.id}`} checked={selected.includes(r.id)} onChange={e => setSelected(e.target.checked ? [...selected, r.id] : selected.filter(id => id !== r.id))} /></td><td><button type="button" className="audit-detail-button" aria-label={`${t.details} ${r.id}`} onClick={() => { setDetail(r); setDetailTab(t.table); }}><ChevronRight size={16} /></button></td><td>{r.id}</td><td>{formatTime(r.timestamp)}</td><td>{r.workspaceName}</td><td>{r.objectName}</td><td>{r.action}</td><td>{r.objectType}</td><td>{r.executionTime}</td><td>{r.objectId}</td><td>{r.user}</td><td>{r.changes.map(c => c.field).join('\n') || t.dash}</td><td>{r.changes.map(c => value(c.oldValue)).join('\n') || t.dash}</td><td>{r.changes.map(c => value(c.newValue)).join('\n') || t.dash}</td><td><Badge tone={r.source === 'session' ? 'success' : 'neutral'}>{r.source === 'session' ? t.session : t.sample}</Badge></td></tr>)}{!rows.length && <tr><td colSpan={15} className="audit-empty"><strong>{t.empty}</strong><p>{t.emptyHint}</p></td></tr>}</tbody></table></div>
      <div className="audit-pagination"><span>{selected.length} {t.selected} <Button variant="quiet" disabled={!selected.length} onClick={() => setSelected([])}>{t.clearSelection}</Button></span><span>{filtered.length} {t.count}</span><label>{t.pageSize}<select aria-label={t.pageSize} value={size} onChange={e => { setSize(Number(e.target.value)); setPage(1); }}>{t.pageSizes.map(n => <option key={n}>{n}</option>)}</select></label><Button disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>{copy.common.previousPage}</Button><span>{currentPage} {t.of} {pageCount} {t.pageLabel}</span><Button disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>{copy.common.nextPage}</Button></div>
      <div className="audit-mass"><Button icon={<Download size={16} />} disabled={mode !== 'workspace' || !filtered.length} onClick={() => openDialog('export')}>{t.exportTitle}</Button><Button icon={<RotateCcw size={16} />} disabled={mode !== 'workspace' || !filtered.length} onClick={() => openDialog('revert')}>{t.revert}</Button><small>{t.dateHint}</small></div>
    </Panel>
    {feedback && <p className="audit-feedback" role="status">{feedback}</p>}
    <Modal open={!!detail} title={t.detailTitle} onClose={() => setDetail(null)} wide footer={<Button onClick={() => setDetail(null)}>{copy.common.close}</Button>}>
      {detail && <><Tabs items={[t.table, t.json]} active={detailTab} onChange={setDetailTab} />{detailTab === t.json ? <pre className="audit-json">{JSON.stringify(detailsJSON(detail), null, 2)}</pre> : <>
        <div className="table-scroll"><table className="audit-detail-table"><thead><tr><th>{t.name}</th><th>{t.value}</th></tr></thead><tbody>{[[t.auditId, detail.id], [t.timestamp, formatTime(detail.timestamp)], [t.objectName, detail.objectName], [t.action, detail.action], [t.objectType, detail.objectType], [t.objectId, detail.objectId], [t.user, detail.user], [t.userId, detail.userId], [t.workspaceId, detail.workspaceId], [t.workspace, detail.workspaceName], [t.executionTime, detail.executionTime], [t.details, detail.details], ...(detail.reverts ? [[t.reverts, detail.reverts]] : [])].map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody></table></div>
        <h3 className="audit-section-heading">{t.changes}</h3>{detail.changes.length ? <div className="table-scroll"><table><thead><tr><th>{t.field}</th><th>{t.oldValue}</th><th>{t.newValue}</th></tr></thead><tbody>{detail.changes.map(c => <tr key={c.field}><th>{c.field}</th><td>{value(c.oldValue)}</td><td>{value(c.newValue)}</td></tr>)}</tbody></table></div> : <p>{t.noChanges}</p>}
        {detail.objectType === 'Document' && detail.source === 'sample' && detail.changes.length > 0 && <><h3 className="audit-section-heading">{t.sampleCoding}</h3><p className="audit-muted">{t.sampleCodingHint}</p><dl className="audit-current">{detail.changes.map(c => <div key={c.field}><dt>{c.field}</dt><dd>{value(currentFieldValue(detail, c.field))}</dd></div>)}</dl></>}
        {detail.query && <><h3 className="audit-section-heading">{t.query}</h3><pre className="audit-json">{detail.query}</pre></>}
      </>}</>}
    </Modal>
    <Modal open={dialog === 'export'} title={t.exportTitle} onClose={() => setDialog(null)} footer={<><Button onClick={() => setDialog(null)}>{copy.common.cancel}</Button><Button variant="primary" disabled={!targets.length || mode !== 'workspace'} onClick={() => { try { downloadAudits(targets, format); setDialog(null); setFeedback(t.exportDone); } catch { setDialog(null); setFeedback(t.exportFailure); } }}>{t.exportRun}</Button></>}>
      <div className="audit-dialog-form">{rangeSelect}<label>{t.format}<select aria-label={t.format} value={format} onChange={e => setFormat(e.target.value)}>{t.formats.map(f => <option key={f}>{f}</option>)}</select></label><p><strong>{targets.length}</strong> {t.count}</p><p>{t.exportHint}</p></div>
    </Modal>
    <Modal open={dialog === 'revert'} title={t.revertTitle} onClose={() => setDialog(null)} wide footer={<><Button onClick={() => setDialog(null)}>{copy.common.cancel}</Button><Button variant="primary" disabled={!eligible.length || targets.length > t.revertMax || mode !== 'workspace'} onClick={() => { setEntries(current => [...revertAudits(targets, current, copy.access.accounts.admin.name, copy.access.accounts.admin.id), ...current]); setDialog(null); setSelected([]); setFeedback(t.revertDone); }}>{t.runRevert}</Button></>}>
      <div className="audit-dialog-form">{rangeSelect}<p>{t.revertHint}</p><p><strong>{eligible.length}</strong> {t.eligible} · <strong>{targets.length - eligible.length}</strong> {t.ineligible}</p><small>{t.revertLimit}</small><div className="table-scroll audit-revert-table"><table><thead><tr><th>{t.auditId}</th><th>{t.objectName}</th><th>{t.reason}</th><th>{t.revertPreview}</th></tr></thead><tbody>{targets.map(r => <tr key={r.id}><td>{r.id}</td><td>{r.objectName}</td><td>{revertReason(r, entries) || t.eligible}</td><td>{!revertReason(r, entries) ? r.changes.map(c => `${c.field}: ${value(c.oldValue)}`).join('\n') : t.dash}</td></tr>)}</tbody></table></div></div>
    </Modal>
  </div>;
}
