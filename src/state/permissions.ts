import { copy } from "../constants/copy";

export type ReviewRole = "reviewer" | "powerUser";
export type PermissionSet = { reviewCenter: boolean; role: ReviewRole; flags: Record<string, boolean> };
export type WorkspacePermissionStore = Record<string, Record<string, PermissionSet>>;
export const permissionActions = ["view", "edit", "delete", "add", "security"] as const;

export function initialPermissions(templateManager = false): PermissionSet {
  const flags: Record<string, boolean> = {};
  for (const id of ["document", "lists", "search", "searchContainer"]) flags[`object.${id}.view`] = true;
  flags["tab.documents"] = true;
  flags["feature.manageImage"] = true;
  flags["feature.sentiment"] = true;
  // Only the visible navigation and review library of the manager template are evidenced.
  if (templateManager) for (const id of ["reviewQueues", "reviewCenter", "reviewManagement"]) flags[`tab.${id}`] = true;
  return { reviewCenter: templateManager, role: "reviewer", flags };
}

export function setReviewFeature(current: PermissionSet, enabled: boolean, role = current.role): PermissionSet {
  const flags = { ...current.flags };
  flags["object.reviewCoding.view"] = enabled;
  flags["object.reviewQueue.view"] = enabled;
  flags["tab.reviewQueues"] = enabled;
  flags["tab.reviewCenter"] = enabled && role === "powerUser";
  flags["object.document.edit"] = enabled && role === "powerUser";
  if (enabled && role === "powerUser") flags["tab.documents"] = true;
  for (const id of ["folders", "fieldTree", "savedSearches", "documentPreview"]) flags[`other.${id}`] = enabled;
  return { reviewCenter: enabled, role, flags };
}

export function samePermissions(a: PermissionSet, b: PermissionSet): boolean {
  return a.reviewCenter === b.reviewCenter && (!a.reviewCenter || a.role === b.role) &&
    [...new Set([...Object.keys(a.flags), ...Object.keys(b.flags)])].every(key => !!a.flags[key] === !!b.flags[key]);
}

export function permissionChanges(before: PermissionSet, after: PermissionSet) {
  const t = copy.permissionManagement;
  const state = (value: boolean | undefined) => value ? t.on : t.off;
  const role = (value: PermissionSet) => value.reviewCenter ? `${t.on}${t.separator}${t[value.role]}` : t.off;
  const boolChange = (label: string, key: string) => ({ label, before: state(before.flags[key]), after: state(after.flags[key]) });
  const features = [
    { label: t.reviewCenter, before: role(before), after: role(after) },
    boolChange(t.code, "object.document.edit"), boolChange(t.manageImage, "feature.manageImage"), boolChange(t.sentiment, "feature.sentiment"),
  ];
  const labels = { view: t.view, edit: t.editAction, delete: t.deleteAction, add: t.add, security: t.editSecurity };
  const objectValue = (value: PermissionSet, id: string) => permissionActions.filter(action => value.flags[`object.${id}.${action}`]).map(action => labels[action]).join(t.valueSeparator) || t.none;
  const objects = [
    ...t.objectRows.map(row => ({ label: row.label, before: objectValue(before, row.id), after: objectValue(after, row.id) })),
    ...t.documentActions.map(row => boolChange(row.label, `document.${row.id}`)),
  ];
  return [
    { id: "features", title: t.featureChanges, rows: features }, { id: "objects", title: t.objects, rows: objects },
    { id: "tabs", title: t.tabs, rows: t.tabRows.map(row => boolChange(row.label, `tab.${row.id}`)) },
    { id: "other", title: t.other, rows: t.settingSections.flatMap(section => section.items.map(row => boolChange(row.label, `other.${row.id}`))) },
  ].map(section => ({ ...section, rows: section.rows.filter(row => row.before !== row.after) }));
}
