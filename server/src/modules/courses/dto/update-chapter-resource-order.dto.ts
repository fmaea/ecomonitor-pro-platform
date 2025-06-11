import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ChapterResourceOrderUpdateItemDto {
  @IsString()
  @IsNotEmpty()
  // This could be resourceId or chapterContentUnitId depending on how you want to identify the item to reorder.
  // Using chapterContentUnitId is more precise if you have it.
  // If using resourceId, ensure it's clear which instance if a resource could appear multiple times (not the case with current unique constraint).
  // Let's assume chapterContentUnitId for precision.
  contentUnitId: string; // Assuming ChapterContentUnit ID is UUID

  @IsNumber()
  @Min(1)
  order: number;
}

export class UpdateChapterResourceOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChapterResourceOrderUpdateItemDto)
  @IsNotEmpty()
  orderUpdates: ChapterResourceOrderUpdateItemDto[];
}
