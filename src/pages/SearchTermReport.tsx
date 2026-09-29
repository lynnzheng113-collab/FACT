import { useState } from "react";
import { copy, type PageId } from "../constants/copy";
import { useAdministration } from "../state/Administration";
import { Button, Field } from "../components/UI";

export function SearchTermReport({ navigate }: { navigate: (page: PageId) => void }) {
  const [terms, setTerms] = useState<string>(copy.modules.reportTerms);
  const [results, setResults] = useState<string[]>([]);
  const { setDocumentView } = useAdministration();
  const t = copy.modules;
  return <div className="term-report"><p>{t.reportHint}</p>
    <Field label={t.terms}><textarea aria-label={t.terms} value={terms} onChange={event => setTerms(event.target.value)} /></Field>
    <Button variant="primary" onClick={() => setResults([...new Set(terms.split(/\r?\n/).map(term => term.trim()).filter(Boolean))])}>{copy.common.run}</Button>
    <div className="table-scroll"><table><thead><tr>{t.reportColumns.map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>
      {results.map(term => { const hits = copy.documents.docs.filter(doc => doc.file.toLowerCase().includes(term.toLowerCase())).length; return <tr key={term}><td>{term}</td><td>{hits}</td><td><Button disabled={!hits} onClick={() => { setDocumentView({ query: term, folder: 0, includeFamily: true, reportTerm: term }); navigate("documents"); }}>{copy.common.view}</Button></td></tr>; })}
      {!results.length && <tr><td colSpan={t.reportColumns.length}>{t.reportEmpty}</td></tr>}
    </tbody></table></div>
  </div>;
}
