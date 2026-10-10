import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsOptional()
  email?: string;
}
