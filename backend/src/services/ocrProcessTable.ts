import { Process, validateProcesses } from '@cpu-vis/shared';

interface OcrWord {
  WordText: string;
  Left: number;
  Top: number;
  Height: number;
  Width: number;
}

interface OcrLine {
  LineText: string;
  Words: OcrWord[];
  MaxHeight: number;
  MinTop: number;
}

interface ParsedResult {
  ParsedText?: string;
  TextOverlay?: {
    Lines?: OcrLine[];
  };
}

export interface OcrSpaceResponse {
  ParsedResults?: ParsedResult[];
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | string[];
  ErrorDetails?: string;
}

export interface ParsedProcessTable {
  processes: Process[];
  warnings: string[];
}

type ProcessField =
  | 'pid'
  | 'arrival'
  | 'burst'
  | 'priority'
  | 'tickets'
  | 'shareGroup'
  | 'shareWeight'
  | 'deadline'
  | 'period';

interface HeaderCell {
  field: ProcessField;
  left: number;
  right: number;
  center: number;
}

type RawFieldMap = Partial<Record<ProcessField, string>>;

const HEADER_ALIASES: Record<ProcessField, string[]> = {
  pid: ['pid', 'process', 'processid', 'processname', 'id'],
  arrival: ['arrival', 'arrivaltime', 'at'],
  burst: ['burst', 'bursttime', 'bt', 'service', 'servicetime', 'cpuburst'],
  priority: ['priority', 'prio', 'pri'],
  tickets: ['tickets', 'ticket'],
  shareGroup: ['sharegroup', 'group', 'sharegrp'],
  shareWeight: ['shareweight', 'weight', 'sharewt'],
  deadline: ['deadline', 'ddl'],
  period: ['period', 'per'],
};

const PROCESS_FIELDS = Object.keys(HEADER_ALIASES) as ProcessField[];

const DEFAULT_SHARE_GROUP = 'default';

const normalizeToken = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const isRecognizedHeader = (value: string): ProcessField | undefined => {
  const normalized = normalizeToken(value);
  return PROCESS_FIELDS.find((field) => HEADER_ALIASES[field].includes(normalized));
};

const normalizeWords = (words: OcrWord[] | undefined): OcrWord[] =>
  (words ?? []).filter(
    (word): word is OcrWord =>
      Boolean(word) &&
      typeof word.WordText === 'string' &&
      typeof word.Left === 'number' &&
      typeof word.Width === 'number'
  );

const mergeHeaderWords = (words: OcrWord[]): HeaderCell[] => {
  const sorted = normalizeWords(words).sort((a, b) => a.Left - b.Left);
  const headers: HeaderCell[] = [];

  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index];
    const next = sorted[index + 1];
    const combinedField = next
      ? isRecognizedHeader(`${current.WordText}${next.WordText}`)
      : undefined;

    if (combinedField) {
      headers.push({
        field: combinedField,
        left: current.Left,
        right: next.Left + next.Width,
        center: (current.Left + next.Left + next.Width) / 2,
      });
      index += 1;
      continue;
    }

    const singleField = isRecognizedHeader(current.WordText);
    if (singleField) {
      headers.push({
        field: singleField,
        left: current.Left,
        right: current.Left + current.Width,
        center: current.Left + current.Width / 2,
      });
    }
  }

  return headers
    .filter(
      (header, index, allHeaders) =>
        allHeaders.findIndex((candidate) => candidate.field === header.field) === index
    )
    .sort((a, b) => a.center - b.center);
};

const findHeaderLine = (lines: OcrLine[]): { index: number; headers: HeaderCell[] } | null => {
  for (let index = 0; index < lines.length; index += 1) {
    const headers = mergeHeaderWords(lines[index].Words ?? []);
    const headerFields = new Set(headers.map((header) => header.field));

    if (headerFields.has('arrival') && headerFields.has('burst') && headerFields.size >= 3) {
      return { index, headers };
    }
  }

  return null;
};

const splitLine = (line: string): string[] =>
  line
    .split(/\s{2,}|,|\||\t/)
    .map((segment) => segment.trim())
    .filter(Boolean);

const findHeaderColumnsFromText = (
  lines: string[]
): { index: number; headers: ProcessField[] } | null => {
  for (let index = 0; index < lines.length; index += 1) {
    const tokens = splitLine(lines[index]);
    const headers = tokens
      .map((token, tokenIndex) => {
        const next = tokens[tokenIndex + 1];
        const combined = next ? `${token}${next}` : token;
        const combinedField = isRecognizedHeader(combined);

        if (combinedField) {
          return combinedField;
        }

        return isRecognizedHeader(token);
      })
      .filter((field): field is ProcessField => Boolean(field));

    const headerFields = new Set(headers);
    if (headerFields.has('arrival') && headerFields.has('burst') && headerFields.size >= 3) {
      return { index, headers };
    }
  }

  return null;
};

const assignWordsToHeaders = (words: OcrWord[], headers: HeaderCell[]): RawFieldMap => {
  const sortedWords = normalizeWords(words).sort((a, b) => a.Left - b.Left);
  const boundaries = headers.map((header, index) => {
    const previous = headers[index - 1];
    const next = headers[index + 1];
    const headerWidth = Math.max(0, header.right - header.left);
    const previousGap = previous ? header.center - previous.center : 0;
    const nextGap = next ? next.center - header.center : 0;
    const leftPadding = previous ? previousGap / 2 : headerWidth;
    const rightPadding = next ? nextGap / 2 : Math.max(headerWidth, previousGap / 2);

    return {
      field: header.field,
      min: Math.max(0, header.left - leftPadding),
      max: header.right + rightPadding,
    };
  });

  const fieldValues = new Map<ProcessField, string[]>();

  for (const word of sortedWords) {
    const center = word.Left + word.Width / 2;
    const boundary = boundaries.find(
      (candidate) => center >= candidate.min && center < candidate.max
    );

    if (!boundary) {
      continue;
    }

    const values = fieldValues.get(boundary.field) ?? [];
    values.push(word.WordText);
    fieldValues.set(boundary.field, values);
  }

  return Object.fromEntries(
    Array.from(fieldValues.entries()).map(([field, values]) => [field, values.join(' ').trim()])
  ) as RawFieldMap;
};

const parseInteger = (value: string | undefined): number | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value
    .replace(/[Oo]/g, '0')
    .replace(/[Il]/g, '1')
    .replace(/[^0-9-]/g, '');

  if (!normalized) {
    return undefined;
  }

  const parsed = Number.parseInt(normalized, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const sanitizePid = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  const cleaned = value.replace(/[^a-zA-Z0-9_-]/g, '');
  return cleaned || undefined;
};

const buildProcessFromRow = (
  row: RawFieldMap,
  rowIndex: number,
  warnings: string[],
  usedPids: Set<string>
): Process | null => {
  const arrival = parseInteger(row.arrival);
  const burst = parseInteger(row.burst);

  if (arrival === undefined || arrival < 0 || burst === undefined || burst <= 0) {
    warnings.push(`Skipped OCR row ${rowIndex + 1}: missing valid arrival/burst values.`);
    return null;
  }

  let pid = sanitizePid(row.pid) ?? `P${rowIndex + 1}`;
  if (usedPids.has(pid)) {
    const fallbackPid = `P${rowIndex + 1}`;
    warnings.push(`Row ${rowIndex + 1}: duplicate PID "${pid}" replaced with "${fallbackPid}".`);
    pid = fallbackPid;
  }
  usedPids.add(pid);

  const priority = parseInteger(row.priority) ?? 1;
  const tickets = parseInteger(row.tickets) ?? 1;
  const shareWeight = parseInteger(row.shareWeight) ?? 1;
  const shareGroup = row.shareGroup?.trim() || DEFAULT_SHARE_GROUP;

  const defaultDeadline = arrival + burst;
  const deadline = parseInteger(row.deadline) ?? defaultDeadline;
  const period = parseInteger(row.period) ?? burst;

  if (!row.tickets) {
    warnings.push(`Row ${rowIndex + 1}: missing tickets, defaulted to 1.`);
  }
  if (!row.shareGroup) {
    warnings.push(
      `Row ${rowIndex + 1}: missing share group, defaulted to "${DEFAULT_SHARE_GROUP}".`
    );
  }
  if (!row.shareWeight) {
    warnings.push(`Row ${rowIndex + 1}: missing share weight, defaulted to 1.`);
  }
  if (!row.deadline) {
    warnings.push(`Row ${rowIndex + 1}: missing deadline, defaulted to arrival + burst.`);
  }
  if (!row.period) {
    warnings.push(`Row ${rowIndex + 1}: missing period, defaulted to burst.`);
  }

  return {
    pid,
    arrival,
    burst,
    priority,
    tickets,
    shareGroup,
    shareWeight,
    deadline: deadline < arrival ? defaultDeadline : deadline,
    period: period <= 0 ? burst : period,
  };
};

const parseOverlayRows = (lines: OcrLine[]): ParsedProcessTable | null => {
  const headerLine = findHeaderLine(lines);
  if (!headerLine) {
    return null;
  }

  const warnings: string[] = [];
  const usedPids = new Set<string>();
  const processes: Process[] = [];

  for (let index = headerLine.index + 1; index < lines.length; index += 1) {
    const line = lines[index];
    const headerCount = mergeHeaderWords(line.Words ?? []).length;
    if (headerCount >= 2) {
      continue;
    }

    const row = assignWordsToHeaders(line.Words ?? [], headerLine.headers);
    if (Object.keys(row).length === 0) {
      continue;
    }

    const process = buildProcessFromRow(row, processes.length, warnings, usedPids);
    if (process) {
      processes.push(process);
    }
  }

  return { processes, warnings };
};

const parseTextRows = (parsedText: string): ParsedProcessTable => {
  const warnings: string[] = [];
  const usedPids = new Set<string>();
  const lines = parsedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const headerLine = findHeaderColumnsFromText(lines);
  if (!headerLine) {
    return {
      processes: [],
      warnings: ['OCR could not detect a recognizable process-table header row.'],
    };
  }

  const processes: Process[] = [];
  const headerTokens = splitLine(lines[headerLine.index]);
  const headers: ProcessField[] = [];

  for (let index = 0; index < headerTokens.length; index += 1) {
    const current = headerTokens[index];
    const next = headerTokens[index + 1];
    const combinedField = next ? isRecognizedHeader(`${current}${next}`) : undefined;

    if (combinedField) {
      headers.push(combinedField);
      index += 1;
      continue;
    }

    const field = isRecognizedHeader(current);
    if (field) {
      headers.push(field);
    }
  }

  for (let index = headerLine.index + 1; index < lines.length; index += 1) {
    const values = splitLine(lines[index]);
    if (values.length === 0) {
      continue;
    }

    const row: RawFieldMap = {};
    headers.forEach((field, fieldIndex) => {
      row[field] = values[fieldIndex];
    });

    const process = buildProcessFromRow(row, processes.length, warnings, usedPids);
    if (process) {
      processes.push(process);
    }
  }

  return { processes, warnings };
};

export const parseProcessTableFromOcr = (response: OcrSpaceResponse): ParsedProcessTable => {
  const overlayLines =
    response.ParsedResults?.flatMap((result) => result.TextOverlay?.Lines ?? []).sort(
      (left, right) => left.MinTop - right.MinTop
    ) ?? [];

  const overlayResult = overlayLines.length > 0 ? parseOverlayRows(overlayLines) : null;
  if (overlayResult && overlayResult.processes.length > 0) {
    const validation = validateProcesses(overlayResult.processes);
    if (validation.valid) {
      return overlayResult;
    }
  }

  const parsedText =
    response.ParsedResults?.map((result) => result.ParsedText ?? '').join('\n') ?? '';
  const textResult = parseTextRows(parsedText);
  const validation = validateProcesses(textResult.processes);

  if (!validation.valid && textResult.processes.length > 0) {
    return {
      processes: [],
      warnings: [...textResult.warnings, validation.error ?? 'OCR produced invalid process data.'],
    };
  }

  return textResult;
};
