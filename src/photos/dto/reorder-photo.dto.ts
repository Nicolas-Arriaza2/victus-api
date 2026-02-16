import { IsInt, Min, Max } from 'class-validator';

export class ReorderPhotoDto {
  @IsInt()
  @Min(0)
  @Max(2)
  newPosition: number;
}
