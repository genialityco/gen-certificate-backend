import { IsIn, IsMongoId, IsObject } from 'class-validator';

export class CreateCertificateDto {
  @IsMongoId()
  templateId: string;

  @IsIn(['PNG', 'PDF'])
  format: string;

  @IsObject()
  data: Record<string, unknown>;
}