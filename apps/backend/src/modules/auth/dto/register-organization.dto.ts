import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterOrganizationDto {
  @IsString()
  organizationName: string;

  @IsString()
  organizationType: string;

  @IsString()
  @IsOptional()
  customOrganizationType?: string;

  @IsString()
  @IsOptional()
  organizationLogo?: string;

  @IsString()
  adminFirstName: string;

  @IsString()
  adminMiddleName: string;

  @IsString()
  adminLastName: string;

  @IsString()
  @IsOptional()
  adminPhone?: string;

  @IsEmail()
  adminEmail: string;

  @IsString()
  @MinLength(8)
  adminPassword: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  city?: string;
}
