import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { copy } from "../constants/copy";
import { Badge, Button, PageHeader, Panel, Progress, Tabs } from "../components/UI";

export function TasksPage({ notify }: { notify: (message: string) => void }) {
  const [filter, setFilter] = useState<string>(copy.tasks.filters[0]);
  const [selected, setSelected] = useState(0);
  const rows = filter === copy.tasks.filters[0] ? copy.tasks.rows : copy.tasks.rows.filter((row) => row.status.includes(filter.split(" / ")[0]));
  const task = copy.tasks.rows[selected];

  return (
    <div className="page page--tasks">
      <PageHeader title={copy.tasks.title} subtitle={copy.tasks.subtitle} ids={copy.tasks.ids} actions={<Button icon={<RefreshCw size={16} />} onClick={() => notify(copy.toasts.generic)}>{copy.common.refresh}</Button>} />
      <Panel className="table-panel">
        <Tabs items={copy.tasks.filters} active={filter} onChange={setFilter} />
        <div className="table-scroll"><table><thead><tr>{copy.tasks.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row) => { const index = copy.tasks.rows.findIndex((item) => item.task === row.task); return <tr key={row.task} className={selected === index ? "is-selected" : ""} onClick={() => setSelected(index)}><td><strong>{row.task}</strong></td><td>{row.object}</td><td><Badge tone={row.tone}>{row.status}</Badge></td><td><Progress value={row.progress} tone={row.tone} /></td><td>{row.owner}</td><td>{row.started}</td><td>{row.duration}</td></tr>; })}</tbody></table></div>
      </Panel>
      <Panel title={copy.tasks.detailTitle} subtitle={task.object}>
        <div className="task-detail"><div><Badge tone={task.tone}>{task.status}</Badge><h3>{task.task}</h3><Progress value={task.progress} tone={task.tone} /></div><div className="task-log"><h3>{copy.tasks.logTitle}</h3>{copy.tasks.log.map((line) => <code key={line}>{line}</code>)}</div></div>
      </Panel>
    </div>
  );
}
