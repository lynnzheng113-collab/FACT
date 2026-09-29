import { useState } from "react";
import { copy } from "../constants/copy";
import { useAdministration } from "../state/Administration";
import { Button, CheckRow, Field, PageHeader, Panel, Tabs } from "../components/UI";
import { FieldsPage } from "./FieldsPage";

export function ReviewSetupPage({ notify }: { notify: (message: string) => void }) {
  const [tab, setTab] = useState<string>(copy.fieldManagement.title);
  const { highlights, setHighlights } = useAdministration();
  const [draft, setDraft] = useState(highlights);
  const t = copy.modules;
  return <div className="page"><PageHeader title={t.reviewSetup} subtitle={t.setupHint} ids={copy.fieldManagement.ids} priorities={[]} />
    <Tabs items={[copy.fieldManagement.title, t.highlights]} active={tab} onChange={setTab} />
    <div hidden={tab !== copy.fieldManagement.title}><FieldsPage notify={notify} /></div>
    {tab === t.highlights && <Panel title={t.highlights} subtitle={t.highlightHint}><form className="module-form" onSubmit={event => { event.preventDefault(); setHighlights({ ...draft, name: draft.name.trim(), terms: draft.terms.trim() }); notify(t.highlightSaved); }}>
      <Field label={t.highlightName} required><input aria-label={t.highlightName} required value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} /></Field>
      <Field label={t.terms} required><textarea aria-label={t.terms} required value={draft.terms} onChange={event => setDraft({ ...draft, terms: event.target.value })} /></Field>
      <CheckRow label={t.enabled} checked={draft.enabled} onChange={() => setDraft({ ...draft, enabled: !draft.enabled })} />
      <Button variant="primary" type="submit">{copy.common.save}</Button>
    </form></Panel>}
  </div>;
}
