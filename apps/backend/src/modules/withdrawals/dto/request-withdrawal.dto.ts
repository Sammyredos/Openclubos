import { IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class RequestWithdrawalDto {
  @IsNumber()
  @IsPositive({ message: 'Withdrawal amount must be greater than zero' })
  amount: number;

  @IsOptional()
  @IsUUID('all', { message: 'Invalid bank account ID' })
  bankAccountId?: string;

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
  @IsString()
  notes?: string;
}
