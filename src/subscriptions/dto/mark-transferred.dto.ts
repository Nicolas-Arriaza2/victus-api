import { IsOptional, IsString } from 'class-validator';

export class MarkTransferredDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
