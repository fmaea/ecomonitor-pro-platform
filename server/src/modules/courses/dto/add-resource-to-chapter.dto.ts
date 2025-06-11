import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';

export class AddResourceToChapterDto {
  @IsString()
  @IsNotEmpty()
  // Add IsUUID if your resourceId is a UUID, requires `class-validator` version that supports it well or custom decorator.
  // For now, IsString is a general validation.
  resourceId: string;

  @IsNumber()
  @Min(1) // Order usually starts from 1
  order: number;
}
