import * as XLSX from 'xlsx';
import { cleanNumericString, detectMonthYear, MONTH_RU } from './import.parser';

export interface ImportMetricReference {
  id: number;
  code: string;
  name: string;
  unit: string;
}

export interface ImportIssue {
  severity: 'warning' | 'error';
  message: string;
  field?: string;
  code?: string;
  cell?: string;
}

export interface ImportFormField {
  key: string;
  label: string;
  value: string | number | boolean | null;
  sourceCell: string;
}

export interface HistoricalFormData {
  sourceSheet: string;
  fields: ImportFormField[];
}

export interface HistoricalMetricRow {
  metricId?: number;
  code: string;
  metricName: string;
  unit: string;
  absoluteValue: number | null;
  computedPercent: number | null;
  rawValue: string;
  sourceValueCell: string;
  sourcePoints: number | null;
  sourcePointsCell: string;
  sourceFormula?: string;
  sourcePointsStrong: number;
  sourcePointsMedium: number;
  sourceThresholdStrong: number | null;
  sourceThresholdMedium: number | null;
  issue?: string;
}

export interface HistoricalPeriodPreview {
  selected: boolean;
  year?: number;
  month: number;
  revenue: number | null;
  drinksCount: number | null;
  sourceRating: number | null;
  sourceRatingCell: string;
  sourceMaxPoints: number;
  sourceSheet: string;
  rows: HistoricalMetricRow[];
  formData: HistoricalFormData | null;
  issues: ImportIssue[];
}

export interface HistoricalImportPreview {
  coffeeShopId: number;
  sourceFile: string;
  availableMetrics: ImportMetricReference[];
  periods: HistoricalPeriodPreview[];
  warnings: string[];
}

interface LegacyMetricDefinition {
  row: number;
  scoreRow: number;
  codes: string[];
  aliases: string[];
  pointsStrong: number;
  pointsMedium: number;
  revenueShare?: boolean;
  percent?: boolean;
  thresholds: (column: number, drinksCount: number | null) => { strong: number | null; medium: number | null };
}

const fixed = (strong: number, medium: number) => () => ({ strong, medium });

function performanceThresholds(column: number, drinksCount: number | null) {
  if (drinksCount == null) return { strong: null, medium: null };
  if (column <= 4) {
    if (drinksCount >= 13_000) return { strong: 11, medium: 8.5 };
    if (drinksCount >= 10_000) return { strong: 8.5, medium: 7.5 };
    if (drinksCount >= 7_000) return { strong: 7.5, medium: 6.2 };
    return { strong: 6.2, medium: 4 };
  }
  if (drinksCount >= 17_000) return { strong: 9.5, medium: 9 };
  if (drinksCount >= 16_000) return { strong: 9.25, medium: 8.75 };
  if (drinksCount >= 15_000) return { strong: 9, medium: 8.5 };
  if (drinksCount >= 14_000) return { strong: 8.8, medium: 8.3 };
  if (drinksCount >= 13_000) return { strong: 8.5, medium: 8 };
  if (drinksCount >= 12_000) return { strong: 8.2, medium: 7.7 };
  if (drinksCount >= 11_000) return { strong: 7.8, medium: 7.3 };
  if (drinksCount >= 10_000) return { strong: 7.5, medium: 7 };
  if (drinksCount >= 9_000) return { strong: 7.1, medium: 6.6 };
  if (drinksCount >= 8_000) return { strong: 6.6, medium: 6.2 };
  if (drinksCount >= 7_000) return { strong: 6.2, medium: 5.8 };
  return { strong: null, medium: null };
}

export const LEGACY_METRIC_ROWS: LegacyMetricDefinition[] = [
  { row: 2, scoreRow: 345, codes: ['ENPS'], aliases: ['enps', 'инпс'], pointsStrong: 13, pointsMedium: 6.5, percent: true, thresholds: fixed(95, 80) },
  { row: 3, scoreRow: 346, codes: ['REVIEW_SPEED'], aliases: ['средняя скорость разбора отзыва', 'скорость разбора отзыва'], pointsStrong: 13, pointsMedium: 6.5, thresholds: fixed(2, 3) },
  { row: 4, scoreRow: 347, codes: ['GUEST_EXP'], aliases: ['индекс гостевого опыта'], pointsStrong: 13, pointsMedium: 6.5, percent: true, thresholds: fixed(90, 75) },
  { row: 5, scoreRow: 348, codes: ['STANDARDS'], aliases: ['рейтинг стандартов'], pointsStrong: 13, pointsMedium: 6.5, percent: true, thresholds: fixed(90, 75) },
  { row: 6, scoreRow: 349, codes: ['PERFORMANCE'], aliases: ['производительность'], pointsStrong: 9.6, pointsMedium: 4.8, thresholds: performanceThresholds },
  { row: 7, scoreRow: 350, codes: ['LABOR_COST'], aliases: ['доля фот в выручке'], pointsStrong: 9.6, pointsMedium: 4.8, revenueShare: true, percent: true, thresholds: fixed(11, 16) },
  { row: 8, scoreRow: 351, codes: ['DESSERT_WRITEOFF'], aliases: ['доля списания десертов'], pointsStrong: 9.6, pointsMedium: 4.8, revenueShare: true, percent: true, thresholds: fixed(0.8, 1) },
  {
    row: 9,
    scoreRow: 352,
    codes: ['PRODUCT_WRITEOFF'],
    aliases: ['доля списания продуктов', 'доля списания топ-20 продуктов'],
    pointsStrong: 9.6,
    pointsMedium: 4.8,
    revenueShare: true,
    percent: true,
    thresholds: (column) => column <= 4 ? { strong: 0.6, medium: 1 } : { strong: 0.9, medium: 1.1 },
  },
  { row: 10, scoreRow: 353, codes: ['FREE_ACCESS', 'DEPOSIT'], aliases: ['доля депозита в выручке'], pointsStrong: 9.6, pointsMedium: 4.8, revenueShare: true, percent: true, thresholds: fixed(1.3, 1.5) },
];

export const FORM_FIELD_MAPPINGS = [
  ['happinessIndex', 'Индекс счастья', 'C5'],
  ['enps', 'eNPS', 'E5'],
  ['reviewRating', 'Отзывы', 'G5'],
  ['happinessAnalysis', 'Индекс счастья: анализ', 'B6'],
  ['reviewsAnalysis', 'Отзывы: анализ', 'F6'],
  ['guestExperience', 'Индекс гостевого опыта', 'D9'],
  ['standards', 'Рейтинг стандартов', 'G9'],
  ['guestExperienceAnalysis', 'Гостевой опыт: анализ', 'B10'],
  ['standardsAnalysis', 'Стандарты: анализ', 'F10'],
  ['giftReasonsUrl', 'Ссылка на причины подарков', 'H11'],
  ['giftsAmount', 'Подарки: сумма', 'D13'],
  ['giftsRevenueShare', 'Подарки: % от выручки', 'D14'],
  ['giftsAnalysis', 'Подарки: анализ', 'F13'],
  ['revenue', 'Выручка', 'D18'],
  ['laborAmount', 'ФОТ: зарплата', 'D19'],
  ['laborRevenueShare', 'ФОТ: % от выручки', 'D20'],
  ['performance', 'Производительность', 'D21'],
  ['laborAnalysis', 'ФОТ: анализ', 'F18'],
  ['personnelCostsAmount', 'Расходы на персонал: сумма', 'D24'],
  ['personnelCostsRevenueShare', 'Расходы на персонал: % от выручки', 'D25'],
  ['personnelCostsAnalysis', 'Расходы на персонал: анализ', 'F23'],
  ['freeAccessAmount', 'Свободный доступ: сумма', 'D31'],
  ['freeAccessRevenueShare', 'Свободный доступ: % от выручки', 'D32'],
  ['freeAccessAnalysis', 'Свободный доступ: анализ', 'F31'],
  ['dessertWriteoffAmount', 'Списание десертов: сумма', 'D40'],
  ['dessertWriteoffRevenueShare', 'Списание десертов: % от выручки', 'D41'],
  ['dessertWriteoffAnalysis', 'Списание десертов: анализ', 'F40'],
  ['productWriteoffAmount', 'Списание продуктов: сумма', 'D49'],
  ['productWriteoffRevenueShare', 'Списание продуктов: % от выручки', 'D50'],
  ['productWriteoffAnalysis', 'Списание продуктов: анализ', 'F49'],
  ['adminCostsAmount', 'Административные затраты: сумма', 'D58'],
  ['adminCostsRevenueShare', 'Административные затраты: % от выручки', 'D59'],
  ['adminCostsAnalysis', 'Административные затраты: анализ', 'F58'],
  ['rentAmount', 'Аренда: сумма', 'D62'],
  ['rentRevenueShare', 'Аренда: % от выручки', 'D63'],
  ['rentAnalysis', 'Аренда: анализ', 'F62'],
  ['equipmentAmount', 'Оборудование и ремонт: сумма', 'D66'],
  ['equipmentRevenueShare', 'Оборудование и ремонт: % от выручки', 'D67'],
  ['equipmentAnalysis', 'Оборудование и ремонт: анализ', 'F66'],
  ['equipmentPlanUrl', 'Ссылка на план оборудования и ремонта', 'H66'],
  ['summary', 'Итоги месяца', 'B70'],
] as const;

function normalize(value: string) {
  return value.toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/g, ' ').trim();
}

function cellRef(sheetName: string, address: string) {
  return `${sheetName}!${address}`;
}

function cellRaw(cell: XLSX.CellObject | undefined) {
  if (!cell || cell.v == null) return '';
  return cell.w != null ? String(cell.w) : String(cell.v);
}

function readNumber(
  sheet: XLSX.WorkSheet,
  sheetName: string,
  address: string,
  percent: boolean,
): { value: number | null; raw: string; issue?: ImportIssue } {
  const cell = sheet[address] as XLSX.CellObject | undefined;
  const raw = cellRaw(cell);
  if (!cell || cell.v == null || raw.trim() === '') return { value: null, raw };
  if (cell.t === 'e' || /^#(?:VALUE|REF|DIV\/0|N\/A|NAME|NUM|NULL)/i.test(raw)) {
    return {
      value: null,
      raw,
      issue: { severity: 'error', message: `Ошибка формулы или ячейки: ${raw}`, cell: cellRef(sheetName, address) },
    };
  }
  if (cell.t === 'n' && typeof cell.v === 'number' && Number.isFinite(cell.v)) {
    const formattedAsPercent = typeof cell.z === 'string' && cell.z.includes('%');
    return { value: percent && formattedAsPercent && Math.abs(cell.v) <= 1 ? cell.v * 100 : cell.v, raw };
  }
  const parsed = cleanNumericString(String(cell.v));
  if (parsed.value == null) {
    return {
      value: null,
      raw,
      issue: parsed.problem
        ? { severity: 'error', message: parsed.problem, cell: cellRef(sheetName, address) }
        : undefined,
    };
  }
  return {
    value: parsed.value,
    raw,
    issue: parsed.problem
      ? { severity: 'warning', message: parsed.problem, cell: cellRef(sheetName, address) }
      : undefined,
  };
}

function monthFromHeader(value: unknown) {
  const text = normalize(String(value ?? ''));
  const match = Object.entries(MONTH_RU).find(([name]) => text.includes(name));
  return match?.[1];
}

function inferMasterPeriods(sheet: XLSX.WorkSheet, sheetName: string) {
  const periods: Array<{ column: number; addressColumn: string; month: number; year?: number; issue?: ImportIssue }> = [];
  let currentYear: number | undefined;
  let previousMonth: number | undefined;
  for (let column = 2; column <= 16; column += 1) {
    const addressColumn = XLSX.utils.encode_col(column - 1);
    const headerCell = sheet[`${addressColumn}1`] as XLSX.CellObject | undefined;
    const header = headerCell?.v;
    const month = monthFromHeader(header);
    if (!month) continue;
    const yearMatch = String(header ?? '').match(/(20\d{2})/);
    if (yearMatch) currentYear = Number(yearMatch[1]);
    else if (previousMonth != null && month < previousMonth && currentYear != null) currentYear += 1;
    const issue = currentYear == null
      ? { severity: 'error' as const, field: 'year', message: 'Не удалось определить год столбца', cell: cellRef(sheetName, `${addressColumn}1`) }
      : undefined;
    periods.push({ column, addressColumn, month, year: currentYear, issue });
    previousMonth = month;
  }
  return periods;
}

function detectReportPeriod(sheetName: string) {
  const detected = detectMonthYear(sheetName);
  if (detected.month && !detected.year) {
    const shortYear = normalize(sheetName).match(/(?:^|\s)(\d{2})(?:\s|$)/);
    if (shortYear) detected.year = 2000 + Number(shortYear[1]);
  }
  return detected;
}

function extractFormData(sheet: XLSX.WorkSheet, sheetName: string): HistoricalFormData {
  return {
    sourceSheet: sheetName,
    fields: FORM_FIELD_MAPPINGS.map(([key, label, address]) => {
      const cell = sheet[address] as XLSX.CellObject | undefined;
      const value = cell?.v;
      return {
        key,
        label,
        value: value == null || typeof value === 'object' ? null : value as string | number | boolean,
        sourceCell: cellRef(sheetName, address),
      };
    }),
  };
}

function metricForDefinition(definition: LegacyMetricDefinition, metrics: ImportMetricReference[]) {
  const byCode = metrics.find((metric) => definition.codes.includes(metric.code.toLocaleUpperCase('ru-RU')));
  if (byCode) return byCode;
  return metrics.find((metric) => {
    const metricName = normalize(metric.name);
    return definition.aliases.some((alias) => metricName.includes(normalize(alias)));
  });
}

export function buildHistoricalPreview(
  workbook: XLSX.WorkBook,
  metrics: ImportMetricReference[],
  sourceFile: string,
): HistoricalImportPreview {
  const sourceSheetName = workbook.SheetNames.find((name) => normalize(name) === 'метрики');
  if (!sourceSheetName) throw new Error('В книге нет листа «Метрики»');
  const sourceSheet = workbook.Sheets[sourceSheetName];
  const reportSheets = new Map<string, { name: string; sheet: XLSX.WorkSheet }>();
  for (const name of workbook.SheetNames) {
    if (name === sourceSheetName || normalize(name).includes('шаблон')) continue;
    const detected = detectReportPeriod(name);
    if (detected.year && detected.month) reportSheets.set(`${detected.year}-${detected.month}`, { name, sheet: workbook.Sheets[name] });
  }

  const warnings = [
    'Источник использует историческую схему 4×13 + 5×9,6 без REVIEW_RATING; рейтинг сохраняется как в файле и не пересчитывается по текущей конфигурации.',
  ];
  const reviewRating = metrics.find((metric) => metric.code === 'REVIEW_RATING');
  if (reviewRating) warnings.push(`Текущая метрика ${reviewRating.code} отсутствует в историческом шаблоне и не получает критическую зону.`);

  const periods = inferMasterPeriods(sourceSheet, sourceSheetName).map((period): HistoricalPeriodPreview => {
    const issues: ImportIssue[] = period.issue ? [period.issue] : [];
    const drinksAddress = `${period.addressColumn}11`;
    const drinks = readNumber(sourceSheet, sourceSheetName, drinksAddress, false);
    if (drinks.issue) issues.push({ ...drinks.issue, field: 'drinksCount' });
    const reportSheet = period.year ? reportSheets.get(`${period.year}-${period.month}`) : undefined;
    const formData = reportSheet ? extractFormData(reportSheet.sheet, reportSheet.name) : null;
    const revenue = reportSheet ? readNumber(reportSheet.sheet, reportSheet.name, 'D18', false) : { value: null, raw: '' };
    if (revenue.issue) issues.push({ ...revenue.issue, field: 'revenue' });
    if (revenue.value == null) {
      issues.push({
        severity: 'error',
        field: 'revenue',
        message: 'В листе отчёта нет выручки за период; укажите её вручную или исключите период.',
        cell: reportSheet ? cellRef(reportSheet.name, 'D18') : undefined,
      });
    }

    const rows = LEGACY_METRIC_ROWS.map((definition): HistoricalMetricRow => {
      const sourceAddress = `${period.addressColumn}${definition.row}`;
      const sourcePointsAddress = `${period.addressColumn}${definition.scoreRow}`;
      const parsedValue = readNumber(sourceSheet, sourceSheetName, sourceAddress, Boolean(definition.percent));
      const parsedPoints = readNumber(sourceSheet, sourceSheetName, sourcePointsAddress, false);
      const metric = metricForDefinition(definition, metrics);
      if (parsedValue.issue) issues.push({ ...parsedValue.issue, field: 'metricValue', code: definition.codes[0] });
      if (parsedPoints.issue) issues.push({ ...parsedPoints.issue, field: 'sourcePoints', code: definition.codes[0] });
      if (!metric) {
        issues.push({
          severity: 'error',
          field: 'metricId',
          code: definition.codes[0],
          message: `Метрика ${definition.codes.join('/')} не найдена в конфигурации; выберите соответствие вручную.`,
          cell: cellRef(sourceSheetName, `A${definition.row}`),
        });
      }
      const sourceCell = sourceSheet[sourcePointsAddress] as XLSX.CellObject | undefined;
      const thresholds = definition.thresholds(period.column, drinks.value);
      let absoluteValue = definition.revenueShare ? null : parsedValue.value;
      const computedPercent = definition.revenueShare ? parsedValue.value : null;
      if (reportSheet) {
        const amountAddress = definition.codes[0] === 'LABOR_COST'
          ? 'D19'
          : definition.codes[0] === 'DESSERT_WRITEOFF'
            ? 'D40'
            : definition.codes[0] === 'PRODUCT_WRITEOFF'
              ? 'D49'
              : undefined;
        if (amountAddress) {
          const amount = readNumber(reportSheet.sheet, reportSheet.name, amountAddress, false);
          if (amount.issue) issues.push({ ...amount.issue, field: 'absoluteValue', code: definition.codes[0] });
          if (amount.value != null) absoluteValue = amount.value;
        }
      }
      return {
        metricId: metric?.id,
        code: metric?.code ?? definition.codes[0],
        metricName: metric?.name ?? String((sourceSheet[`A${definition.row}`] as XLSX.CellObject | undefined)?.v ?? definition.aliases[0]),
        unit: metric?.unit ?? (definition.percent ? '%' : ''),
        absoluteValue,
        computedPercent,
        rawValue: parsedValue.raw,
        sourceValueCell: cellRef(sourceSheetName, sourceAddress),
        sourcePoints: parsedPoints.value,
        sourcePointsCell: cellRef(sourceSheetName, sourcePointsAddress),
        sourceFormula: sourceCell?.f,
        sourcePointsStrong: definition.pointsStrong,
        sourcePointsMedium: definition.pointsMedium,
        sourceThresholdStrong: thresholds.strong,
        sourceThresholdMedium: thresholds.medium,
        issue: parsedValue.issue?.message ?? parsedPoints.issue?.message,
      };
    });

    const ratingAddress = `${period.addressColumn}354`;
    const rating = readNumber(sourceSheet, sourceSheetName, ratingAddress, false);
    if (rating.issue) issues.push({ ...rating.issue, field: 'sourceRating' });
    const hasMetricData = rows.some((row) => row.absoluteValue != null || row.computedPercent != null);
    if (hasMetricData && rating.value == null && !rating.issue) {
      issues.push({
        severity: 'error',
        field: 'sourceRating',
        message: 'В исходной книге нет рассчитанного итогового рейтинга за период.',
        cell: cellRef(sourceSheetName, ratingAddress),
      });
    }
    const selected = hasMetricData && !issues.some((issue) => issue.severity === 'error');
    return {
      selected,
      year: period.year,
      month: period.month,
      revenue: revenue.value,
      drinksCount: drinks.value == null ? null : Math.round(drinks.value),
      sourceRating: rating.value,
      sourceRatingCell: cellRef(sourceSheetName, ratingAddress),
      sourceMaxPoints: 100,
      sourceSheet: sourceSheetName,
      rows,
      formData,
      issues,
    };
  });

  return { coffeeShopId: 0, sourceFile, availableMetrics: metrics, periods, warnings };
}
