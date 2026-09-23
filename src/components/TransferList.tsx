import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { copy } from "../constants/copy";
import { IconButton } from "./UI";

export function TransferList({ items, selectedIds, onChange, leftTitle, rightTitle }: {
  items: { id: string; label: string; detail?: string }[]; selectedIds: string[];
  onChange: (ids: string[]) => void; leftTitle: string; rightTitle: string;
}) {
  const text = copy.userManagement;
  const [checked, setChecked] = useState<string[]>([]);
  const [leftFilter, setLeftFilter] = useState("");
  const [rightFilter, setRightFilter] = useState("");
  const visible = (right: boolean) => items.filter(item => selectedIds.includes(item.id) === right && `${item.label} ${item.detail ?? ""}`.toLowerCase().includes((right ? rightFilter : leftFilter).toLowerCase()));
  const move = (toRight: boolean, all = false) => {
    const ids = visible(!toRight).filter(item => all || checked.includes(item.id)).map(item => item.id);
    onChange(toRight ? [...new Set([...selectedIds, ...ids])] : selectedIds.filter(id => !ids.includes(id)));
    setChecked(current => current.filter(id => !ids.includes(id)));
  };
  const column = (right: boolean) => {
    const rows = visible(right);
    return <section className="transfer-list__column" aria-label={right ? rightTitle : leftTitle}>
      <h3>{right ? rightTitle : leftTitle}</h3>
      <input aria-label={`${right ? rightTitle : leftTitle} ${text.filter}`} placeholder={text.filter} value={right ? rightFilter : leftFilter} onChange={e => (right ? setRightFilter : setLeftFilter)(e.target.value)} />
      <label className="admin-check"><input type="checkbox" checked={rows.length > 0 && rows.every(item => checked.includes(item.id))} onChange={e => setChecked(current => e.target.checked ? [...new Set([...current, ...rows.map(item => item.id)])] : current.filter(id => !rows.some(item => item.id === id)))} />{text.selectAll}</label>
      <div className="transfer-list__rows">
        {rows.map(item => <label key={item.id} className={`transfer-list__row ${checked.includes(item.id) ? "is-selected" : ""}`}><input type="checkbox" checked={checked.includes(item.id)} onChange={e => setChecked(current => e.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))} /><span><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}</span></label>)}
        {!rows.length && <p className="admin-empty">{text.noData}</p>}
      </div>
      <small>{text.total} {rows.length}</small>
    </section>;
  };
  return <div className="transfer-list">{column(false)}<div className="transfer-list__arrows">
    <IconButton label={text.moveAllRight} disabled={!visible(false).length} onClick={() => move(true, true)}><ChevronsRight size={18} /></IconButton>
    <IconButton label={text.moveRight} disabled={!visible(false).some(item => checked.includes(item.id))} onClick={() => move(true)}><ChevronRight size={18} /></IconButton>
    <IconButton label={text.moveLeft} disabled={!visible(true).some(item => checked.includes(item.id))} onClick={() => move(false)}><ChevronLeft size={18} /></IconButton>
    <IconButton label={text.moveAllLeft} disabled={!visible(true).length} onClick={() => move(false, true)}><ChevronsLeft size={18} /></IconButton>
  </div>{column(true)}</div>;
}
