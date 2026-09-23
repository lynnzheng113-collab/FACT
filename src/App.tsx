import { useEffect, useState, type ReactNode } from "react";
import { AdministrationProvider } from "./state/Administration";
import { UsersPage } from "./pages/UsersPage";
import { FieldsPage } from "./pages/FieldsPage";
import { AppShell } from "./components/AppShell";
import { Toast } from "./components/UI";
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

export default function App() {
  return <AdministrationProvider><PrototypeApp /></AdministrationProvider>;
}

function PrototypeApp() {
  const [page, setPage] = useState<PageId>("workspaces");
  const [scopeOpen, setScopeOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [qcPassed, setQcPassed] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const navigate = (nextPage: PageId) => {
    setPage(nextPage);
    setNotificationsOpen(false);
    setHelpOpen(false);
    setUserOpen(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const content = {
    workspaces: <WorkspacesPage notify={setToast} navigateHome={() => navigate("home")} />,
    users: <UsersPage notify={setToast} />,
    fields: <FieldsPage notify={setToast} />,
    home: <HomePage navigate={navigate} />,
    processing: <ProcessingPage notify={setToast} />,
    documents: <DocumentsPage navigate={navigate} notify={setToast} />,
    analytics: <AnalyticsPage notify={setToast} />,
    review: <ReviewPage notify={setToast} />,
    redaction: <RedactionPage notify={setToast} qcPassed={qcPassed} setQcPassed={setQcPassed} />,
    production: <ProductionPage navigate={navigate} notify={setToast} qcPassed={qcPassed} />,
    tasks: <TasksPage notify={setToast} />,
  } satisfies Record<PageId, ReactNode>;

  return (
    <AppShell
      page={page}
      onPageChange={navigate}
      scopeOpen={scopeOpen}
      setScopeOpen={setScopeOpen}
      notificationsOpen={notificationsOpen}
      setNotificationsOpen={setNotificationsOpen}
      helpOpen={helpOpen}
      setHelpOpen={setHelpOpen}
      userOpen={userOpen}
      setUserOpen={setUserOpen}
    >
      {content[page]}
      <Toast
        message={toast}
        tone={toast && ([copy.review.validation, copy.documents.lockedMessage, copy.redaction.blocked, copy.production.blocked] as readonly string[]).includes(toast) ? "danger" : "success"}
        onClose={() => setToast(null)}
      />
    </AppShell>
  );
}
