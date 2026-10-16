import { copy, workspaceTabIds, reviewerWorkspaceTabIds, type PageId } from "../constants/copy";

export type Role = "admin" | "reviewer";
export const platformPages: PageId[] = ["users", "workspaces", "audit", "other"];
export const workspacePages: PageId[] = [...workspaceTabIds];
export function navigationFor(role: Role, inWorkspace: boolean) {
  const ids: PageId[] = role === "admin" ? (inWorkspace ? workspacePages : platformPages) : (inWorkspace ? [...reviewerWorkspaceTabIds] : ["workspaces"]);
  return ids.map(id => copy.navigation.find(item => item.id === id)!);
}
export function canNavigate(role: Role, inWorkspace: boolean, page: PageId) {
  if (role === "reviewer") return inWorkspace ? ["documents", "batches", "review"].includes(page) : page === "workspaces";
  return inWorkspace ? [...workspacePages, "fields", "review", "batches", "tasks"].includes(page) : [...platformPages, "tasks"].includes(page);
}
export function activeModule(page: PageId, reviewOrigin: PageId): PageId {
  if (page === "fields") return "reviewSetup";
  if (page === "batches") return "other";
  if (page === "tasks") return "other";
  if (page === "review") return reviewOrigin;
  return page;
}
