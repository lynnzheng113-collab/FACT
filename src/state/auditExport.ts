import { copy } from '../constants/copy';
import { detailsJSON, type AuditRecord } from './audit';

export const exportRows = (records: AuditRecord[]): string[][] => [
  [...copy.audit.exportHeaders],
  ...[...records].sort((a, b) => a.id.localeCompare(b.id)).map(r => [r.id, r.timestamp, r.workspaceName, r.objectName, r.action, r.objectType, String(r.executionTime), r.objectId, r.user, JSON.stringify(detailsJSON(r))]),
];
const encoder = new TextEncoder();
export function csvBytes(rows: string[][]): Uint8Array {
  // Quoting preserves commas and newlines; prefix potentially executable spreadsheet cells.
  return encoder.encode('\ufeff' + rows.map(row => row.map(v => `"${(/^[\s]*[=+@-]/.test(v) ? "'" + v : v).replaceAll('"', '""')}"`).join(',')).join('\r\n'));
}
const xml = (s: string) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const crc32 = (bytes: Uint8Array) => {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
};
const concat = (parts: Uint8Array[]) => { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let offset = 0; for (const p of parts) { out.set(p, offset); offset += p.length; } return out; };
function zip(files: Record<string, string>): Uint8Array {
  const local: Uint8Array[] = [], central: Uint8Array[] = []; let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const path = encoder.encode(name), bytes = encoder.encode(content), crc = crc32(bytes);
    const h = new Uint8Array(30 + path.length), v = new DataView(h.buffer);
    v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(12, 33, true);
    v.setUint32(14, crc, true); v.setUint32(18, bytes.length, true); v.setUint32(22, bytes.length, true); v.setUint16(26, path.length, true); h.set(path, 30);
    const c = new Uint8Array(46 + path.length), cv = new DataView(c.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(14, 33, true);
    cv.setUint32(16, crc, true); cv.setUint32(20, bytes.length, true); cv.setUint32(24, bytes.length, true); cv.setUint16(28, path.length, true); cv.setUint32(42, offset, true); c.set(path, 46);
    local.push(h, bytes); central.push(c); offset += h.length + bytes.length;
  }
  const directory = concat(central), end = new Uint8Array(22), ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, central.length, true); ev.setUint16(10, central.length, true); ev.setUint32(12, directory.length, true); ev.setUint32(16, offset, true);
  return concat([...local, directory, end]);
}
export function xlsxBytes(rows: string[][]): Uint8Array {
  const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const sheet = `<worksheet xmlns="${ns}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="9" width="24" customWidth="1"/><col min="10" max="10" width="80" customWidth="1"/></cols><sheetData>${rows.map((row, i) => `<row r="${i + 1}">${row.map((s, j) => `<c r="${String.fromCharCode(65 + j)}${i + 1}" t="inlineStr"><is><t xml:space="preserve">${xml(s)}</t></is></c>`).join('')}</row>`).join('')}</sheetData><autoFilter ref="A1:J${rows.length}"/></worksheet>`;
  return zip({
    '[Content_Types].xml': '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    '_rels/.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml': `<workbook xmlns="${ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xml(copy.audit.sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    'xl/worksheets/sheet1.xml': sheet,
  });
}
export function downloadAudits(records: AuditRecord[], format: string): void {
  const rows = exportRows(records), isCSV = format === 'CSV';
  const data = isCSV ? csvBytes(rows) : xlsxBytes(rows);
  const blob = new Blob([new Uint8Array(data)], { type: isCSV ? 'text/csv;charset=utf-8' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = `${copy.audit.filePrefix}${Date.now()}.${isCSV ? 'csv' : 'xlsx'}`; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
