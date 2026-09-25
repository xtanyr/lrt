import * as XLSX from 'xlsx';
import { buildHistoricalPreview } from '../../src/imports/import-layout';

const metrics = [
  { id: 1, code: 'ENPS', name: 'eNPS', unit: '%' },
  { id: 2, code: 'REVIEW_SPEED', name: 'Скорость разбора отзыва', unit: 'суток' },
  { id: 3, code: 'GUEST_EXP', name: 'Индекс гостевого опыта', unit: '%' },
  { id: 4, code: 'STANDARDS', name: 'Рейтинг стандартов', unit: '%' },
  { id: 5, code: 'PERFORMANCE', name: 'Производительность', unit: 'ед.' },
  { id: 6, code: 'LABOR_COST', name: 'Доля ФОТ в выручке', unit: '%' },
  { id: 7, code: 'DESSERT_WRITEOFF', name: 'Доля списания десертов', unit: '%' },
  { id: 8, code: 'PRODUCT_WRITEOFF', name: 'Доля списания продуктов', unit: '%' },
  { id: 9, code: 'FREE_ACCESS', name: 'Доля депозита в выручке', unit: '%' },
  { id: 10, code: 'REVIEW_RATING', name: 'Рейтинг отзывов за месяц', unit: 'балл' },
];

function fixture(options: { ratingError?: boolean } = {}) {
  const workbook = XLSX.utils.book_new();
  const rows: unknown[][] = [];
  rows[0] = ['КОФЕЙНЯ', 'декабрь 2025', 'январь'];
  rows[1] = ['eNPS, %', 95, 0.95];
  rows[2] = ['Средняя скорость разбора отзыва, суток', 2, 3];
  rows[3] = ['Индекс гостевого опыта, %', 90, 80];
  rows[4] = ['Рейтинг стандартов, %', 90, 80];
  rows[5] = ['Производительность, единиц.', 11, 8.5];
  rows[6] = ['Доля ФОТ в выручке, %', 11, 12];
  rows[7] = ['Доля списания десертов в выручке, %', 0.8, 0.9];
  rows[8] = ['Доля списания продуктов в выручке, %', 0.6, 1];
  rows[9] = ['Доля депозита в выручке, %', 1.3, 1.4];
  rows[10] = ['Количество проданных напитков за месяц (не метрика, собираем для расчетов)', 13000, 12000];
  rows[343] = ['БАЛЛЬНАЯ ОЦЕНКА'];
  for (let index = 0; index < 9; index += 1) rows[344 + index] = [rows[index + 1][0]];
  rows[353] = ['Итоговый рейтинг'];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet.C2.z = '0%';
  const decemberPoints = [13, 13, 13, 13, 9.6, 9.6, 9.6, 9.6, 9.6];
  const januaryPoints = [13, 6.5, 6.5, 6.5, 4.8, 4.8, 4.8, 4.8, 4.8];
  decemberPoints.forEach((value, index) => {
    sheet[`B${345 + index}`] = { t: 'n', f: '=LEGACY()', v: value };
    sheet[`C${345 + index}`] = { t: 'n', f: '=LEGACY()', v: value === 13 ? januaryPoints[index] : januaryPoints[index] };
  });
  sheet.B354 = { t: 'n', f: '=SUM(B345:B353)', v: 100 };
  sheet.C354 = options.ratingError
    ? { t: 'e', f: '=SUM(C345:C353)', v: 15, w: '#VALUE!' }
    : { t: 'n', f: '=SUM(C345:C353)', v: 49.3 };
  XLSX.utils.book_append_sheet(workbook, sheet, 'Метрики');

  const reportRows: unknown[][] = [];
  reportRows[0] = [];
  reportRows[1] = ['', 'КОМАНДА И ГОСТИ'];
  reportRows[17] = ['', 'выручка', '', 500000];
  reportRows[18] = ['', 'зп', '', 55000];
  reportRows[19] = ['', '% от выручки', '', 0.11];
  reportRows[20] = ['', 'производительность', '', 8.5];
  reportRows[69] = ['', 'Итоги месяца', 'Синтетический итог'];
  const reportSheet = XLSX.utils.aoa_to_sheet(reportRows);
  reportSheet.D20.z = '0%';
  XLSX.utils.book_append_sheet(workbook, reportSheet, 'январь 26');
  return workbook;
}

describe('buildHistoricalPreview', () => {
  it('maps the real master row/month layout, metric codes, form revenue and cell provenance', () => {
    const preview = buildHistoricalPreview(fixture(), metrics, 'synthetic-history.xlsx');

    expect(preview.periods).toHaveLength(2);
    expect(preview.periods[0]).toMatchObject({ year: 2025, month: 12, sourceRating: 100 });
    expect(preview.periods[1]).toMatchObject({ year: 2026, month: 1, revenue: 500000, sourceRating: 49.3 });
    expect(preview.periods[1].rows.find((row) => row.code === 'ENPS')).toMatchObject({
      metricId: 1,
      absoluteValue: 95,
      sourceValueCell: 'Метрики!C2',
      sourcePointsCell: 'Метрики!C345',
    });
    expect(preview.periods[1].rows.find((row) => row.code === 'LABOR_COST')).toMatchObject({
      metricId: 6,
      absoluteValue: 55000,
      computedPercent: 12,
      sourceValueCell: 'Метрики!C7',
    });
    expect(preview.periods[1].formData).toMatchObject({ sourceSheet: 'январь 26' });
    expect(preview.warnings.join(' ')).toContain('REVIEW_RATING');
  });

  it('surfaces cached formula errors and prevents selecting the affected period', () => {
    const preview = buildHistoricalPreview(fixture({ ratingError: true }), metrics, 'synthetic-history.xlsx');
    const january = preview.periods[1];

    expect(january.selected).toBe(false);
    expect(january.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ severity: 'error', field: 'sourceRating', cell: 'Метрики!C354' }),
    ]));
  });
});
