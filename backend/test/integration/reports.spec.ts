import { cleanNumericString, detectMonthYear } from '../../src/imports/import.parser';

describe('Import parser integration', () => {
  it('should be defined', () => {
    expect(cleanNumericString).toBeDefined();
    expect(detectMonthYear).toBeDefined();
  });

  it('should parse xlsx buffer and return preview structure', async () => {
    const xlsx = require('xlsx');
    const ws = xlsx.utils.aoa_to_sheet([
      ['eNPS', '95'],
      ['Выручка', '500000'],
    ]);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Июнь 2026');
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const workbook = xlsx.read(buffer, { type: 'buffer' });
    expect(workbook.SheetNames).toContain('Июнь 2026');

    const sheet = workbook.Sheets['Июнь 2026'];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][];
    expect(rows).toHaveLength(2);
    expect(rows[0][0]).toBe('eNPS');
    expect(rows[0][1]).toBe('95');

    const detected = detectMonthYear('Июнь 2026');
    expect(detected.month).toBe(6);
    expect(detected.year).toBe(2026);
  });
});
