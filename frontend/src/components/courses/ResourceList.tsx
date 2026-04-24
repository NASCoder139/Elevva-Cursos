import { FileText, FileSpreadsheet, FileImage, FileAudio, FileArchive, File, Eye, Download, Presentation } from 'lucide-react';
import { getAccessToken } from '../../api/axios';
import { formatBytes } from '../../lib/formatters';
import type { Resource, ResourceType } from '../../types/course.types';

interface ResourceListProps {
  resources: Resource[];
  title?: string;
}

const iconFor = (type: ResourceType) => {
  switch (type) {
    case 'PDF':
    case 'DOC':
      return FileText;
    case 'SHEET':
      return FileSpreadsheet;
    case 'PPT':
      return Presentation;
    case 'IMAGE':
      return FileImage;
    case 'AUDIO':
      return FileAudio;
    case 'ARCHIVE':
      return FileArchive;
    default:
      return File;
  }
};

const colorFor = (type: ResourceType): string => {
  switch (type) {
    case 'PDF': return 'text-red-500';
    case 'DOC': return 'text-blue-500';
    case 'SHEET': return 'text-green-500';
    case 'PPT': return 'text-orange-500';
    case 'IMAGE': return 'text-purple-500';
    case 'AUDIO': return 'text-pink-500';
    case 'ARCHIVE': return 'text-yellow-500';
    default: return 'text-surface-400';
  }
};

const canPreviewInline = (type: ResourceType): boolean =>
  type === 'PDF' || type === 'IMAGE' || type === 'AUDIO';

export default function ResourceList({ resources, title = 'Material descargable' }: ResourceListProps) {
  if (!resources || resources.length === 0) return null;

  const token = getAccessToken();
  const urlFor = (r: Resource, download: boolean) => {
    const base = `/api/resources/${r.id}/${download ? 'download' : 'stream'}`;
    return token ? `${base}?t=${encodeURIComponent(token)}` : base;
  };

  return (
    <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 sm:p-6">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">
        {title} · {resources.length}
      </h3>
      <ul className="divide-y divide-surface-200 dark:divide-surface-800">
        {resources.map((r) => {
          const Icon = iconFor(r.type);
          const color = colorFor(r.type);
          const size = formatBytes(r.sizeBytes);
          const previewable = canPreviewInline(r.type);
          return (
            <li key={r.id} className="flex items-center gap-3 py-3">
              <Icon className={`h-6 w-6 shrink-0 ${color}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-100">{r.title}</p>
                <p className="truncate text-xs text-surface-500 dark:text-surface-400">
                  {r.fileName}
                  {size && <> · {size}</>}
                </p>
              </div>
              {previewable && (
                <a
                  href={urlFor(r, false)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded border border-surface-300 px-3 py-1.5 text-xs text-surface-700 transition hover:bg-surface-100 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800"
                  title="Ver en navegador"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Ver</span>
                </a>
              )}
              <a
                href={urlFor(r, true)}
                className="flex items-center gap-1 rounded bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-500"
                title="Descargar"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Descargar</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
