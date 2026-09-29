import { IsNotEmpty, IsString } from 'class-validator';

export class RejectWithdrawalDto {
  @IsString()
  @IsNotEmpty({ message: 'A rejection reason is required' })
  reason: string;
}
