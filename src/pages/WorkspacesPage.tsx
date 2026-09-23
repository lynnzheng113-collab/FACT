import { useMemo, useState } from "react";
import { Building2, BriefcaseBusiness, ChevronRight, FolderKanban, Pin, PinOff, Plus, ShieldCheck } from "lucide-react";
import { copy } from "../constants/copy";
import { Badge, Button, Field, Modal, PageHeader, Panel } from "../components/UI";

type TabId = "clients" | "matters" | "workspaces";
type ClientRecord = { id: string; name: string; number: string; status: string; domain: string };
type MatterRecord = { id: string; name: string; number: string; clientId: string; clientName: string; clientNumber: string; status: string; keywords: string; notes: string };
type WorkspaceRecord = { id: string; name: string; matterId: string; matterName: string; clientName: string; artifactId: string; template: string; status: string; pinned: boolean };
type ClientFormValue = { name: string; number: string; status: string };
type MatterFormValue = { name: string; number: string; status: string; clientId: string; keywords: string; notes: string };

const IconByTab = { clients: Building2, matters: BriefcaseBusiness, workspaces: FolderKanban } as const;

export function WorkspacesPage({ notify, navigateHome }: { notify: (message: string) => void; navigateHome: () => void }) {
  const text = copy.workspaceManagement;
  const [tab, setTab] = useState<TabId>("workspaces");
  const [clients, setClients] = useState<ClientRecord[]>(() => text.clients.map((item) => ({ ...item })));
  const [matters, setMatters] = useState<MatterRecord[]>(() => text.matters.map((item) => ({ ...item })));
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>(() => text.workspaces.map((item) => ({ ...item })));
  const [selectedId, setSelectedId] = useState<string>(text.workspaces[1].id);
  const [createOpen, setCreateOpen] = useState(false);
  const [validation, setValidation] = useState(false);
  const [clientForm, setClientForm] = useState<ClientFormValue>({ name: "", number: "", status: text.active });
  const [matterForm, setMatterForm] = useState<MatterFormValue>({ name: "", number: "", status: text.active, clientId: "", keywords: "", notes: "" });
  const [workspaceForm, setWorkspaceForm] = useState({ name: "", matterId: "", template: "" });

  const selectedClient = clients.find((item) => item.id === selectedId);
  const selectedMatter = matters.find((item) => item.id === selectedId);
  const selectedWorkspace = workspaces.find((item) => item.id === selectedId);
  const formMatter = matters.find((item) => item.id === workspaceForm.matterId);
  const sortedWorkspaces = useMemo(() => [...workspaces].sort((a, b) => Number(b.pinned) - Number(a.pinned)), [workspaces]);

  const openCreate = () => {
    setValidation(false);
    setCreateOpen(true);
  };

  const selectTab = (next: TabId) => {
    setTab(next);
    setSelectedId("");
    setValidation(false);
  };

  const saveClient = () => {
    if (!clientForm.name.trim() || !clientForm.number.trim()) return setValidation(true);
    const record: ClientRecord = { id: `client-${Date.now()}`, name: clientForm.name.trim(), number: clientForm.number.trim(), status: clientForm.status, domain: text.nonClientDomain };
    setClients((items) => [...items, record]);
    setSelectedId(record.id);
    setClientForm({ name: "", number: "", status: text.active });
    setCreateOpen(false);
    notify(text.clientCreated);
  };

  const saveMatter = () => {
    const client = clients.find((item) => item.id === matterForm.clientId);
    if (!matterForm.name.trim() || !matterForm.number.trim() || !client) return setValidation(true);
    const record: MatterRecord = { id: `matter-${Date.now()}`, name: matterForm.name.trim(), number: matterForm.number.trim(), clientId: client.id, clientName: client.name, clientNumber: client.number, status: matterForm.status, keywords: matterForm.keywords.trim(), notes: matterForm.notes.trim() };
    setMatters((items) => [...items, record]);
    setSelectedId(record.id);
    setMatterForm({ name: "", number: "", status: text.active, clientId: "", keywords: "", notes: "" });
    setCreateOpen(false);
    notify(text.matterCreated);
  };

  const saveWorkspace = () => {
    const matter = matters.find((item) => item.id === workspaceForm.matterId);
    if (!workspaceForm.name.trim() || !matter || !workspaceForm.template) return setValidation(true);
    const record: WorkspaceRecord = { id: `workspace-${Date.now()}`, name: workspaceForm.name.trim(), matterId: matter.id, matterName: matter.name, clientName: matter.clientName, artifactId: String(1388000 + workspaces.length), template: workspaceForm.template, status: text.active, pinned: false };
    setWorkspaces((items) => [...items, record]);
    setSelectedId(record.id);
    setWorkspaceForm({ name: "", matterId: "", template: "" });
    setCreateOpen(false);
    notify(text.workspaceCreated);
  };

  const togglePin = (id: string) => setWorkspaces((items) => items.map((item) => item.id === id ? { ...item, pinned: !item.pinned } : item));
  const Icon = IconByTab[tab];
  const actionLabel = tab === "clients" ? text.newClient : tab === "matters" ? text.newMatter : text.newWorkspace;

  return (
    <div className="page workspace-admin">
      <PageHeader
        title={text.title}
        subtitle={text.subtitle}
        ids={text.ids}
        actions={<Button variant="primary" icon={<Plus size={17} />} onClick={openCreate}>{actionLabel}</Button>}
      />

      <Panel className="object-hierarchy">
        <div className="object-hierarchy__flow">
          <span><Building2 size={18} /><strong>{text.hierarchyClient}</strong></span>
          <ChevronRight className="object-hierarchy__arrow" size={18} aria-hidden="true" />
          <span><BriefcaseBusiness size={18} /><strong>{text.hierarchyMatter}</strong></span>
          <ChevronRight className="object-hierarchy__arrow" size={18} aria-hidden="true" />
          <span><FolderKanban size={18} /><strong>{text.hierarchyWorkspace}</strong></span>
        </div>
        <p>{text.hierarchyDescription}</p>
      </Panel>

      <div className="entity-tabs" role="tablist">
        {text.tabs.map((item) => {
          const TabIcon = IconByTab[item.id as TabId];
          const count = item.id === "clients" ? clients.length : item.id === "matters" ? matters.length : workspaces.length;
          return (
            <button type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "is-active" : ""} key={item.id} onClick={() => selectTab(item.id as TabId)}>
              <TabIcon size={18} /><span>{item.label}</span><Badge tone={tab === item.id ? "info" : "neutral"}>{String(count)}</Badge>
            </button>
          );
        })}
      </div>

      {tab === "workspaces" && (
        <section className="favorite-tip">
          <Pin size={18} aria-hidden="true" />
          <span><strong>{text.pinTitle}</strong><small>{text.pinDescription}</small></span>
        </section>
      )}

      <Panel
        className="table-panel entity-list"
        title={tab === "clients" ? text.allClients : tab === "matters" ? text.allMatters : text.allWorkspaces}
        actions={<Button variant="secondary" icon={<Plus size={16} />} onClick={openCreate}>{actionLabel}</Button>}
      >
        <div className="table-scroll">
          {tab === "clients" && (
            <table>
              <thead><tr>{text.columns.clients.map((column) => <th key={column}>{column}</th>)}</tr></thead>
              <tbody>{clients.map((client) => (
                <tr key={client.id} className={selectedId === client.id ? "is-selected" : ""} onClick={() => setSelectedId(client.id)}>
                  <td><button type="button" className="table-link" onClick={() => setSelectedId(client.id)}>{client.name}</button></td>
                  <td>{client.number}</td><td><Badge tone="success">{client.status}</Badge></td><td>{client.domain}</td><td>{String(matters.filter((matter) => matter.clientId === client.id).length)}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
          {tab === "matters" && (
            <table>
              <thead><tr>{text.columns.matters.map((column) => <th key={column}>{column}</th>)}</tr></thead>
              <tbody>{matters.map((matter) => (
                <tr key={matter.id} className={selectedId === matter.id ? "is-selected" : ""} onClick={() => setSelectedId(matter.id)}>
                  <td><button type="button" className="table-link" onClick={() => setSelectedId(matter.id)}>{matter.name}</button></td>
                  <td>{matter.number}</td><td>{matter.clientName}</td><td>{matter.clientNumber}</td><td><Badge tone="success">{matter.status}</Badge></td>
                </tr>
              ))}</tbody>
            </table>
          )}
          {tab === "workspaces" && (
            <table>
              <thead><tr>{text.columns.workspaces.map((column) => <th key={column}>{column}</th>)}</tr></thead>
              <tbody>{sortedWorkspaces.map((workspace) => (
                <tr key={workspace.id} className={selectedId === workspace.id ? "is-selected" : ""} onClick={() => setSelectedId(workspace.id)}>
                  <td><button type="button" className="pin-button" aria-label={workspace.pinned ? text.unpin : text.pin} title={workspace.pinned ? text.unpin : text.pin} onClick={(event) => { event.stopPropagation(); togglePin(workspace.id); }}>{workspace.pinned ? <PinOff size={17} /> : <Pin size={17} />}</button></td>
                  <td><button type="button" className="table-link" onClick={() => setSelectedId(workspace.id)}>{workspace.name}</button></td>
                  <td>{workspace.artifactId}</td><td>{workspace.clientName}</td><td>{workspace.matterName}</td><td><Badge tone="success">{workspace.status}</Badge></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </Panel>

      <Panel
        title={text.details}
        className="entity-detail"
        actions={selectedId ? <><Button variant="secondary" onClick={() => notify(text.permissionsDemo)}>{text.editPermissions}</Button><Button variant="quiet" onClick={() => notify(text.auditDemo)}>{text.viewAudit}</Button>{selectedWorkspace && <Button variant="primary" onClick={navigateHome}>{text.openWorkspace}</Button>}</> : undefined}
      >
        {!selectedId && <div className="empty-detail"><Icon size={24} /><span>{text.selectRecord}</span></div>}
        {selectedClient && <DetailGrid items={[[text.name, selectedClient.name], [text.clientNumber, selectedClient.number], [text.status, selectedClient.status], [text.clientDomainStatus, selectedClient.domain], [text.createdBy, text.history.actor], [text.createdOn, text.history.created]]} />}
        {selectedMatter && <DetailGrid items={[[text.name, selectedMatter.name], [text.matterNumber, selectedMatter.number], [text.status, selectedMatter.status], [text.client, selectedMatter.clientName], [text.keywords, selectedMatter.keywords || text.notProvided], [text.notes, selectedMatter.notes || text.notProvided], [text.lastModifiedBy, text.history.actor], [text.lastModifiedOn, text.history.modified]]} />}
        {selectedWorkspace && <DetailGrid items={[[text.name, selectedWorkspace.name], [text.status, selectedWorkspace.status], [text.client, selectedWorkspace.clientName], [text.matter, selectedWorkspace.matterName], [text.caseArtifactId, selectedWorkspace.artifactId], [text.templateWorkspace, selectedWorkspace.template], [text.lastModifiedBy, text.history.actor], [text.lastModifiedOn, text.history.modified]]} />}
      </Panel>

      <Modal open={createOpen} title={actionLabel} onClose={() => setCreateOpen(false)} wide footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>{copy.common.cancel}</Button><Button variant="primary" onClick={tab === "clients" ? saveClient : tab === "matters" ? saveMatter : saveWorkspace}>{copy.common.save}</Button></>}>
        {validation && <div className="form-alert"><ShieldCheck size={18} /><span>{text.requiredHint}</span></div>}
        {tab === "clients" && <ClientForm value={clientForm} setValue={setClientForm} />}
        {tab === "matters" && <MatterForm value={matterForm} setValue={setMatterForm} clients={clients} />}
        {tab === "workspaces" && <WorkspaceForm value={workspaceForm} setValue={setWorkspaceForm} matters={matters} clientName={formMatter?.clientName ?? ""} />}
      </Modal>
    </div>
  );
}

function DetailGrid({ items }: { items: Array<[string, string]> }) {
  return <dl className="detail-grid">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

function ClientForm({ value, setValue }: { value: ClientFormValue; setValue: (value: ClientFormValue) => void }) {
  const text = copy.workspaceManagement;
  return <div className="form-grid">
    <Field label={text.name} required><input value={value.name} placeholder={text.clientPlaceholder} onChange={(event) => setValue({ ...value, name: event.target.value })} /></Field>
    <Field label={text.clientNumber} required><input value={value.number} placeholder={text.clientNumberPlaceholder} onChange={(event) => setValue({ ...value, number: event.target.value })} /></Field>
    <Field label={text.status} required><select value={value.status} onChange={(event) => setValue({ ...value, status: event.target.value })}><option>{text.active}</option><option>{text.inactive}</option></select></Field>
    <Field label={text.clientDomainStatus}><input value={text.nonClientDomain} readOnly /></Field>
  </div>;
}

function MatterForm({ value, setValue, clients }: { value: MatterFormValue; setValue: (value: MatterFormValue) => void; clients: ClientRecord[] }) {
  const text = copy.workspaceManagement;
  return <div className="form-grid">
    <Field label={text.name} required><input value={value.name} placeholder={text.matterPlaceholder} onChange={(event) => setValue({ ...value, name: event.target.value })} /></Field>
    <Field label={text.matterNumber} required><input value={value.number} placeholder={text.matterNumberPlaceholder} onChange={(event) => setValue({ ...value, number: event.target.value })} /></Field>
    <Field label={text.status} required><select value={value.status} onChange={(event) => setValue({ ...value, status: event.target.value })}><option>{text.active}</option><option>{text.inactive}</option></select></Field>
    <Field label={text.client} required><select value={value.clientId} onChange={(event) => setValue({ ...value, clientId: event.target.value })}><option value="">{text.select}</option>{clients.map((client) => <option value={client.id} key={client.id}>{client.name} · {client.number}</option>)}</select></Field>
    <Field label={text.keywords}><input value={value.keywords} placeholder={text.keywordsPlaceholder} onChange={(event) => setValue({ ...value, keywords: event.target.value })} /></Field>
    <Field label={text.notes}><textarea value={value.notes} placeholder={text.notesPlaceholder} onChange={(event) => setValue({ ...value, notes: event.target.value })} /></Field>
  </div>;
}

function WorkspaceForm({ value, setValue, matters, clientName }: { value: { name: string; matterId: string; template: string }; setValue: (value: { name: string; matterId: string; template: string }) => void; matters: MatterRecord[]; clientName: string }) {
  const text = copy.workspaceManagement;
  return <div className="form-grid">
    <Field label={text.name} required><input value={value.name} placeholder={text.workspacePlaceholder} onChange={(event) => setValue({ ...value, name: event.target.value })} /></Field>
    <Field label={text.matter} required><select value={value.matterId} onChange={(event) => setValue({ ...value, matterId: event.target.value })}><option value="">{text.select}</option>{matters.map((matter) => <option value={matter.id} key={matter.id}>{matter.name}</option>)}</select></Field>
    <Field label={text.client}><input value={clientName} readOnly /></Field>
    <Field label={text.templateWorkspace} required><select value={value.template} onChange={(event) => setValue({ ...value, template: event.target.value })}><option value="">{text.select}</option>{text.templates.map((template) => <option value={template} key={template}>{template}</option>)}</select></Field>
  </div>;
}
