import { IsEmail, IsEnum, IsString } from 'class-validator';
import { BankAccountType } from '@prisma/client';

export class UpsertBankInfoDto {
  @IsString()
  rut: string;

  @IsString()
  holderName: string;

  @IsString()
  bankName: string;

  @IsEnum(BankAccountType)
  accountType: BankAccountType;

  @IsString()
  accountNumber: string;

  @IsEmail()
  email: string;
}
