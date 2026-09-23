import type { ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  ClipboardCheck,
  FileSearch,
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
import { Badge, Drawer, IconButton } from "./UI";

const iconMap: Record<PageId, typeof Home> = {
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
  onPageChange,
  children,
  scopeOpen,
  setScopeOpen,
  notificationsOpen,
  setNotificationsOpen,
  helpOpen,
  setHelpOpen,
  userOpen,
  setUserOpen,
}: {
  page: PageId;
  onPageChange: (page: PageId) => void;
  children: ReactNode;
  scopeOpen: boolean;
  setScopeOpen: (open: boolean) => void;
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
        <button type="button" className="brand-mark" aria-label={copy.brand.name} onClick={() => onPageChange("home")}>
          {copy.brand.mark}
        </button>
        <nav className="sidebar__nav" aria-label={copy.brand.shortName}>
          {copy.navigation.map((item) => {
            const Icon = iconMap[item.id];
            return (
              <button
                type="button"
                key={item.id}
                className={page === item.id ? "is-active" : ""}
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
        <IconButton label={copy.common.openMenu} onClick={() => setScopeOpen(true)}>
          <Menu size={20} />
        </IconButton>
      </aside>

      <div className="app-shell__main">
        <header className="topbar">
          <button type="button" className="workspace-switcher" onClick={() => onPageChange("workspaces")}>
            <span className="workspace-switcher__client">{copy.workspace.client}</span>
            <strong>{copy.workspace.name}</strong>
            <ChevronDown size={16} aria-hidden="true" />
          </button>
          <div className="topbar__tools">
            <button type="button" className="global-search" onClick={() => onPageChange("documents")}>
              <Search size={16} aria-hidden="true" />
              <span>{copy.common.search}</span>
            </button>
            <button type="button" className="scope-button" onClick={() => setScopeOpen(true)}>
              <FileSearch size={17} aria-hidden="true" />
              <span>{copy.common.scope}</span>
              <Badge tone="info">{copy.scope.totalNumber}</Badge>
            </button>
            <IconButton label={copy.common.notifications} onClick={() => setNotificationsOpen(!notificationsOpen)} active={notificationsOpen}>
              <Bell size={19} />
              <span className="notification-dot" />
            </IconButton>
            <IconButton label={copy.common.help} onClick={() => setHelpOpen(!helpOpen)} active={helpOpen}>
              <HelpCircle size={19} />
            </IconButton>
            <button type="button" className="user-button" onClick={() => setUserOpen(!userOpen)}>
              <User size={18} aria-hidden="true" />
              <span>{copy.workspace.user}</span>
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
              <p>{copy.workspace.role}</p>
              {copy.overlays.userItems.map((item) => <button type="button" key={item} onClick={() => setUserOpen(false)}>{item}</button>)}
            </div>
          )}
        </header>

        <main className="page-canvas">{children}</main>
        <footer className="prototype-footer">
          <span>{copy.meta.prototype}</span>
          <span>{copy.meta.synthetic}</span>
          <span>{copy.meta.version}</span>
          <span>{copy.common.demoOnly}</span>
        </footer>
      </div>

      <Drawer open={scopeOpen} title={copy.scope.title} onClose={() => setScopeOpen(false)}>
        <div className="scope-summary">
          <Badge tone="info">{copy.scope.total}</Badge>
          <Badge tone="danger">{copy.scope.p0}</Badge>
          <Badge tone="warning">{copy.scope.p1}</Badge>
        </div>
        <p>{copy.scope.intro}</p>
        <div className="scope-list">
          {copy.scope.groups.map((group) => (
            <button type="button" key={group.ids} onClick={() => setScopeOpen(false)}>
              <span><strong>{group.title}</strong><small>{group.ids}</small></span>
              <Badge tone={group.count.includes("P0") ? "danger" : "warning"}>{group.count}</Badge>
            </button>
          ))}
        </div>
        <div className="scope-boundary">
          <h3>{copy.scope.boundaryTitle}</h3>
          <p>{copy.scope.boundary}</p>
        </div>
      </Drawer>
    </div>
  );
}
