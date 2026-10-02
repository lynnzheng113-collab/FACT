import { copy } from "../constants/copy";

export type ExportWorkflow = "production" | "search" | "folder" | "rdo";
export type ExportConfig = {
  workflow: ExportWorkflow; jobName: string; source: string; express: boolean;
  profile: "none" | "local"; profileName: string; location: "local" | "staging";
  addresses: string; folder: string; format: string; startLine: string; encoding: string;
  region: string; nested: boolean; fields: string[]; natives: boolean; images: boolean;
  imageFormat: string; fileType: string;
  namedAfter: "control" | "bates" | "custom"; namePrefix: "control" | "bates";
  nameSpacing: string; nameField: "custodian" | "title" | "custom"; customName: string;
  appendOriginal: boolean; groupBy: "type" | "workspace";
  textAsFiles: boolean; textEncoding: string; textFields: string[];
};
export type ExportJob = { id: string; config: ExportConfig; started: number; finishes: number; owner: string };
const t = copy.exportPage;
export function newExportConfig(): ExportConfig {
  return { workflow: "production", jobName: t.jobNameValue, source: "", express: true,
    profile: "none", profileName: "", location: "staging", addresses: "", folder: "",
    format: t.formats[1], startLine: t.defaults.startLine, encoding: t.encodings[0], region: t.regions[0],
    nested: false, fields: t.fields.slice(0, 5).map(field => field.id), natives: true, images: true,
    imageFormat: t.imageFormats[0], fileType: t.fileTypes[0],
    namedAfter: "control", namePrefix: "control", nameSpacing: t.naming.spacings[0].value,
    nameField: "custodian", customName: "", appendOriginal: false, groupBy: "type",
    textAsFiles: false, textEncoding: t.encodings[0], textFields: [t.textExport.fields[0].id] };
}
export type ExportStep = keyof typeof t.steps;
export function exportSteps(config: ExportConfig): ExportStep[] {
  return ["workflow", "settings", ...(config.location === "local" && config.express ? ["folder" as const] : []), "load", "fields", ...(config.workflow === "rdo" ? [] : ["files" as const, "naming" as const, "text" as const]), "summary"];
}
export function validExportFolder(value: string): boolean {
  const path = value.trim().replaceAll("/", "\\");
  if (/[<>"|?*\x00-\x1f]/.test(path)) return false;
  const drive = /^[A-Za-z]:\\/.test(path);
  const unc = /^\\\\[^\\]+\\[^\\]+/.test(path);
  if (!drive && !unc) return false;
  const parts = (drive ? path.slice(3) : path.slice(2)).split("\\");
  if (parts.at(-1) === "") parts.pop();
  return parts.every(part => part.length > 0 && !/:|[. ]$/.test(part) && !/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(part));
}
export function exportFilename(config: ExportConfig, text = false): string {
  const sample = t.naming.sample;
  const suffix = config.nameField === "custom" ? config.customName.trim() : sample[config.nameField];
  const base = config.namedAfter === "custom" ? sample[config.namePrefix] + config.nameSpacing + suffix : sample[config.namedAfter];
  return base + (config.appendOriginal ? "_" + sample.originalStem : "") + (text ? sample.textExtension : sample.extension);
}
export function exportRelativePath(config: ExportConfig, text = false): string {
  const sample = t.naming.sample;
  return (config.groupBy === "workspace" ? sample.workspaceFolder : text ? sample.textFolder : sample.nativeFolder) + "\\" + exportFilename(config, text);
}
export function validateExport(config: ExportConfig, step: ExportStep): string {
  if (step === "settings") {
    if (!config.jobName.trim() || !config.source) return t.errors.required;
    if (config.profile === "local" && !config.profileName) return t.errors.profile;
    if (config.addresses.trim() && config.addresses.split(/[,;\n]/).some(value => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))) return t.errors.email;
  }
  if (step === "folder" && !config.folder.trim()) return t.errors.folder;
  if (step === "folder" && !validExportFolder(config.folder)) return t.folderInvalid;
  if (step === "load" && (!/^[1-9]\d*$/.test(config.startLine) || !Number.isSafeInteger(Number(config.startLine)))) return t.errors.line;
  if (step === "fields" && !config.fields.length) return t.errors.fields;
  if (step === "files" && !config.natives && !config.images) return t.errors.files;
  if (step === "naming" && config.namedAfter === "custom" && config.nameField === "custom" && (!config.customName.trim() || /[<>:"/\\|?*\x00-\x1f]/.test(config.customName))) return t.naming.invalid;
  if (step === "text" && !config.textFields.length) return t.textExport.required;
  return "";
}
// Parse only the prototype JSON schema, never a real Relativity .ie profile.
export function readExportProfile(value: unknown): ExportConfig | null {
  if (!value || typeof value !== "object" || !("kind" in value) || value.kind !== "relativity-prototype-export" || !("config" in value)) return null;
  if (!("version" in value) || ![1, 2].includes(value.version as number)) return null;
  const raw = value.config;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const defaults = newExportConfig();
  // v0.10 profiles lack only these new fields. Do not fill missing old or v2 fields silently.
  const added: (keyof ExportConfig)[] = ["namedAfter", "namePrefix", "nameSpacing", "nameField", "customName", "appendOriginal", "groupBy", "textAsFiles", "textEncoding", "textFields"];
  const candidate = { ...(value.version === 1 ? Object.fromEntries(added.map(key => [key, defaults[key]])) : {}), ...raw };
  for (const key of Object.keys(defaults) as (keyof ExportConfig)[]) {
    if (!(key in candidate)) return null;
    const field = (candidate as Record<string, unknown>)[key];
    if (key === "fields" || key === "textFields") { const items = key === "fields" ? t.fields : t.textExport.fields; if (!Array.isArray(field) || field.some(id => !items.some(item => item.id === id)) || new Set(field).size !== field.length) return null; }
    else if (typeof field !== typeof defaults[key]) return null;
  }
  const config = candidate as ExportConfig;
  const includes = (items: readonly string[], item: string) => items.includes(item);
  if (!t.workflows.some(item => item.id === config.workflow) || !includes(["none", "local"], config.profile) || !includes(["local", "staging"], config.location)
    || !includes(t.formats, config.format) || !includes(t.encodings, config.encoding) || !includes(t.regions, config.region)
    || !includes(t.imageFormats, config.imageFormat) || !includes(t.fileTypes, config.fileType)
    || !includes(["control", "bates", "custom"], config.namedAfter) || !includes(["control", "bates"], config.namePrefix)
    || !includes(t.naming.spacings.map(item => item.value), config.nameSpacing) || !includes(["custodian", "title", "custom"], config.nameField)
    || !includes(["type", "workspace"], config.groupBy) || !includes(t.encodings, config.textEncoding)) return null;
  if (config.workflow !== "production" && (config.namedAfter === "bates" || config.namePrefix === "bates")) return null;
  return Object.fromEntries(Object.keys(defaults).map(key => [key, config[key as keyof ExportConfig]])) as ExportConfig;
}
