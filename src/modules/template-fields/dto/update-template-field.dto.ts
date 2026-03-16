import { PartialType } from '@nestjs/mapped-types';
import { CreateTemplateFieldDto } from './create-template-field.dto';

export class UpdateTemplateFieldDto extends PartialType(
  CreateTemplateFieldDto,
) {}
