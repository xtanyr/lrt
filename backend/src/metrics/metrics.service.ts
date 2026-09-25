import { BadRequestException, Injectable } from '@nestjs/common';
import { AnalysisSection } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type MetricDirection = 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER';

export interface MetricWriteData {
  name?: string;
  code?: string;
  unit?: string;
  direction?: MetricDirection;
  thresholdStrong?: number;
  thresholdMedium?: number;
  pointsStrong?: number;
  pointsMedium?: number;
  pointsCritical?: number;
  isActive?: boolean;
  displayOrder?: number;
  valueScale?: number;
  section?: AnalysisSection;
  source?: string;
  targetValue?: number | null;
  midValue?: number | null;
  ptTarget?: number | null;
  ptMid?: number | null;
}

function defined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function synchronizedFields(data: MetricWriteData) {
  const thresholdStrong = data.thresholdStrong ?? data.targetValue;
  const thresholdMedium = data.thresholdMedium ?? data.midValue;
  const pointsStrong = data.pointsStrong ?? data.ptTarget;
  const pointsMedium = data.pointsMedium ?? data.ptMid;

  return {
    ...(defined(thresholdStrong) ? { thresholdStrong, targetValue: thresholdStrong } : {}),
    ...(defined(thresholdMedium) ? { thresholdMedium, midValue: thresholdMedium } : {}),
    ...(defined(pointsStrong) ? { pointsStrong, ptTarget: pointsStrong } : {}),
    ...(defined(pointsMedium) ? { pointsMedium, ptMid: pointsMedium } : {}),
  };
}

function validateWriteInput(data: MetricWriteData) {
  const numericFields = [
    'thresholdStrong',
    'thresholdMedium',
    'pointsStrong',
    'pointsMedium',
    'pointsCritical',
    'targetValue',
    'midValue',
    'ptTarget',
    'ptMid',
  ] as const;
  for (const field of numericFields) {
    if (field in data && (data[field] == null || !Number.isFinite(data[field]))) {
      throw new BadRequestException(`Metric field ${field} must be a finite number`);
    }
  }
}

function validateConfiguration(data: Record<string, unknown>) {
  const required = ['thresholdStrong', 'thresholdMedium', 'pointsStrong', 'pointsMedium'] as const;
  for (const field of required) {
    if (!defined(data[field] as number | null | undefined)) {
      throw new BadRequestException(`Metric field ${field} is required`);
    }
  }

  const direction = data.direction as MetricDirection;
  const strong = Number(data.thresholdStrong);
  const medium = Number(data.thresholdMedium);
  if (direction === 'HIGHER_IS_BETTER' && strong < medium) {
    throw new BadRequestException('Strong threshold must be greater than or equal to medium threshold');
  }
  if (direction === 'LOWER_IS_BETTER' && strong > medium) {
    throw new BadRequestException('Strong threshold must be less than or equal to medium threshold');
  }

  const pointsStrong = Number(data.pointsStrong);
  const pointsMedium = Number(data.pointsMedium);
  const pointsCritical = Number(data.pointsCritical ?? 0);
  if (pointsStrong < pointsMedium || pointsMedium < pointsCritical || pointsCritical < 0) {
    throw new BadRequestException('Metric points must decrease from target to critical');
  }
}

function auditValue(value: unknown): string {
  return JSON.stringify(value, (_key, item) => {
    if (item && typeof item === 'object' && 'toNumber' in item && typeof item.toNumber === 'function') {
      return item.toNumber();
    }
    return item;
  });
}

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.metric.findMany({ orderBy: { displayOrder: 'asc' } });
  }

  findOne(id: number) {
    return this.prisma.metric.findUnique({ where: { id } });
  }

  async create(data: MetricWriteData, changedById: number) {
    validateWriteInput(data);
    const writeData = {
      ...data,
      ...synchronizedFields(data),
      pointsCritical: data.pointsCritical ?? 0,
      displayOrder: data.displayOrder ?? 0,
      valueScale: data.valueScale ?? 100,
      isActive: data.isActive ?? true,
    };
    validateConfiguration(writeData);

    return this.prisma.$transaction(async (tx) => {
      const metric = await tx.metric.create({ data: writeData as any });
      await tx.configChangeLog.create({
        data: {
          changedById,
          fieldChanged: `metric:${metric.id}:create`,
          newValue: auditValue(metric),
        },
      });
      return metric;
    });
  }

  async update(id: number, data: MetricWriteData, changedById: number) {
    validateWriteInput(data);
    const current = await this.prisma.metric.findUnique({ where: { id } });
    if (!current) throw new BadRequestException('Metric not found');

    const writeData = { ...data, ...synchronizedFields(data) };
    validateConfiguration({ ...current, ...writeData });

    return this.prisma.$transaction(async (tx) => {
      const metric = await tx.metric.update({ where: { id }, data: writeData as any });
      await tx.configChangeLog.create({
        data: {
          changedById,
          fieldChanged: `metric:${id}:update`,
          oldValue: auditValue(current),
          newValue: auditValue(metric),
        },
      });
      return metric;
    });
  }

  remove(id: number, changedById: number) {
    return this.setActive(id, false, changedById);
  }

  restore(id: number, changedById: number) {
    return this.setActive(id, true, changedById);
  }

  private async setActive(id: number, isActive: boolean, changedById: number) {
    const current = await this.prisma.metric.findUnique({ where: { id } });
    if (!current) throw new BadRequestException('Metric not found');

    return this.prisma.$transaction(async (tx) => {
      const metric = await tx.metric.update({ where: { id }, data: { isActive } });
      await tx.configChangeLog.create({
        data: {
          changedById,
          fieldChanged: `metric:${id}:${isActive ? 'restore' : 'archive'}`,
          oldValue: auditValue(current),
          newValue: auditValue(metric),
        },
      });
      return metric;
    });
  }
}
