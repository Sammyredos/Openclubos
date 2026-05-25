import { CourseStatus } from '@prisma/client';

export class CreateCourseDto {
  name: string;
  alsoKnownAs?: string;
  type?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  latitude?: number | string;
  longitude?: number | string;
  holes?: number;
  par?: number;
  yearEstablished?: number;
  architect?: string;
  courseRating?: number;
  slopeRating?: number;
  phone?: string;
  email?: string;
  website?: string;
  bookingUrl?: string;
  amenities?: string[];
  coverImage?: string;
  galleryImages?: string[];
  status?: CourseStatus;
  isFeatured?: boolean;
  clubId?: string;
}
