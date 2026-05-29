import { CourseStatus } from '@prisma/client';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsEnum,
  IsUUID,
} from 'class-validator';

export class CreateCourseDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  alsoKnownAs?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  latitude?: number | string;

  @IsOptional()
  longitude?: number | string;

  @IsOptional()
  @IsNumber()
  holes?: number;

  @IsOptional()
  @IsNumber()
  par?: number;

  @IsOptional()
  @IsNumber()
  yearEstablished?: number;

  @IsOptional()
  @IsString()
  architect?: string;

  @IsOptional()
  @IsNumber()
  courseRating?: number;

  @IsOptional()
  @IsNumber()
  slopeRating?: number;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  bookingUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryImages?: string[];

  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsUUID()
  clubId?: string;

  @IsOptional()
  @IsArray()
  teeBoxes?: any[];

  @IsOptional()
  @IsArray()
  holeDetails?: any[];
}
