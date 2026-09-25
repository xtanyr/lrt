import { BadRequestException } from '@nestjs/common';

export function reportPeriodState(year: number, month: number, now = new Date()) {
  if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new BadRequestException('Некорректный отчётный период');
  }
  // Europe/Moscow has UTC+3 throughout the supported reporting years.
  const deadline = Date.UTC(year, month, 10, 9);
  const lockAt = Date.UTC(year, month + 1, 1, -3);
  return { overdue: now.getTime() >= deadline, locked: now.getTime() >= lockAt };
}

export function previousReportingPeriod(now = new Date()) {
  const moscow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const date = new Date(Date.UTC(moscow.getUTCFullYear(), moscow.getUTCMonth() - 1, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}
