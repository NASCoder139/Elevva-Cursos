import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateModuleDto {
  @IsString() @MinLength(1)
  title!: string;

  @IsString()
  courseId!: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  sortOrder?: number;
}

export class UpdateModuleDto {
  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  sortOrder?: number;
}
