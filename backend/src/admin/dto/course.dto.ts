import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCourseDto {
  @IsString() @MinLength(2)
  title!: string;

  @IsString() @MinLength(2)
  slug!: string;

  @IsString()
  description!: string;

  @IsOptional() @IsString()
  shortDesc?: string;

  @IsOptional() @IsString()
  thumbnailUrl?: string;

  @IsOptional() @Type(() => Number) @IsNumber()
  price?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  comparePrice?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  durationMins?: number;

  @IsOptional() @IsBoolean()
  isPublished?: boolean;

  @IsOptional() @IsBoolean()
  isFeatured?: boolean;

  @IsOptional() @IsBoolean()
  isVisibleToStudents?: boolean;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  sortOrder?: number;

  @IsString()
  categoryId!: string;
}

export class UpdateCourseDto {
  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @IsString()
  slug?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  shortDesc?: string;

  @IsOptional() @IsString()
  thumbnailUrl?: string;

  @IsOptional() @Type(() => Number) @IsNumber()
  price?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  comparePrice?: number | null;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  durationMins?: number;

  @IsOptional() @IsBoolean()
  isPublished?: boolean;

  @IsOptional() @IsBoolean()
  isFeatured?: boolean;

  @IsOptional() @IsBoolean()
  isVisibleToStudents?: boolean;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  sortOrder?: number;

  @IsOptional() @IsString()
  categoryId?: string;
}
