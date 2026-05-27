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

  @IsEmail()
  adminEmail: string;

  @IsString()
  @MinLength(8)
  adminPassword: string;
}
