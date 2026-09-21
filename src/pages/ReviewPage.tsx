import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  History,
  Link2,
  Lock,
  Maximize2,
  RotateCw,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { copy } from "../constants/copy";
import { Badge, Button, CheckRow, Field, IconButton, PageHeader, Tabs } from "../components/UI";

export function ReviewPage({ notify }: { notify: (message: string) => void }) {
  const [activeDoc, setActiveDoc] = useState(0);
  const [viewerTab, setViewerTab] = useState<string>(copy.review.viewerTabs[0]);
  const [responsive, setResponsive] = useState<string>("");
  const [confidential, setConfidential] = useState<string>("");
  const [issues, setIssues] = useState<string[]>([copy.review.issueOptions[0]]);
  const [zoom, setZoom] = useState(100);
  const [relatedTab, setRelatedTab] = useState<string>(copy.review.family);

  const doc = copy.review.documentItems[activeDoc];

  const selectDoc = (index: number) => {
    if (copy.review.documentItems[index].locked) {
      notify(copy.documents.lockedMessage);
      return;
    }
    setActiveDoc(index);
    setResponsive("");
    setConfidential("");
  };

  const saveNext = () => {
    if (!responsive || !confidential) {
      notify(copy.review.validation);
      return;
    }
    notify(copy.review.saved);
    const next = Math.min(activeDoc + 1, copy.review.documentItems.length - 1);
    if (!copy.review.documentItems[next].locked) setActiveDoc(next);
    setResponsive("");
    setConfidential("");
  };

  return (
    <div className="page page--review">
      <PageHeader title={copy.review.title} subtitle={copy.review.subtitle} ids={copy.review.ids} />
      <div className="queue-strip">
        <span><strong>{copy.review.queue}</strong><Badge tone="success">{copy.review.queueStatus}</Badge></span>
        <span>{copy.review.queueProgress}</span>
        <Button>{copy.review.returnQueue}</Button>
      </div>

      <div className="review-workbench">
        <aside className="review-doc-rail">
          <h2>{copy.review.documentList}</h2>
          {copy.review.documentItems.map((item, index) => (
            <button type="button" key={item.id} className={activeDoc === index ? "is-active" : ""} onClick={() => selectDoc(index)}>
              <span className="review-doc-rail__icon">{item.locked ? <Lock size={16} /> : <FileText size={16} />}</span>
              <span><strong>{item.id}</strong><small>{item.label}</small><em>{item.state}</em></span>
            </button>
          ))}
        </aside>

        <section className="viewer">
          <div className="viewer__header">
            <div><h2>{copy.review.documentTitle}</h2><span>{copy.review.documentMeta}</span></div>
            <div className="viewer__pager">
              <IconButton label={copy.common.previous} onClick={() => activeDoc > 0 && selectDoc(activeDoc - 1)} disabled={activeDoc === 0}><ChevronLeft size={18} /></IconButton>
              <span>{doc.id}</span>
              <IconButton label={copy.common.nextItem} onClick={() => activeDoc < copy.review.documentItems.length - 1 && selectDoc(activeDoc + 1)} disabled={activeDoc === copy.review.documentItems.length - 1}><ChevronRight size={18} /></IconButton>
            </div>
          </div>
          <div className="viewer__tabs-row"><Tabs items={copy.review.viewerTabs} active={viewerTab} onChange={setViewerTab} /><div className="viewer__search"><Search size={15} /><input defaultValue={copy.review.findValue} aria-label={copy.review.findDocument} /><Badge tone="warning">{copy.review.hits}</Badge></div></div>
          <div className="viewer__toolbar">
            <IconButton label={copy.review.zoomOut} onClick={() => setZoom(Math.max(70, zoom - 10))}><ZoomOut size={17} /></IconButton>
            <span>{zoom}%</span>
            <IconButton label={copy.review.zoomIn} onClick={() => setZoom(Math.min(130, zoom + 10))}><ZoomIn size={17} /></IconButton>
            <IconButton label={copy.review.rotate}><RotateCw size={17} /></IconButton>
            <IconButton label={copy.review.fullScreen}><Maximize2 size={17} /></IconButton>
            <span className="viewer__page-count">{copy.review.pageCount}</span>
          </div>
          <div className="viewer__canvas">
            <article className="paper" style={{ transform: `scale(${zoom / 100})` }}>
              <header><span>{copy.review.paperConfidential}</span><h3>{copy.review.paperTitle}</h3><h4>{copy.review.paperSubtitle}</h4></header>
              <p>{copy.review.paperIntro}</p>
              <h5>{copy.review.paperSection}</h5>
              <p>{copy.review.paperBody}</p>
              <p className="paper__highlight">{copy.review.paperBody}</p>
              <footer>{copy.review.paperConfidential}</footer>
            </article>
          </div>
          <div className="related-drawer">
            <div className="related-drawer__title"><Link2 size={16} /><strong>{copy.review.related}</strong></div>
            <Tabs items={[copy.review.family, copy.review.emailThread, copy.review.nearDuplicate, copy.review.history]} active={relatedTab} onChange={setRelatedTab} />
            <div className="related-drawer__items"><span>{copy.documents.docs[0].id}</span><span>{copy.documents.docs[1].id}</span><Badge tone="info">{relatedTab}</Badge></div>
          </div>
        </section>

        <aside className="coding-panel">
          <div className="coding-panel__header"><h2>{copy.review.coding}</h2><Button icon={<Copy size={15} />} onClick={() => notify(copy.toasts.copied)}>{copy.review.copyPrevious}</Button></div>
          <Field label={copy.review.responsiveness} required>
            <div className="choice-list">{copy.review.responsivenessOptions.map((option) => <label key={option}><input type="radio" name="responsive" checked={responsive === option} onChange={() => setResponsive(option)} /><span>{option}</span></label>)}</div>
          </Field>
          <Field label={copy.review.confidentiality} required>
            <div className="choice-list">{copy.review.confidentialityOptions.map((option) => <label key={option}><input type="radio" name="confidential" checked={confidential === option} onChange={() => setConfidential(option)} /><span>{option}</span></label>)}</div>
          </Field>
          <Field label={copy.review.issueTags}>
            <div className="check-list">{copy.review.issueOptions.map((option) => <CheckRow key={option} label={option} checked={issues.includes(option)} onChange={() => setIssues(issues.includes(option) ? issues.filter((item) => item !== option) : [...issues, option])} />)}</div>
          </Field>
          <Field label={copy.review.notes}><textarea placeholder={copy.review.notesPlaceholder} /></Field>
          <div className="coding-panel__footer"><Button onClick={() => notify(copy.common.save)}>{copy.common.save}</Button><Button variant="primary" onClick={saveNext}>{copy.common.saveNext}</Button></div>
        </aside>
      </div>
    </div>
  );
}
