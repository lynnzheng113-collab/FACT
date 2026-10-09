import { createContext, useContext, useMemo, useState, type ReactNode, type SetStateAction } from "react";
import { initialPermissions, type WorkspacePermissionStore } from "./permissions";
import { copy } from "../constants/copy";
import { createFields, createCategories, fieldTimestamp } from "./fields";
import { defaultSections, withExampleFields, type LayoutRecord } from "./layouts";

import type { ExportJob } from "./export";

export type ClientRecord = { id: string; name: string; number: string; status: string; domain: string };
export type MatterRecord = { id: string; name: string; number: string; clientId: string; clientName: string; clientNumber: string; status: string; keywords: string; notes: string };
export type WorkspaceRecord = {
  id: string; name: string; matterId: string; matterName: string; clientName: string; artifactId: string; template: string; status: string; pinned: boolean; adminGroupId?: string;
  resourcePool?: string; databaseLocation?: string; defaultFileRepository?: string; dataGridFileRepository?: string; defaultCacheLocation?: string; downloadHandlerUrl?: string;
  sqlFullTextLanguage?: string; keywords?: string; notes?: string;
};
export type UserRecord = {
  id: string; firstName: string; lastName: string; email: string; type: string; clientId: string;
  access: boolean; disableOn: string; trustedIPs: string; changeSettings: boolean;
  changeViewer: boolean; documentSkip: boolean; shortcuts: boolean; pageLength: string;
  viewerPreference: string; searchOwner: string; notifications: string; showFilters: boolean;
  keywords: string; notes: string; createdOn: string; modifiedOn: string;
};
export type GroupRecord = { id: string; name: string; clientId: string; userIds: string[]; workspaceIds: string[]; keywords: string; notes: string; createdOn: string; modifiedOn: string };

export type SavedSearch = {
  id: string; name: string; query: string; includeFamily: boolean; folder: number;
  folderName?: string; owner?: string; visibility?: "public" | "private"; selectedFields?: string[]; sort?: string;
};
export type DtSearchIndex = {
  id: string; name: string; searchableSet: string; status: string; documents: string; updated: string;
  searchableSetId?: string; searchableSetType?: "static" | "savedSearch";
  order: string; email: string; skipMalicious: boolean; defaultSubindex: boolean; progress: number; stage: number;
};
type WorkspaceState = {
  exportJobs: ExportJob[];
  fields: ReturnType<typeof createFields>; layouts: LayoutRecord[]; fieldCategories: ReturnType<typeof createCategories>;
  highlights: { name: string; terms: string; enabled: boolean }; savedSearches: SavedSearch[]; dtSearchIndexes: DtSearchIndex[]; activeIndexId: string | null;
  batchOwner: string | null; qcPassed: boolean; documentView: { query: string; folder: number; includeFamily: boolean; reportTerm: string | null; searchIndexId: string | null };
};
const newWorkspaceState = (): WorkspaceState => { const fields = withExampleFields(createFields()); const now = fieldTimestamp(); const layouts = copy.layoutManagement.defaultLayouts.map((name, index) => ({ id: `layout-default-${index + 1}`, name, order: index + 1, copyPrevious: false, keywords: "", notes: "", sections: defaultSections(fields), createdOn: now, modifiedOn: now })); return ({ exportJobs: [], fields, layouts, fieldCategories: createCategories(), highlights: { name: copy.modules.highlightDefault, terms: copy.modules.highlightTerms, enabled: true }, savedSearches: [], dtSearchIndexes: copy.analytics.indexRows.map((row, index) => ({ ...row, id: `idx-${index + 1}`, order: String(index + 1), email: "admin@example.com", skipMalicious: true, defaultSubindex: true, progress: 100, stage: 4 })), activeIndexId: null, batchOwner: null, qcPassed: false, documentView: { query: copy.documents.searchValue, folder: 0, includeFamily: true, reportTerm: null, searchIndexId: null } }); }
function useAdministrationState() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [workspaceStates, setWorkspaceStates] = useState<Record<string, WorkspaceState>>({});
  const scope = activeWorkspaceId ?? "platform";
  const initialState = useMemo(newWorkspaceState, [scope]);
  const state = workspaceStates[scope] ?? initialState;
  function setScoped<K extends keyof WorkspaceState>(key: K, action: SetStateAction<WorkspaceState[K]>) {
    setWorkspaceStates(current => {
      const previous = current[scope] ?? initialState;
      const value = typeof action === "function" ? (action as (value: WorkspaceState[K]) => WorkspaceState[K])(previous[key]) : action;
      return { ...current, [scope]: { ...previous, [key]: value } };
    });
  }
  const { fields, layouts, fieldCategories, highlights, savedSearches, dtSearchIndexes, activeIndexId, batchOwner, qcPassed, documentView } = state;
  const setExportJobs = (action: SetStateAction<ExportJob[]>) => setScoped("exportJobs", action);
  const setFields = (action: SetStateAction<WorkspaceState["fields"]>) => setScoped("fields", action);
  const setLayouts = (action: SetStateAction<LayoutRecord[]>) => setScoped("layouts", action);
  const setFieldCategories = (action: SetStateAction<WorkspaceState["fieldCategories"]>) => setScoped("fieldCategories", action);
  const setHighlights = (action: SetStateAction<WorkspaceState["highlights"]>) => setScoped("highlights", action);
  const setSavedSearches = (action: SetStateAction<SavedSearch[]>) => setScoped("savedSearches", action);
  const setDtSearchIndexes = (action: SetStateAction<DtSearchIndex[]>) => setScoped("dtSearchIndexes", action);
  const setActiveIndexId = (action: SetStateAction<string | null>) => setScoped("activeIndexId", action);
  const setBatchOwner = (action: SetStateAction<string | null>) => setScoped("batchOwner", action);
  const setDocumentView = (action: SetStateAction<WorkspaceState["documentView"]>) => setScoped("documentView", action);
  const setQcPassed = (action: SetStateAction<boolean>) => setScoped("qcPassed", action);
  const [clients, setClients] = useState<ClientRecord[]>(() => copy.workspaceManagement.clients.map(item => ({ ...item })));
  const [matters, setMatters] = useState<MatterRecord[]>(() => copy.workspaceManagement.matters.map(item => ({ ...item })));
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>(() => copy.workspaceManagement.workspaces.map(item => ({ ...item })));
  const [users, setUsers] = useState<UserRecord[]>(() => copy.userManagement.testUsers.map(user => ({ ...user })));
  const [groups, setGroups] = useState<GroupRecord[]>(() => copy.userManagement.testGroups.map(group => ({ ...group, userIds: [...group.userIds], workspaceIds: [...group.workspaceIds] })));
  const [permissions, setPermissions] = useState<WorkspacePermissionStore>(() => Object.fromEntries(copy.workspaceManagement.workspaces.map(workspace => [workspace.id, Object.fromEntries(copy.userManagement.testGroups.filter(group => (group.workspaceIds as readonly string[]).includes(String(workspace.id))).map(group => [group.id, initialPermissions(group.name.includes("Managers"))]))])));
  return { exportJobs: state.exportJobs, setExportJobs, documentView, setDocumentView, activeWorkspaceId, setActiveWorkspaceId, highlights, setHighlights, savedSearches, setSavedSearches, dtSearchIndexes, setDtSearchIndexes, activeIndexId, setActiveIndexId, batchOwner, setBatchOwner, qcPassed, setQcPassed, layouts, setLayouts, fields, setFields, fieldCategories, setFieldCategories, permissions, setPermissions, clients, setClients, matters, setMatters, workspaces, setWorkspaces, users, setUsers, groups, setGroups };
}

const AdministrationContext = createContext<ReturnType<typeof useAdministrationState> | null>(null);
export function AdministrationProvider({ children }: { children: ReactNode }) {
  return <AdministrationContext.Provider value={useAdministrationState()}>{children}</AdministrationContext.Provider>;
}
export function useAdministration() {
  const value = useContext(AdministrationContext);
  if (!value) throw new Error("AdministrationProvider is required");
  return value;
}
