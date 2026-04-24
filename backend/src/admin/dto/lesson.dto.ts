import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLessonDto {
  @IsString() @MinLength(1)
  title!: string;

  @IsString()
  moduleId!: string;

  @IsString()
  driveFileId!: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  durationSeconds?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  sortOrder?: number;

  @IsOptional() @IsBoolean()
  isFreePreview?: boolean;
}

export class UpdateLessonDto {
  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  driveFileId?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  durationSeconds?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  sortOrder?: number;

  @IsOptional() @IsBoolean()
  isFreePreview?: boolean;
}
