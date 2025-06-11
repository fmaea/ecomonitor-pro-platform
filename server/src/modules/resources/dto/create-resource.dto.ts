import { IsNotEmpty, IsString, IsOptional, IsArray, IsEnum, ValidateNested, ArrayMinSize, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ResourceType } from '../entities/resource.entity'; // Assuming ResourceType enum is in resource.entity.ts

export class CreateResourceDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(ResourceType, { message: 'Invalid resource type' })
  @IsNotEmpty()
  type: ResourceType;

  @IsOptional() // content_data can be optional or validated based on type
  content_data: any; // Record<string, any> or more specific based on types

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true }) // Assuming tagIds are numbers (primary keys of Tag entity)
  tagIds?: number[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { each: true }) // Ensure new tag names are not empty strings
  newTags?: string[];
}
