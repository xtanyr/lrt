import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnalysisSection } from '@prisma/client';

export class CreateAnalysisQuestionDto {
  @ApiProperty({ enum: AnalysisSection })
  section!: AnalysisSection;

  @ApiProperty({ example: 'enps_score' })
  questionKey!: string;

  @ApiProperty({ example: 'What is your satisfaction score?' })
  label!: string;

  @ApiPropertyOptional({ example: 0 })
  displayOrder?: number;
}
