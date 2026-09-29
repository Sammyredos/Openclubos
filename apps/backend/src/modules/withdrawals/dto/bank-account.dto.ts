import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBankAccountDto {
  @IsString()
  @IsNotEmpty({ message: 'Bank name is required' })
  bankName: string;

  @IsString()
  @IsNotEmpty({ message: 'Account number is required' })
  accountNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'Account name is required' })
  accountName: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  bankCode?: string;
}

export class UpdateBankAccountDto {
  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  accountName?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
