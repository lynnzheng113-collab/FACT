import { useEffect, useState, type ReactNode } from "react";
import { AdministrationProvider, useAdministration } from "./state/Administration";
import { canNavigate, type Role } from "./state/navigation";
import { UsersPage } from "./pages/UsersPage";
import { AppShell } from "./components/AppShell";
import { Button, PageHeader, Tabs, Toast } from "./components/UI";
import { copy, type PageId } from "./constants/copy";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { HomePage } from "./pages/HomePage";
import { ProcessingPage } from "./pages/ProcessingPage";
import { ProductionPage } from "./pages/ProductionPage";
import { RedactionPage } from "./pages/RedactionPage";
import { ReviewPage } from "./pages/ReviewPage";
import { TasksPage } from "./pages/TasksPage";
import { WorkspacesPage } from "./pages/WorkspacesPage";
import { LoginPage } from "./pages/LoginPage";
import { ReviewSetupPage } from "./pages/ReviewSetupPage";
import { AuditPage, BatchesPage, UserStatusPage, WorkspaceSelectionPage, type AuditEntry } from "./pages/AccessPages";

export default function App() { return <AdministrationProvider><PrototypeApp /></AdministrationProvider>; }
function PrototypeApp() {
  const [role, setRole] = useState<Role | null>(null);
  const [page, setPage] = useState<PageId>("workspaces");
  const [reviewOrigin, setReviewOrigin] = useState<PageId>("documents");
  const [otherTab, setOtherTab] = useState<string>(copy.tasks.title);
  const [scopeOpen, setScopeOpen] = useState(false), [notificationsOpen, setNotificationsOpen] = useState(false), [helpOpen, setHelpOpen] = useState(false), [userOpen, setUserOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null), [audit, setAudit] = useState<AuditEntry[]>([]);
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, qcPassed, setQcPassed } = useAdministration();
  const workspace = workspaces.find(item => item.id === activeWorkspaceId);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 3200); return () => window.clearTimeout(timer); }, [toast]);
  const record = (action: string, actor = role, target = workspace) => { if (!actor) return; setAudit(current => [{ id: crypto.randomUUID(), time: new Date().toLocaleString(copy.userManagement.dateLocale, { hour12: false }), user: copy.access.accounts[actor].name, action, workspace: target?.name ?? copy.access.platformScope }, ...current]); };
  const notify = (message: string) => { setToast(message); record(message); };
  const closeOverlays = () => { setNotificationsOpen(false); setHelpOpen(false); setUserOpen(false); setScopeOpen(false); };
  const navigate = (nextPage: PageId) => { if (!role || !canNavigate(role, Boolean(workspace), nextPage)) return setToast(copy.access.denied); if (nextPage === "review") setReviewOrigin(page === "batches" ? "batches" : page === "other" ? "other" : "documents"); setPage(nextPage); closeOverlays(); window.scrollTo({ top: 0, behavior: "auto" }); };
  const enterWorkspace = (id: string) => { const target = workspaces.find(item => item.id === id); if (!target || !role) return; setActiveWorkspaceId(id); setPage(role === "admin" ? "home" : "documents"); setOtherTab(copy.tasks.title); closeOverlays(); setToast(null); record(copy.audit.enter, role, target); window.scrollTo(0, 0); };
  const leaveWorkspace = () => { if (workspace) record(copy.audit.leave); setActiveWorkspaceId(null); setPage("workspaces"); closeOverlays(); setToast(null); };
  const logout = () => { record(copy.audit.logout); setRole(null); setActiveWorkspaceId(null); setPage("workspaces"); closeOverlays(); setToast(null); };
  if (!role) return <LoginPage onLogin={next => { setRole(next); setPage("workspaces"); record(copy.audit.login, next); }} />;
  const batches = <BatchesPage role={role} onReview={() => { setReviewOrigin(page === "other" ? "other" : "batches"); setPage("review"); }} />;
  const other = <div className="page"><PageHeader title={copy.modules.other} subtitle={workspace ? copy.modules.otherHint : copy.modules.platformOtherHint} ids={copy.tasks.ids} priorities={[]} /><Tabs items={workspace ? [copy.tasks.title, copy.modules.batchTitle] : [copy.tasks.title]} active={otherTab} onChange={setOtherTab} />{otherTab === copy.modules.batchTitle && workspace ? batches : <TasksPage notify={notify} />}</div>;
  const setup = <ReviewSetupPage notify={notify} />;
  const content = {
    workspaces: role === "admin" ? <WorkspacesPage notify={notify} navigateHome={enterWorkspace} /> : <WorkspaceSelectionPage onEnter={enterWorkspace} />,
    users: <UsersPage notify={notify} status={<UserStatusPage role={role} workspaceId={activeWorkspaceId} />} />,
    audit: <AuditPage entries={audit} />,
    fields: setup, reviewSetup: setup,
    home: <HomePage navigate={navigate} />,
    processing: <ProcessingPage notify={notify} />,
    documents: <DocumentsPage navigate={navigate} notify={notify} />,
    analytics: <AnalyticsPage notify={notify} navigate={navigate} />,
    review: <><div className="module-toolbar"><Button onClick={() => navigate(reviewOrigin)}>{reviewOrigin === "documents" ? copy.modules.backDocuments : copy.modules.backBatches}</Button></div><ReviewPage notify={notify} onReturn={() => navigate(reviewOrigin)} /></>,
    batches,
    redaction: <RedactionPage notify={notify} qcPassed={qcPassed} setQcPassed={setQcPassed} />,
    production: <ProductionPage navigate={navigate} notify={notify} qcPassed={qcPassed} />,
    tasks: <TasksPage notify={notify} />, other,
  } satisfies Record<PageId, ReactNode>;
  return <AppShell page={page} role={role} workspace={workspace} onLeave={leaveWorkspace} onLogout={logout} reviewOrigin={reviewOrigin} onPageChange={navigate} scopeOpen={scopeOpen} setScopeOpen={setScopeOpen} notificationsOpen={notificationsOpen} setNotificationsOpen={setNotificationsOpen} helpOpen={helpOpen} setHelpOpen={setHelpOpen} userOpen={userOpen} setUserOpen={setUserOpen}><div key={`${role}:${activeWorkspaceId ?? "platform"}`}>{canNavigate(role, Boolean(workspace), page) ? content[page] : null}</div><Toast message={toast} tone={toast && ([copy.review.validation, copy.documents.lockedMessage, copy.redaction.blocked, copy.production.blocked, copy.access.denied] as readonly string[]).includes(toast) ? "danger" : "success"} onClose={() => setToast(null)} /></AppShell>;
}
