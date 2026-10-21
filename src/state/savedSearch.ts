import { copy } from "../constants/copy";

export type SearchFieldId = "id" | "file" | "type" | "extractedText" | "responsive" | "confidential";
export type SearchCondition = { id: string; field: SearchFieldId; operator: "contains" | "notContains" | "is" | "isNot" | "isSet" | "isNotSet"; value: string };
export type SearchSort = { id: string; field: Exclude<SearchFieldId, "extractedText">; direction: "asc" | "desc" };
export type SearchDefinition = {
  conditions: SearchCondition[]; match: "all" | "any"; fields: SearchFieldId[]; sorts: SearchSort[];
  scope: "workspace" | "folders"; folders: number[]; includeSubfolders: boolean;
  related: "none" | "family"; manualRerun: boolean; notes: string;
};
export const defaultSearchDefinition = (): SearchDefinition => ({ conditions: [], match: "all", fields: ["extractedText"], sorts: [], scope: "workspace", folders: [], includeSubfolders: true, related: "none", manualRerun: false, notes: "" });
export type SampleDocument = typeof copy.documents.docs[number];
export function searchValue(doc: SampleDocument, field: SearchFieldId): string {
  return field === "extractedText" ? copy.savedSearchEditor.sampleText[doc.id as keyof typeof copy.savedSearchEditor.sampleText] ?? "" : doc[field];
}
export function searchDefinitionError(d: SearchDefinition): string | null {
  const t = copy.savedSearchEditor;
  if (!d.fields.length) return t.errors.fields;
  if (d.scope === "folders" && !d.folders.length) return t.errors.folders;
  if (d.conditions.some(c => !["isSet", "isNotSet"].includes(c.operator) && !c.value.trim())) return t.errors.condition;
  if (new Set(d.sorts.map(s => s.field)).size !== d.sorts.length) return t.errors.sort;
  return null;
}
export function matchesFolder(doc: SampleDocument, folder: number) {
  return folder === 0 || (folder === 1 ? doc.responsive === copy.documents.docs[2].responsive : folder === 2 ? !doc.type.includes("Email") : folder === 3 ? doc.confidential === copy.documents.docs[0].confidential : doc.responsive === copy.documents.docs[0].responsive);
}
export function evaluateSearch(definition: SearchDefinition): SampleDocument[] {
  const scope = copy.documents.docs.filter(doc => definition.scope === "workspace" || definition.folders.some(folder => matchesFolder(doc, folder)));
  const hits = scope.filter(doc => {
    const matches = definition.conditions.map(c => {
      const actual = searchValue(doc, c.field).toLocaleLowerCase(), expected = c.value.trim().toLocaleLowerCase();
      switch (c.operator) {
        case "contains": return actual.includes(expected);
        case "notContains": return !actual.includes(expected);
        case "is": return actual === expected;
        case "isNot": return actual !== expected;
        case "isSet": return actual.length > 0;
        case "isNotSet": return actual.length === 0;
      }
    });
    return !matches.length || (definition.match === "all" ? matches.every(Boolean) : matches.some(Boolean));
  });
  const family = (id: string) => copy.savedSearchEditor.sampleFamilies.find(group => (group as readonly string[]).includes(id));
  const rows = definition.related === "family" ? scope.filter(doc => hits.some(hit => hit.id === doc.id || family(hit.id)?.some(id => id === doc.id))) : hits;
  return [...rows].sort((a, b) => {
    for (const sort of definition.sorts) {
      const result = searchValue(a, sort.field).localeCompare(searchValue(b, sort.field));
      if (result) return sort.direction === "asc" ? result : -result;
    }
    return 0;
  });
}
