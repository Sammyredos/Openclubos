import { IsNotEmpty, IsString } from 'class-validator';

export class ResolveAccountDto {
  @IsString()
  @IsNotEmpty({ message: 'Account number is required' })
  accountNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'Bank code is required' })
  bankCode: string;
}
