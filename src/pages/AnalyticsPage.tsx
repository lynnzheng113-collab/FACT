import { useState } from "react";
import { AlertCircle, GitBranch, Languages, Network, Play, RefreshCw, Users } from "lucide-react";
import { copy } from "../constants/copy";
import { Badge, Button, PageHeader, Panel, Progress, Tabs } from "../components/UI";

export function AnalyticsPage({ notify }: { notify: (message: string) => void }) {
  const [tab, setTab] = useState<string>(copy.analytics.indexes);
  const [running, setRunning] = useState(false);

  const runIndex = () => {
    setRunning(true);
    notify(copy.analytics.runSuccess);
  };

  return (
    <div className="page">
      <PageHeader title={copy.analytics.title} subtitle={copy.analytics.subtitle} ids={copy.analytics.ids} />
      <Panel className="analytics-index">
        <Tabs items={[copy.analytics.indexes, copy.analytics.structured, copy.analytics.communication]} active={tab} onChange={setTab} />
        <div className="index-card">
          <div className="index-card__main">
            <span className="index-card__icon"><Network size={23} /></span>
            <div><div><h2>{copy.analytics.indexName}</h2><Badge tone={running ? "info" : "success"}>{running ? copy.analytics.running : copy.analytics.indexStatus}</Badge></div><strong>{copy.analytics.indexCoverage}</strong><small>{copy.analytics.indexUpdated}</small></div>
          </div>
          <div className="index-card__actions"><Button icon={<RefreshCw size={16} />} onClick={runIndex}>{copy.analytics.incremental}</Button><Button>{copy.analytics.rebuild}</Button></div>
        </div>
        {running && <div className="running-banner"><RefreshCw className="spin" size={18} /><span><strong>{copy.analytics.running}</strong><small>{copy.analytics.runningDetail}</small></span><Progress value={copy.analytics.runningProgress} tone="info" /></div>}
      </Panel>

      <Panel title={copy.analytics.analysisSets} actions={<Button variant="primary" icon={<Play size={16} />} onClick={() => notify(copy.toasts.generic)}>{copy.analytics.newAnalysis}</Button>} className="table-panel">
        <div className="table-scroll">
          <table><thead><tr>{copy.analytics.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{copy.analytics.rows.map((row) => <tr key={row.name}><td><strong>{row.name}</strong></td><td>{row.type}</td><td>{row.scope}</td><td><Badge tone={row.tone}>{row.status}</Badge></td><td>{row.result}</td><td>{row.updated}</td></tr>)}</tbody></table>
        </div>
      </Panel>

      <div className="analytics-grid">
        <Panel title={copy.analytics.threadTitle}>
          <div className="stat-list">
            {copy.analytics.threadStats.map((item, index) => { const icons = [GitBranch, Network, Users, Users]; const Icon = icons[index]; return <div key={item.label}><Icon size={18} /><span>{item.label}</span><strong>{item.value}</strong></div>; })}
          </div>
        </Panel>
        <Panel title={copy.analytics.languageTitle}>
          <div className="language-bars">
            {copy.analytics.languages.map((language) => <div key={language.label}><span>{language.label}</span><div><i style={{ width: `${language.value}%` }} /></div><strong>{language.count}</strong></div>)}
          </div>
        </Panel>
      </div>
      <div className="boundary-note"><AlertCircle size={18} /><span>{copy.analytics.boundary}</span></div>
    </div>
  );
}
