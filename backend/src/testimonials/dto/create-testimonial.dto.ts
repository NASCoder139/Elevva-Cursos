import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateTestimonialDto {
  @IsString()
  @MinLength(20, { message: 'El testimonio debe tener al menos 20 caracteres' })
  @MaxLength(500, { message: 'El testimonio no puede superar los 500 caracteres' })
  content: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}
