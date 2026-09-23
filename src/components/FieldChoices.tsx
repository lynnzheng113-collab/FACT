import { useState } from "react";
import { copy } from "../constants/copy";
import { Button, Field, Modal, Panel } from "./UI";
import { choiceBranchIds, type ChoiceRecord } from "../state/fields";

const t = copy.fieldManagement;
export function FieldChoices({ choices, onChange }: { choices: ChoiceRecord[]; onChange: (choices: ChoiceRecord[]) => void }) {
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [editor, setEditor] = useState<{ mode: "list" | "single" | "edit"; parentId: string | null; id?: string } | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string[] | null>(null);
  const open = (mode: "list" | "single" | "edit", parentId: string | null = null, choice?: ChoiceRecord) => {
    setEditor({ mode, parentId, id: choice?.id }); setValue(choice?.name ?? ""); setError("");
  };
  const save = () => {
    if (!editor) return;
    const names = (editor.mode === "list" ? value.split(/\r?\n/) : [value]).map(name => name.trim()).filter(Boolean);
    if (!names.length) return setError(t.choiceRequired);
    const normalized = names.map(name => name.toLocaleLowerCase());
    if (new Set(normalized).size !== normalized.length || choices.some(choice => choice.parentId === editor.parentId && choice.id !== editor.id && normalized.includes(choice.name.toLocaleLowerCase()))) return setError(t.duplicateChoice);
    onChange(editor.mode === "edit" ? choices.map(choice => choice.id === editor.id ? { ...choice, name: names[0] } : choice) : [...choices, ...names.map(name => ({ id: crypto.randomUUID(), name, parentId: editor.parentId }))]);
    setEditor(null);
  };
  const ordered: { choice: ChoiceRecord; ancestors: string[] }[] = [];
  const walk = (parentId: string | null, ancestors: string[]) => choices.filter(choice => choice.parentId === parentId).forEach(choice => { ordered.push({ choice, ancestors }); walk(choice.id, [...ancestors, choice.id]); });
  walk(null, []);
  const visibleIds = new Set(ordered.filter(({ choice }) => choice.name.toLowerCase().includes(filter.toLowerCase())).flatMap(({ choice, ancestors }) => [choice.id, ...ancestors]));
  const visible = ordered.filter(({ choice }) => visibleIds.has(choice.id));
  const toggle = (id: string, checked: boolean) => setSelected(current => checked ? [...current, id] : current.filter(item => item !== id));
  return <Panel title={t.choices} className="table-panel field-choices" actions={<><Button onClick={() => open("single")}>{t.addChoice}</Button><Button onClick={() => open("list")}>{t.addList}</Button><Button disabled={!choices.length} onClick={() => onChange([...choices].sort((a, b) => a.name.localeCompare(b.name)))}>{t.reorder}</Button></>}>
    <div className="field-choice-filter"><input aria-label={t.filterChoices} placeholder={t.filterChoices} value={filter} onChange={e => setFilter(e.target.value)} /></div>
    <div className="table-scroll"><table><thead><tr><th><input type="checkbox" aria-label={t.selectChoices} checked={visible.length > 0 && visible.every(({ choice }) => selected.includes(choice.id))} onChange={e => setSelected(current => e.target.checked ? [...new Set([...current, ...visible.map(({ choice }) => choice.id)])] : current.filter(id => !visibleIds.has(id)))} /></th><th>{t.choiceName}</th><th>{t.actions}</th></tr></thead><tbody>
      {visible.map(({ choice, ancestors }) => <tr key={choice.id}><td><input type="checkbox" aria-label={choice.name} checked={selected.includes(choice.id)} onChange={e => toggle(choice.id, e.target.checked)} /></td><td><span className="field-choice-name">{ancestors.map(id => <span key={id} className="field-choice-indent" aria-hidden="true" />)}{choice.parentId && <span className="field-choice-branch" aria-hidden="true">{t.branch}</span>}{choice.name}</span></td><td><div className="field-row-actions"><Button variant="quiet" onClick={() => open("single", choice.id)}>{t.addChild}</Button><Button variant="quiet" onClick={() => open("edit", choice.parentId, choice)}>{copy.common.details}</Button><Button variant="quiet" onClick={() => setDeleting([choice.id])}>{copy.workspaceManagement.delete}</Button></div></td></tr>)}
      {!visible.length && <tr><td colSpan={3} className="admin-empty">{copy.userManagement.noData}</td></tr>}
    </tbody></table></div>
    <div className="field-choice-footer"><Button disabled={!selected.length} onClick={() => setDeleting(selected)}>{t.deleteSelected}</Button><span>{t.autoSaved}</span><span>{copy.common.total} {choices.length}</span></div>
    <Modal open={editor !== null} title={editor?.mode === "list" ? t.addList : editor?.mode === "edit" ? t.choiceDetails : editor?.parentId ? t.addChild : t.addChoice} onClose={() => setEditor(null)} footer={<><Button variant="primary" onClick={save}>{copy.common.save}</Button><Button onClick={() => setEditor(null)}>{copy.common.cancel}</Button></>}>
      {error && <p role="alert" className="form-alert">{error}</p>}
      {editor?.parentId && <p className="admin-selection">{t.parentChoice}{t.separator}{choices.find(choice => choice.id === editor.parentId)?.name}</p>}
      <Field label={editor?.mode === "list" ? t.listHint : t.choiceName} required>{editor?.mode === "list" ? <textarea className="field-choice-input" aria-label={t.listHint} value={value} onChange={e => setValue(e.target.value)} autoFocus /> : <input aria-label={t.choiceName} value={value} onChange={e => setValue(e.target.value)} autoFocus onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) save(); }} />}</Field>
      {editor?.mode === "list" && <Button variant="quiet" onClick={() => setValue(t.exampleChoices.join("\n"))}>{t.fillExamples}</Button>}
    </Modal>
    <Modal open={deleting !== null} title={t.deleteChoices} onClose={() => setDeleting(null)} footer={<><Button onClick={() => setDeleting(null)}>{copy.common.cancel}</Button><Button variant="danger" onClick={() => { const ids = choiceBranchIds(choices, deleting ?? []); onChange(choices.filter(choice => !ids.has(choice.id))); setSelected(current => current.filter(id => !ids.has(id))); setDeleting(null); }}>{copy.workspaceManagement.delete}</Button></>}><p>{t.deleteChoicesHint}</p></Modal>
  </Panel>;
}
