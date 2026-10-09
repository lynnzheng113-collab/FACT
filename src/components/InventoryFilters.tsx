import { useState } from "react";
import { copy } from "../constants/copy";
import { Button, Field, Modal } from "./UI";
import { TransferList } from "./TransferList";

const t = copy.processing.sets.inventoryFilters;
export type InventoryFilter = { from: string; to: string; excludedTypes: string[] };
export const emptyInventoryFilter = (): InventoryFilter => ({ from: "", to: "", excludedTypes: [] });
export const filterInventory = (config: InventoryFilter) => t.samples.filter(file =>
  !config.excludedTypes.includes(file.type) &&
  (!(config.from || config.to) || (file.date !== "" && (!config.from || file.date >= config.from) && (!config.to || file.date <= config.to)))
);

export function InventoryFilters({ value, onApply, onClose }: {
  value: InventoryFilter; onApply: (value: InventoryFilter) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState<InventoryFilter>(() => ({ ...value, excludedTypes: [...value.excludedTypes] }));
  const invalid = Boolean(draft.from && draft.to && draft.from > draft.to);
  const rows = filterInventory(draft);
  return <Modal open wide title={t.title} onClose={onClose} footer={<>
    <Button onClick={() => setDraft(emptyInventoryFilter())}>{t.clear}</Button>
    <Button onClick={onClose}>{copy.common.cancel}</Button>
    <Button variant="primary" disabled={invalid} onClick={() => onApply(draft)}>{t.apply}</Button>
  </>}>
    <div className="processing-inventory-filter-form">
      <p className="admin-note">{t.hint}</p>
      <Field label={t.dateRange}><div className="processing-date-range">
        <label>{t.dateFrom}<input aria-label={t.dateFrom} type="date" value={draft.from} onChange={e => setDraft({ ...draft, from: e.target.value })} /></label>
        <label>{t.dateTo}<input aria-label={t.dateTo} type="date" value={draft.to} onChange={e => setDraft({ ...draft, to: e.target.value })} /></label>
      </div></Field>
      <p className="admin-note">{t.dateHint}</p>
      {invalid && <p role="alert" className="processing-form-error">{t.invalidDates}</p>}
      <section><h3>{t.fileType}</h3><p className="admin-note">{t.typeHint}</p>
        <TransferList items={[...new Set(t.samples.map(file => file.type))].map(type => ({ id: type, label: type }))}
          selectedIds={draft.excludedTypes} onChange={excludedTypes => setDraft({ ...draft, excludedTypes })} leftTitle={t.included} rightTitle={t.excluded} />
      </section>
      <section aria-live="polite"><h3>{t.preview}</h3><p>{t.remaining}: {invalid ? copy.processing.sets.zero : rows.length} / {t.samples.length}</p>
        <div className="table-scroll"><table><thead><tr>{t.columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>
          {!invalid && rows.map(file => <tr key={file.name}><td>{file.name}</td><td>{file.type}</td><td>{file.date || t.noDate}</td></tr>)}
          {(invalid || !rows.length) && <tr><td colSpan={t.columns.length}>{invalid ? t.invalidDates : t.empty}</td></tr>}
        </tbody></table></div>
      </section>
      <a href={t.sourceUrl} target="_blank" rel="noreferrer">{t.source}</a>
    </div>
  </Modal>;
}
