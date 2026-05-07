import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateScoreDto {
  @IsInt()
  @IsNotEmpty()
  strokes: number;

  @IsInt()
  @IsOptional()
  putts?: number;

  @IsInt()
  @IsOptional()
  points?: number;

  @IsString()
  @IsUUID()
  @IsNotEmpty()
  holeId: string;

  @IsString()
  @IsUUID()
  @IsOptional()
  groupId?: string;

  @IsString()
  @IsUUID()
  @IsOptional()
  userId?: string; // Optional: used by admin to enter score for a player
}
