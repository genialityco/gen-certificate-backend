import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class TemplateFieldInputDto {
  @IsString()
  name: string;

  @IsString()
  label: string;

  @IsIn(['TEXT', 'EMAIL', 'DATE', 'NUMBER'])
  type: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsString()
  defaultValue?: string;

  @IsNumber()
  @Min(0)
  posX: number;

  @IsNumber()
  @Min(0)
  posY: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  width?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  height?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  fontSize?: number;

  @IsOptional()
  @IsString()
  fontFamily?: string;

  @IsOptional()
  @IsString()
  fontColor?: string;

  @IsOptional()
  @IsIn(['normal', 'bold'])
  fontWeight?: string;

  @IsOptional()
  @IsIn(['left', 'center', 'right'])
  textAlign?: string;

  @IsOptional()
  @IsInt()
  rotation?: number;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class SyncTemplateFieldsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateFieldInputDto)
  fields: TemplateFieldInputDto[];
}
