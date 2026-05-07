import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ConfirmScoreDto {
  @IsBoolean()
  @IsNotEmpty()
  confirm: boolean;
}
