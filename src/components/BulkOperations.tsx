import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { copy } from "../constants/copy";
import { Button, Modal } from "./UI";

const operations = copy.permissionManagement.settingSections.find(section => section.id === "mass")!.items;

export function BulkOperations({ documents }: { documents: readonly { id: string; file: string }[] }) {
  const [open, setOpen] = useState(false);
  const [operation, setOperation] = useState<string | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const requestedFocus = useRef<number | null>(null);
  const selectedCount = documents.length;

  useEffect(() => {
    if (!open) return;
    if (requestedFocus.current !== null) {
      focusOption(requestedFocus.current);
      requestedFocus.current = null;
    }
    const dismiss = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  const focusOption = (index: number) => {
    const buttons = menu.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
    if (buttons?.length) buttons[(index + buttons.length) % buttons.length].focus();
  };

  return <div className="bulk-operations" ref={container} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }} onKeyDown={event => {
    if (event.key === "Escape" && open) { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
  }}>
    <button type="button" ref={trigger} className="button button--secondary" aria-haspopup="menu" aria-expanded={open} aria-controls="document-bulk-menu" onClick={() => setOpen(current => !current)} onKeyDown={event => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const index = event.key === "ArrowUp" ? -1 : 0;
        if (open) focusOption(index);
        else { requestedFocus.current = index; setOpen(true); }
      }
    }}><span>{copy.documents.bulkEdit}</span><ChevronDown size={16} aria-hidden="true" /></button>
    {open && <div className="bulk-operations__panel">
      <p className="bulk-operations__hint">{selectedCount ? copy.documents.bulkSelection.replaceAll("{count}", String(selectedCount)) : copy.documents.bulkSelectHint}</p>
      <div id="document-bulk-menu" ref={menu} role="menu" aria-label={copy.documents.bulkEdit} onKeyDown={event => {
        const buttons = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const target = event.key === "ArrowDown" ? index + 1 : event.key === "ArrowUp" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? -1 : null;
        if (target !== null) { event.preventDefault(); focusOption(target); }
      }}>
        {operations.map(item => <button type="button" role="menuitem" key={item.id} disabled={!selectedCount} onClick={() => { setOpen(false); setOperation(item.label); }}>{item.label}</button>)}
      </div>
    </div>}
    <Modal open={operation !== null} title={operation ?? copy.documents.bulkEdit} onClose={() => { setOperation(null); trigger.current?.focus(); }} footer={<Button onClick={() => { setOperation(null); trigger.current?.focus(); }}>{copy.common.close}</Button>}>
      <p className="admin-note">{copy.documents.bulkPreview}</p>
      <h3>{copy.documents.bulkScope}</h3>
      <p>{copy.documents.bulkSelection.replaceAll("{count}", String(selectedCount))}</p>
      <ul>{documents.map(doc => <li key={doc.id}>{doc.id} · {doc.file}</li>)}</ul>
    </Modal>
  </div>;
}
