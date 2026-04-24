import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @IsString() @MinLength(2)
  name!: string;

  @IsString() @MinLength(2)
  slug!: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  imageUrl?: string;

  @IsOptional() @Type(() => Number) @IsNumber()
  price?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  comparePrice?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  sortOrder?: number;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  slug?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  imageUrl?: string;

  @IsOptional() @Type(() => Number) @IsNumber()
  price?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  comparePrice?: number | null;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  sortOrder?: number;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
