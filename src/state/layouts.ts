import { copy } from "../constants/copy";
import { fieldTimestamp, type FieldRecord } from "./fields";
import { createId } from "./ids";

export type LayoutItem = {
  id: string; fieldId: string; row: number; column: number;
  readOnly: boolean; showName: boolean; customLabel: string;
  display: "text" | "dropdown" | "checkbox"; repeatColumns: number; rowSpan?: number; allowCopy: boolean;
};
export type LayoutSection = {
  id: string; name: string; help: string; collapsible: boolean; collapsed: boolean; items: LayoutItem[];
};
export type LayoutRecord = {
  id: string; name: string; order: number; copyPrevious: boolean; keywords: string; notes: string;
  sections: LayoutSection[]; createdOn: string; modifiedOn: string;
};
export const newSection = (): LayoutSection => ({ id: createId(), name: copy.layoutManagement.defaultCategory, help: "", collapsible: false, collapsed: false, items: [] });
export function newLayoutItem(field: FieldRecord, row: number, column: number): LayoutItem {
  return { id: createId(), fieldId: field.id, row, column, readOnly: false, showName: true, customLabel: "", display: field.type === "multiple" ? "checkbox" : ["single", "singleObject", "multipleObject", "boolean"].includes(field.type) ? "dropdown" : "text", repeatColumns: copy.layoutManagement.defaultRepeatColumns, allowCopy: false };
}
export const sortedItems = (items: LayoutItem[]) => [...items].sort((a, b) => a.row - b.row || a.column - b.column);
// The editor and preview share placement, including collision avoidance for spanning fields.
export function placedItems(items: LayoutItem[]) {
  const occupied = new Set<string>();
  return sortedItems(items).map(item => {
    const width = Math.max(1, Math.min(2, item.repeatColumns));
    const height = Math.max(1, Math.min(4, item.rowSpan ?? 1));
    const column = width === 2 ? 0 : Math.max(0, Math.min(1, item.column));
    let row = Math.max(0, item.row);
    const cells = (start: number) => Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => `${start + y}:${column + x}`)).flat();
    while (cells(row).some(cell => occupied.has(cell))) row++;
    cells(row).forEach(cell => occupied.add(cell));
    return { item, style: { gridColumn: `${column + 1} / span ${width}`, gridRow: `${row + 1} / span ${height}` } };
  });
}
export function defaultSections(fields: FieldRecord[]): LayoutSection[] {
  const section = newSection();
  const control = fields.find(field => field.id === "control-number");
  if (control) section.items.push(newLayoutItem(control, 0, 0));
  return [section];
}
export function withExampleFields(fields: FieldRecord[]): FieldRecord[] {
  const result = [...fields];
  const t = copy.layoutManagement;
  for (const sample of t.exampleFields) {
    if (result.some(field => field.name.toLowerCase() === sample.name.toLowerCase())) continue;
    const id = createId();
    const choices: { id: string; name: string; parentId: string | null }[] = sample.key === "issues" ? copy.fieldManagement.exampleChoices.map(name => ({ id: createId(), name, parentId: null })) : [];
    if (sample.key === "issues") choices.push({ id: createId(), name: t.financial, parentId: choices[0].id });
    result.push({ id, name: sample.name, type: sample.type, choices, createdOn: fieldTimestamp(), modifiedOn: fieldTimestamp() });
  }
  return result;
}
// Store only a small formatting subset; pasted markup cannot add scripts or attributes.
export function cleanHelp(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const allowed = new Set(["P", "BR", "B", "STRONG", "I", "EM", "U", "UL", "OL", "LI", "DIV"]);
  const escape = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const clean = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return escape(node.textContent ?? "");
    if (!(node instanceof Element) || ["SCRIPT", "STYLE", "IFRAME", "OBJECT"].includes(node.tagName)) return "";
    const inner = Array.from(node.childNodes).map(clean).join("");
    if (!allowed.has(node.tagName)) return inner;
    return node.tagName === "BR" ? "<br>" : `<${node.tagName.toLowerCase()}>${inner}</${node.tagName.toLowerCase()}>`;
  };
  return Array.from(doc.body.childNodes).map(clean).join("");
}
