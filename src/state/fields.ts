import { copy } from "../constants/copy";

export type ChoiceRecord = { id: string; name: string; parentId: string | null };
export type FieldRecord = {
  id: string; name: string; type: string; choices: ChoiceRecord[];
  createdOn: string; modifiedOn: string;
};
export type FieldCategory = {
  id: string; name: string; order: number; fieldIds: string[];
  createdOn: string; modifiedOn: string;
};
export const fieldTimestamp = () => new Date().toLocaleString(copy.userManagement.dateLocale, { hour12: false });
export const createFields = (): FieldRecord[] => copy.fieldManagement.seedFields.map(field => ({ ...field, choices: [], createdOn: "", modifiedOn: "" }));
export const createCategories = (): FieldCategory[] => copy.fieldManagement.seedCategories.map(category => ({ ...category, fieldIds: [...category.fieldIds], createdOn: "", modifiedOn: "" }));

// Include descendants when removing a parent; retain the hierarchy when sorting.
export function choiceBranchIds(choices: ChoiceRecord[], roots: string[]): Set<string> {
  const ids = new Set(roots);
  let changed = true;
  while (changed) {
    changed = false;
    for (const choice of choices) if (choice.parentId && ids.has(choice.parentId) && !ids.has(choice.id)) { ids.add(choice.id); changed = true; }
  }
  return ids;
}
