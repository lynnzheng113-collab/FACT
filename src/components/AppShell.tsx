import type { ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  ClipboardCheck,
  ArrowLeft,
  Files,
  FolderCog,
  HelpCircle,
  Home,
  ListTodo,
  Menu,
  Network,
  PackageCheck,
  ScanSearch,
  Search,
  User,
  Users,
} from "lucide-react";
import { copy, type PageId } from "../constants/copy";
import { navigationFor, activeModule, type Role } from "../state/navigation";
import type { WorkspaceRecord } from "../state/Administration";
import { Button, IconButton } from "./UI";

const iconMap: Record<PageId, typeof Home> = {
  audit: ClipboardCheck, reviewSetup: FolderCog, other: Menu, batches: ClipboardCheck,
  workspaces: FolderCog,
  users: Users,
  fields: FolderCog,
  home: Home,
  processing: FolderCog,
  documents: Files,
  analytics: Network,
  review: ClipboardCheck,
  redaction: ScanSearch,
  production: PackageCheck,
  tasks: ListTodo,
};

export function AppShell({
  page,
  role, workspace, onLeave, onLogout, reviewOrigin,
  onPageChange,
  children,
  notificationsOpen,
  setNotificationsOpen,
  helpOpen,
  setHelpOpen,
  userOpen,
  setUserOpen,
}: {
  page: PageId;
  role: Role; workspace?: WorkspaceRecord; onLeave: () => void; onLogout: () => void; reviewOrigin: PageId;
  onPageChange: (page: PageId) => void;
  children: ReactNode;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
  userOpen: boolean;
  setUserOpen: (open: boolean) => void;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button type="button" className="brand-mark" aria-label={copy.brand.name} onClick={() => workspace ? onPageChange(role === "admin" ? "home" : "documents") : onPageChange("workspaces")}>
          {copy.brand.mark}
        </button>
        <nav className="sidebar__nav" aria-label={copy.brand.shortName}>
          {navigationFor(role, Boolean(workspace)).map((item) => {
            const Icon = iconMap[item.id];
            return (
              <button
                type="button"
                key={item.id}
                className={(role === "reviewer" && (page === "batches" || page === "review" && reviewOrigin === "batches") ? "batches" : activeModule(page, reviewOrigin)) === item.id ? "is-active" : ""}
                aria-label={item.label}
                title={item.label}
                onClick={() => onPageChange(item.id)}
              >
                <Icon size={20} aria-hidden="true" />
                <span>{item.short}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="app-shell__main">
        <header className="topbar">
          <div className="workspace-navigation">
            {workspace && <Button className="workspace-return" icon={<ArrowLeft size={18} aria-hidden="true" />} onClick={onLeave}>{copy.access.leave}</Button>}
            <div className="workspace-switcher">
              <span className="workspace-switcher__client">{workspace?.clientName ?? (role === "admin" ? copy.access.platform : copy.access.selection)}</span>
              <strong>{workspace?.name ?? copy.workspace.allWorkspaces}</strong>
            </div>
          </div>
          <div className="topbar__tools">
            {workspace && <button type="button" className="global-search" onClick={() => onPageChange("documents")}>
              <Search size={16} aria-hidden="true" />
              <span>{copy.common.search}</span>
            </button>}
            <IconButton label={copy.common.notifications} onClick={() => setNotificationsOpen(!notificationsOpen)} active={notificationsOpen}>
              <Bell size={19} />
              <span className="notification-dot" />
            </IconButton>
            <IconButton label={copy.common.help} onClick={() => setHelpOpen(!helpOpen)} active={helpOpen}>
              <HelpCircle size={19} />
            </IconButton>
            <button type="button" className="user-button" onClick={() => setUserOpen(!userOpen)}>
              <User size={18} aria-hidden="true" />
              <span>{copy.access.accounts[role].name}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
          </div>

          {notificationsOpen && (
            <div className="popover popover--notifications">
              <h2>{copy.overlays.notificationTitle}</h2>
              <div className="notification-list">
                {copy.overlays.notifications.map((item) => (
                  <button type="button" key={item.title} onClick={() => setNotificationsOpen(false)}>
                    <span className={`notification-list__marker notification-list__marker--${item.tone}`} />
                    <span><strong>{item.title}</strong><small>{item.detail}</small></span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {helpOpen && (
            <div className="popover popover--help">
              <h2>{copy.overlays.helpTitle}</h2>
              <p>{copy.overlays.helpText}</p>
              <p className="popover__note">{copy.overlays.noBackend}</p>
            </div>
          )}

          {userOpen && (
            <div className="popover popover--user">
              <h2>{copy.overlays.userTitle}</h2>
              <p>{copy.access.roles[role]}</p>
              {copy.overlays.userItems.slice(0, -1).map((item) => <button type="button" key={item} onClick={() => setUserOpen(false)}>{item}</button>)}
              <button type="button" onClick={onLogout}>{copy.access.signOut}</button>
            </div>
          )}
        </header>

        <div className="scope-context"><span>{copy.access.roles[role]}</span><span>{workspace ? copy.access.workspaceScope : copy.access.platformScope}</span></div>
        <main className="page-canvas">{children}</main>
        <footer className="prototype-footer">
          <span>{copy.meta.prototype}</span>
          <span>{copy.meta.synthetic}</span>
          <span>{copy.meta.version}</span>
          <span>{copy.common.demoOnly}</span>
        </footer>
      </div>

    </div>
  );
}
