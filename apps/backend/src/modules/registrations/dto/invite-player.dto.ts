import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class InvitePlayerDto {
  @IsString()
  @IsNotEmpty()
  tournamentId: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsOptional()
  handicap?: number;
}
