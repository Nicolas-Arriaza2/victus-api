import { IsIn, IsString } from 'class-validator';

export class UpdateEnrollmentStatusDto {
  @IsString()
  @IsIn(['confirmed', 'attended'])
  status: 'confirmed' | 'attended';
}
