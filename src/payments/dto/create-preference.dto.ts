import { IsString } from 'class-validator';

export class CreatePreferenceDto {
  @IsString()
  sessionId: string;
}
