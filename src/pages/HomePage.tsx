import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, FileWarning, Sparkles } from "lucide-react";
import { copy, type PageId } from "../constants/copy";
import { Badge, Button, PageHeader, Panel } from "../components/UI";

const toneIcon = {
  success: CheckCircle2,
  info: Sparkles,
  warning: Clock3,
  danger: AlertTriangle,
  neutral: FileWarning,
} as const;

export function HomePage({ navigate }: { navigate: (page: PageId) => void }) {
  return (
    <div className="page page--home">
      <PageHeader title={copy.home.title} subtitle={copy.home.subtitle} ids={copy.home.ids} />

      <section className="recommendation-band">
        <div>
          <span>{copy.home.nextAction}</span>
          <strong>{copy.home.nextActionText}</strong>
        </div>
        <Button variant="primary" onClick={() => navigate("redaction")} icon={<ArrowRight size={17} />}>
          {copy.home.continueReview}
        </Button>
      </section>

      <div className="metric-grid">
        {copy.home.metrics.map((metric) => (
          <div className="metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.delta}</small>
          </div>
        ))}
      </div>

      <Panel title={copy.home.stagesTitle} className="workflow-panel">
        <div className="workflow-stages">
          {copy.home.stages.map((stage, index) => {
            const Icon = toneIcon[stage.tone];
            return (
              <button type="button" key={stage.label} onClick={() => navigate(stage.target)}>
                <span className={`workflow-stages__icon workflow-stages__icon--${stage.tone}`}>
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span>
                  <small>{stage.label}</small>
                  <strong>{stage.value}</strong>
                  <em>{stage.detail}</em>
                </span>
                {index < copy.home.stages.length - 1 && <ArrowRight className="workflow-stages__arrow" size={18} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="dashboard-grid">
        <Panel title={copy.home.activityTitle}>
          <div className="activity-list">
            {copy.home.activities.map((item) => (
              <div key={`${item.time}-${item.object}`}>
                <time>{item.time}</time>
                <span><strong>{item.actor}</strong>{item.action}<small>{item.object}</small></span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title={copy.home.attentionTitle}>
          <div className="attention-list">
            {copy.home.attention.map((item) => (
              <button type="button" key={item.title} onClick={() => navigate(item.target)}>
                <AlertTriangle size={18} aria-hidden="true" />
                <span><strong>{item.title}</strong><small>{item.detail}</small></span>
                <Badge tone="warning">{copy.common.view}</Badge>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
