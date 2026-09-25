const MONTH_RU: Record<string, number> = {
  январь: 1,
  февраль: 2,
  март: 3,
  апрель: 4,
  май: 5,
  июнь: 6,
  июль: 7,
  август: 8,
  сентябрь: 9,
  октябрь: 10,
  ноябрь: 11,
  декабрь: 12,
};

function detectMonthYear(sheetName: string): { month?: number; year?: number } {
  const lower = sheetName.toLowerCase();
  let month: number | undefined;
  let year: number | undefined;

  for (const [name, m] of Object.entries(MONTH_RU)) {
    if (lower.includes(name)) {
      month = m;
      break;
    }
  }

  const yearMatch = lower.match(/(20\d{2})/);
  if (yearMatch) {
    year = parseInt(yearMatch[1], 10);
  }

  const numMatch = lower.match(/(\d{1,2})[\/\-\.](\d{2,4})/);
  if (numMatch && !month) {
    const m = parseInt(numMatch[1], 10);
    const y = parseInt(numMatch[2], 10);
    if (m >= 1 && m <= 12) month = m;
    year = y < 100 ? 2000 + y : y;
  }

  return { month, year };
}

function cleanNumericString(raw: string): { value: number | null; problem?: string } {
  let text = raw.trim();

  if (!text || text === '-') {
    return { value: null };
  }

  const original = text;

  if (text.includes('\n')) {
    const lines = text.split('\n').filter((l) => l.trim() !== '');
    if (lines.length > 1) {
      return { value: null, problem: `Многострочный текст вместо числа: "${original}"` };
    }
  }

  if (text.includes('^') || text.includes(';')) {
    return { value: null, problem: `Некорректный формат числа: "${original}"` };
  }

  text = text.replace(/[₽$€£\s]/g, '');

  if (text.includes('?')) {
    return { value: null, problem: `Текст с вопросительными знаками: "${original}"` };
  }

  const hasMultipleDots = (text.match(/\./g) || []).length > 1;
  const hasMultipleCommas = (text.match(/,/g) || []).length > 1;
  if (hasMultipleDots || hasMultipleCommas) {
    const clean = text.replace(/[^\d.,]/g, '');
    if (clean !== text) {
      return { value: null, problem: `Нечисловой текст: "${original}"` };
    }
  }

  const hadPercent = text.includes('%');
  text = text.replace(/%/g, '');

  const num = parseFloat(text);
  if (Number.isNaN(num)) {
    return { value: null, problem: `Не удалось распознать число: "${original}"` };
  }

  const problem = hadPercent ? `Процентный знак в числовом поле: "${original}"` : undefined;

  return { value: num, problem };
}

describe('cleanNumericString', () => {
  it('should parse plain integer', () => {
    const result = cleanNumericString('95');
    expect(result.value).toBe(95);
    expect(result.problem).toBeUndefined();
  });

  it('should parse decimal with dot', () => {
    const result = cleanNumericString('6.7');
    expect(result.value).toBeCloseTo(6.7, 1);
  });

  it('should parse number with spaces as thousands separator', () => {
    const result = cleanNumericString('4 402 865');
    expect(result.value).toBe(4402865);
  });

  it('should parse currency string', () => {
    const result = cleanNumericString('81 300,00 ₽');
    expect(result.value).toBeCloseTo(81300, 1);
  });

  it('should parse percent string', () => {
    const result = cleanNumericString('1.05%');
    expect(result.value).toBeCloseTo(1.05, 2);
  });

  it('should flag double percent sign', () => {
    const result = cleanNumericString('12%%');
    expect(result.value).toBeCloseTo(12, 1);
    expect(result.problem).toContain('Процентный знак');
  });

  it('should flag text with question marks', () => {
    const result = cleanNumericString('403000 ???');
    expect(result.value).toBeNull();
    expect(result.problem).toContain('403000 ???');
  });

  it('should flag multi-line text', () => {
    const result = cleanNumericString('280875\n10500\n78000');
    expect(result.value).toBeNull();
    expect(result.problem).toContain('Многострочный текст');
  });

  it('should return null for placeholder percent sign', () => {
    const result = cleanNumericString('%');
    expect(result.value).toBeNull();
    expect(result.problem).toContain('Не удалось распознать число');
  });

  it('should return null for empty string', () => {
    const result = cleanNumericString('');
    expect(result.value).toBeNull();
    expect(result.problem).toBeUndefined();
  });
});

describe('detectMonthYear', () => {
  it('should detect month and year from russian sheet name', () => {
    const result = detectMonthYear('Июнь 2026');
    expect(result.month).toBe(6);
    expect(result.year).toBe(2026);
  });

  it('should detect month and year from numeric sheet name', () => {
    const result = detectMonthYear('06-2026');
    expect(result.month).toBe(6);
    expect(result.year).toBe(2026);
  });

  it('should return undefined for unrecognized sheet name', () => {
    const result = detectMonthYear('Sheet1');
    expect(result.month).toBeUndefined();
    expect(result.year).toBeUndefined();
  });
});
