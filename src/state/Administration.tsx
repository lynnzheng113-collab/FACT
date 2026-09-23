import { createContext, useContext, useState, type ReactNode } from "react";
import { copy } from "../constants/copy";

export type ClientRecord = { id: string; name: string; number: string; status: string; domain: string };
export type MatterRecord = { id: string; name: string; number: string; clientId: string; clientName: string; clientNumber: string; status: string; keywords: string; notes: string };
export type WorkspaceRecord = { id: string; name: string; matterId: string; matterName: string; clientName: string; artifactId: string; template: string; status: string; pinned: boolean };
export type UserRecord = {
  id: string; firstName: string; lastName: string; email: string; type: string; clientId: string;
  access: boolean; disableOn: string; trustedIPs: string; changeSettings: boolean;
  changeViewer: boolean; documentSkip: boolean; shortcuts: boolean; pageLength: string;
  viewerPreference: string; searchOwner: string; notifications: string; showFilters: boolean;
  keywords: string; notes: string; createdOn: string; modifiedOn: string;
};
export type GroupRecord = { id: string; name: string; clientId: string; userIds: string[]; workspaceIds: string[]; keywords: string; notes: string; createdOn: string; modifiedOn: string };

function useAdministrationState() {
  const [clients, setClients] = useState<ClientRecord[]>(() => copy.workspaceManagement.clients.map(item => ({ ...item })));
  const [matters, setMatters] = useState<MatterRecord[]>(() => copy.workspaceManagement.matters.map(item => ({ ...item })));
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>(() => copy.workspaceManagement.workspaces.map(item => ({ ...item })));
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  return { clients, setClients, matters, setMatters, workspaces, setWorkspaces, users, setUsers, groups, setGroups };
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
