import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { copy } from "../constants/copy";
import type { FieldRecord } from "../state/fields";
import type { LayoutRecord, LayoutSection, LayoutItem } from "../state/layouts";
import { cleanHelp, newLayoutItem, placedItems } from "../state/layouts";
import { createId } from "../state/ids";
import { Button, Field, Modal, Toggle } from "./UI";
import { LayoutPreview } from "./LayoutPreview";

const t = copy.layoutManagement, f = copy.fieldManagement, c = copy.common;
export function LayoutBuilder({ layout, fields, onClose, onSave }: { layout: LayoutRecord; fields: FieldRecord[]; onClose: () => void; onSave: (sections: LayoutSection[]) => void }) {
  const [sections, setSections] = useState<LayoutSection[]>(layout.sections.map(section => ({ ...section, items: section.items.map(item => ({ ...item })) })));
  const [selected, setSelected] = useState({ sectionId: sections[0]?.id ?? "", itemId: "" });
  const [addTarget, setAddTarget] = useState<{ sectionId: string; column: number } | null>(null);
  const [fieldFilter, setFieldFilter] = useState("");
  const [helpOpen, setHelpOpen] = useState(false), [help, setHelp] = useState(""), [closeOpen, setCloseOpen] = useState(false), [dirty, setDirty] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const currentSection = sections.find(section => section.id === selected.sectionId);
  const currentItem = currentSection?.items.find(item => item.id === selected.itemId);
  const usedIds = new Set(sections.flatMap(section => section.items.map(item => item.fieldId)));
  const available = fields.filter(field => !usedIds.has(field.id) && field.name.toLowerCase().includes(fieldFilter.toLowerCase()));
  const editSections = (next: LayoutSection[]) => { setSections(next); setDirty(true); };
  const addCategory = () => { const section: LayoutSection = { id: createId(), name: t.defaultCategory, help: "", collapsible: false, collapsed: false, items: [] }; editSections([...sections, section]); setSelected({ sectionId: section.id, itemId: "" }); setAddTarget(null); };
  const addField = (field: FieldRecord) => {
    const target = sections.find(section => section.id === addTarget?.sectionId);
    if (!target || !addTarget || usedIds.has(field.id)) return;
    const row = Math.max(-1, ...target.items.filter(item => item.column === addTarget.column).map(item => item.row)) + 1;
    const nextItem = newLayoutItem(field, row, addTarget.column);
    editSections(sections.map(section => section.id === target.id ? { ...section, items: [...section.items, nextItem] } : section));
    setSelected({ sectionId: target.id, itemId: nextItem.id });
    setAddTarget(null);
  };
  const updateSection = (key: keyof LayoutSection, value: string | boolean) => currentSection && editSections(sections.map(section => section.id === currentSection.id ? { ...section, [key]: value } : section));
  const updateItem = (key: keyof LayoutItem, value: string | boolean | number) => { if (!currentSection || !currentItem) return; const sectionId = currentSection.id, itemId = currentItem.id; editSections(sections.map(section => section.id === sectionId ? { ...section, items: section.items.map(item => item.id === itemId ? { ...item, [key]: value } : item) } : section)); };
  const removeSection = (sectionId: string) => {
    const next = sections.filter(section => section.id !== sectionId);
    editSections(next);
    if (selected.sectionId === sectionId) setSelected({ sectionId: next[0]?.id ?? "", itemId: "" });
    if (addTarget?.sectionId === sectionId) setAddTarget(null);
  };
  const removeItem = (sectionId: string, itemId: string) => {
    editSections(sections.map(section => section.id === sectionId ? { ...section, items: section.items.filter(item => item.id !== itemId) } : section));
    if (selected.sectionId === sectionId && selected.itemId === itemId) setSelected({ sectionId, itemId: "" });
  };
  const labelFor = (item: LayoutItem) => fields.find(field => field.id === item.fieldId)?.name ?? f.empty;
  const saveHelp = () => { updateSection("help", cleanHelp(help)); setHelpOpen(false); };
  const columns = useMemo(() => [0, 1], []);
  return <div className="layout-builder" role="dialog" aria-modal="true" aria-label={t.editor}>
    <header className="layout-builder__header"><strong>{t.editor}{t.separator}{layout.name}</strong><div><Button onClick={() => setPreviewOpen(true)}>{t.preview}</Button><Button variant="primary" onClick={() => { onSave(sections); setDirty(false); }}>{c.save}</Button><Button variant="primary" onClick={() => { onSave(sections); setDirty(false); onClose(); }}>{t.saveClose}</Button><Button onClick={() => dirty ? setCloseOpen(true) : onClose()}>{c.close}</Button></div></header>
    <div className="layout-builder__body"><main className="layout-stage">
      {sections.map(section => <section key={section.id} className={`layout-section ${selected.sectionId === section.id ? "is-selected" : ""}`} onClick={() => { setSelected({ sectionId: section.id, itemId: "" }); setAddTarget(null); }}>
        <header><button type="button" className="table-link" onClick={() => setSelected({ sectionId: section.id, itemId: "" })}>{section.name}</button>
          <button type="button" className="layout-remove" aria-label={`${t.removeCategory}${t.separator}${section.name}`} title={t.removeCategoryHint} onClick={event => { event.stopPropagation(); removeSection(section.id); }}><X aria-hidden="true" /></button>
        </header>
        <div className="layout-grid layout-grid--spans">{placedItems(section.items).map(({ item, style }) => <div style={style} className={`layout-item ${selected.itemId === item.id && selected.sectionId === section.id ? "is-selected" : ""}`} key={item.id}>
            <button type="button" className="layout-item__select" onClick={event => { event.stopPropagation(); setSelected({ sectionId: section.id, itemId: item.id }); setAddTarget(null); }}><span>{item.customLabel || labelFor(item)}:</span><span className="layout-line" /><small>{item.rowSpan ?? t.defaultRepeatColumns} {t.spanRows} × {Math.min(item.repeatColumns, t.repeatOptions.length)} {t.spanColumns}</small>{item.readOnly && <small>{t.readOnly}</small>}</button>
            <button type="button" className="layout-remove" aria-label={`${t.removeField}${t.separator}${item.customLabel || labelFor(item)}`} title={t.removeField} onClick={event => { event.stopPropagation(); removeItem(section.id, item.id); }}><X aria-hidden="true" /></button>
          </div>)}</div>
        <div className="layout-grid">{columns.map(column => <div className="layout-grid__cell" key={column}>
          <button type="button" className="layout-drop" aria-expanded={addTarget?.sectionId === section.id && addTarget.column === column} onClick={event => { event.stopPropagation(); setSelected({ sectionId: section.id, itemId: "" }); setFieldFilter(""); setAddTarget(addTarget?.sectionId === section.id && addTarget.column === column ? null : { sectionId: section.id, column }); }}><Plus aria-hidden="true" />{t.addField}</button>
          {addTarget?.sectionId === section.id && addTarget.column === column && <div className="layout-field-picker" onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); setAddTarget(null); } }}>
            <input autoFocus aria-label={t.searchFields} placeholder={t.searchFields} value={fieldFilter} onChange={event => setFieldFilter(event.target.value)} />
            <div className="layout-field-list">{available.map(field => <button type="button" key={field.id} onClick={() => addField(field)}>{field.name}<small>{field.type === "multiple" ? f.choices : f.fields}</small></button>)}{!available.length && <p>{t.emptyFields}</p>}</div>
            <Button variant="quiet" onClick={() => setAddTarget(null)}>{c.cancel}</Button>
          </div>}
        </div>)}</div>
        {section.help && <div className="layout-help" dangerouslySetInnerHTML={{ __html: section.help }} />}
      </section>)}
      {!sections.length && <p className="admin-empty">{t.noSections}</p>}
      <Button className="layout-add-category" onClick={addCategory} icon={<Plus size={16} />}>{t.addCategory}</Button>
    </main><aside className="layout-options"><h2>{t.options}</h2>{currentSection && <Button variant="quiet" onClick={() => setSelected({ sectionId: currentSection.id, itemId: "" })}>{t.sectionProperties}</Button>}{currentItem ? <><h3>{t.properties}</h3><p>{t.field}{t.separator}{labelFor(currentItem)}</p><Field label={t.display}><select aria-label={t.display} value={currentItem.display} onChange={e => updateItem("display", e.target.value)}>{Object.entries(t.displayOptions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><Field label={t.showName}><Toggle label={t.showName} checked={currentItem.showName} onChange={() => updateItem("showName", !currentItem.showName)} /></Field><Field label={t.customLabel}><input aria-label={t.customLabel} value={currentItem.customLabel} onChange={e => updateItem("customLabel", e.target.value)} /></Field><Field label={t.readOnly}><Toggle label={t.readOnly} checked={currentItem.readOnly} onChange={() => updateItem("readOnly", !currentItem.readOnly)} /></Field><Field label={t.allowCopy}><Toggle label={t.allowCopy} checked={currentItem.allowCopy} onChange={() => updateItem("allowCopy", !currentItem.allowCopy)} /></Field><p className="admin-note">{t.sizeHint}</p><Field label={t.occupiedRows}><select aria-label={t.occupiedRows} value={currentItem.rowSpan ?? t.defaultRepeatColumns} onChange={e => updateItem("rowSpan", Number(e.target.value))}>{t.rowSpanOptions.map(option => <option key={option} value={option}>{option}</option>)}</select></Field><Field label={t.repeatColumns}><select aria-label={t.repeatColumns} value={Math.min(currentItem.repeatColumns, t.repeatOptions.length)} onChange={e => updateItem("repeatColumns", Number(e.target.value))}>{t.repeatOptions.map(option => <option key={option} value={option}>{option}</option>)}</select></Field></> : currentSection ? <><h3>{t.properties}</h3><Field label={t.categoryName}><input aria-label={t.categoryName} value={currentSection.name} onChange={e => updateSection("name", e.target.value)} /></Field><Field label={t.help}><Button onClick={() => { setHelp(currentSection.help); setHelpOpen(true); }}>{t.editHelp}</Button></Field><Toggle label={t.collapsible} checked={currentSection.collapsible} onChange={() => updateSection("collapsible", !currentSection.collapsible)} />{currentSection.collapsible && <Toggle label={t.collapsed} checked={currentSection.collapsed} onChange={() => updateSection("collapsed", !currentSection.collapsed)} />}</> : null}</aside></div>
    {previewOpen && <LayoutPreview layout={{ ...layout, sections }} fields={fields} onClose={() => setPreviewOpen(false)} />}
    <Modal open={helpOpen} title={t.helpEditor} wide onClose={() => setHelpOpen(false)} footer={<><Button variant="primary" onClick={saveHelp}>{c.confirm}</Button><Button onClick={() => setHelpOpen(false)}>{c.cancel}</Button></>}><div className="help-editor-toolbar"><Button onClick={() => setHelp(t.exampleHelp)}>{t.helpExample}</Button></div><textarea className="help-editor" aria-label={t.help} value={help.replaceAll(/<[^>]+>/g, "")} onChange={e => setHelp(e.target.value)} /></Modal>
    <Modal open={closeOpen} title={t.closeTitle} onClose={() => setCloseOpen(false)} footer={<><Button variant="primary" onClick={() => { onSave(sections); setCloseOpen(false); onClose(); }}>{c.save}</Button><Button variant="danger" onClick={onClose}>{t.discard}</Button><Button onClick={() => setCloseOpen(false)}>{t.keepEditing}</Button></>}><p>{t.discardHint}</p></Modal>
  </div>;
}
