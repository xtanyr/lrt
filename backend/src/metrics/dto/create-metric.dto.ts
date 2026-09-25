import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnalysisSection } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMetricDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  unit!: string;

  @ApiProperty({ enum: ['HIGHER_IS_BETTER', 'LOWER_IS_BETTER'] })
  @IsIn(['HIGHER_IS_BETTER', 'LOWER_IS_BETTER'])
  direction!: 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  thresholdStrong?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  thresholdMedium?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pointsStrong?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pointsMedium?: number;

  @ApiPropertyOptional({ description: 'Legacy alias for thresholdStrong' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  targetValue?: number;

  @ApiPropertyOptional({ description: 'Legacy alias for thresholdMedium' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  midValue?: number;

  @ApiPropertyOptional({ description: 'Legacy alias for pointsStrong' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  ptTarget?: number;

  @ApiPropertyOptional({ description: 'Legacy alias for pointsMedium' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  ptMid?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pointsCritical?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valueScale?: number;

  @ApiPropertyOptional({ enum: AnalysisSection })
  @IsOptional()
  @IsEnum(AnalysisSection)
  section?: AnalysisSection;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;
}
