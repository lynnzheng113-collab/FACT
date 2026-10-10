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
import { RawImportPage } from "./pages/RawImportPage";
import { BatchesPage, UserStatusPage, WorkspaceSelectionPage } from "./pages/AccessPages";
import { AuditPage } from "./pages/AuditPage";
import { createAuditSamples, type AuditRecord } from "./state/audit";
import { createId } from "./state/ids";

export default function App() { return <AdministrationProvider><PrototypeApp /></AdministrationProvider>; }
function PrototypeApp() {
  const [role, setRole] = useState<Role | null>(null);
  const [page, setPage] = useState<PageId>("workspaces");
  const [reviewOrigin, setReviewOrigin] = useState<PageId>("documents");
  const [rawImportOpen, setRawImportOpen] = useState(false);
  const [otherTab, setOtherTab] = useState<string>(copy.tasks.title);
  const [notificationsOpen, setNotificationsOpen] = useState(false), [helpOpen, setHelpOpen] = useState(false), [userOpen, setUserOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null), [audit, setAudit] = useState<AuditRecord[]>(createAuditSamples);
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, qcPassed, setQcPassed } = useAdministration();
  const workspace = workspaces.find(item => item.id === activeWorkspaceId);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 3200); return () => window.clearTimeout(timer); }, [toast]);
  const record = (action: string, actor = role) => { if (!actor) return; const account = copy.access.accounts[actor]; setAudit(current => [{ id: createId(), timestamp: new Date().toISOString(), user: account.name, userId: account.id, action, workspaceId: "admin", workspaceName: copy.audit.adminCase, objectType: copy.audit.userType, objectId: account.id, objectName: account.name, executionTime: 0, changes: [], details: action === copy.audit.login ? copy.audit.loginDetail : copy.audit.logoutDetail, source: "session" }, ...current]); };
  const notify = (message: string) => { setToast(message); };
  const closeOverlays = () => { setNotificationsOpen(false); setHelpOpen(false); setUserOpen(false); };
  const navigate = (nextPage: PageId) => { if (!role || !canNavigate(role, Boolean(workspace), nextPage)) return setToast(copy.access.denied); if (nextPage === "review") setReviewOrigin(page === "batches" ? "batches" : page === "other" ? "other" : "documents"); if (nextPage !== "home") setRawImportOpen(false); setPage(nextPage); closeOverlays(); window.scrollTo({ top: 0, behavior: "auto" }); };
  const enterWorkspace = (id: string) => { const target = workspaces.find(item => item.id === id); if (!target || !role) return; setActiveWorkspaceId(id); setPage(role === "admin" ? "home" : "documents"); setRawImportOpen(false); setOtherTab(copy.tasks.title); closeOverlays(); setToast(null); window.scrollTo(0, 0); };
  const leaveWorkspace = () => { setActiveWorkspaceId(null); setPage("workspaces"); setRawImportOpen(false); closeOverlays(); setToast(null); };
  const logout = () => { record(copy.audit.logout); setRole(null); setActiveWorkspaceId(null); setPage("workspaces"); setRawImportOpen(false); closeOverlays(); setToast(null); };
  if (!role) return <LoginPage onLogin={next => { setRole(next); setPage("workspaces"); record(copy.audit.login, next); }} />;
  const batches = <BatchesPage role={role} onReview={() => { setReviewOrigin(page === "other" ? "other" : "batches"); setPage("review"); }} />;
  const other = <div className="page"><PageHeader title={copy.modules.other} subtitle={workspace ? copy.modules.otherHint : copy.modules.platformOtherHint} ids={copy.tasks.ids} priorities={[]} /><Tabs items={workspace ? [copy.tasks.title, copy.modules.batchTitle, copy.userStatus.title] : [copy.tasks.title]} active={otherTab} onChange={setOtherTab} />{otherTab === copy.modules.batchTitle && workspace ? batches : otherTab === copy.userStatus.title && workspace ? <UserStatusPage role={role} workspaceId={activeWorkspaceId} /> : <TasksPage notify={notify} />}</div>;
  const setup = <ReviewSetupPage notify={notify} />;
  const content = {
    workspaces: role === "admin" ? <WorkspacesPage notify={notify} navigateHome={enterWorkspace} /> : <WorkspaceSelectionPage onEnter={enterWorkspace} />,
    users: <UsersPage notify={notify} status={<UserStatusPage role={role} workspaceId={activeWorkspaceId} />} />,
    audit: <AuditPage entries={audit} setEntries={setAudit} />,
    fields: setup, reviewSetup: setup,
    home: rawImportOpen ? <RawImportPage onBack={() => setRawImportOpen(false)} notify={notify} /> : <HomePage navigate={navigate} onOpenRawImport={() => { setRawImportOpen(true); window.scrollTo({ top: 0, behavior: "auto" }); }} notify={notify} />,
    processing: <ProcessingPage notify={notify} />,
    documents: <DocumentsPage navigate={navigate} notify={notify} />,
    analytics: <AnalyticsPage notify={notify} navigate={navigate} />,
    review: <><div className="module-toolbar"><Button onClick={() => navigate(reviewOrigin)}>{reviewOrigin === "documents" ? copy.modules.backDocuments : copy.modules.backBatches}</Button></div><ReviewPage notify={notify} onReturn={() => navigate(reviewOrigin)} /></>,
    batches,
    redaction: <RedactionPage notify={notify} qcPassed={qcPassed} setQcPassed={setQcPassed} />,
    production: <ProductionPage navigate={navigate} notify={notify} qcPassed={qcPassed} />,
    tasks: <TasksPage notify={notify} />, other,
  } satisfies Record<PageId, ReactNode>;
  return <AppShell page={page} role={role} workspace={workspace} onLeave={leaveWorkspace} onLogout={logout} reviewOrigin={reviewOrigin} onPageChange={navigate} notificationsOpen={notificationsOpen} setNotificationsOpen={setNotificationsOpen} helpOpen={helpOpen} setHelpOpen={setHelpOpen} userOpen={userOpen} setUserOpen={setUserOpen}><div key={`${role}:${activeWorkspaceId ?? "platform"}`}>{canNavigate(role, Boolean(workspace), page) ? content[page] : null}</div><Toast message={toast} tone={toast && ([copy.review.validation, copy.documents.lockedMessage, copy.redaction.blocked, copy.production.blocked, copy.access.denied] as readonly string[]).includes(toast) ? "danger" : "success"} onClose={() => setToast(null)} /></AppShell>;
}
