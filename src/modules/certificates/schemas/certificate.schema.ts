import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { Template } from '../../templates/schemas/template.schema';

export type CertificateDocument = HydratedDocument<Certificate>;

@Schema({ timestamps: true, collection: 'certificates' })
export class Certificate {
  @Prop({
    type: Types.ObjectId,
    ref: Template.name,
    required: true,
    index: true,
  })
  templateId: Types.ObjectId;

  @Prop({ type: SchemaTypes.Mixed, required: true })
  data: Record<string, unknown>;

  @Prop({ required: true, enum: ['PNG', 'PDF'], default: 'PNG' })
  format: string;

  @Prop({ default: null })
  filePath?: string;

  @Prop({ default: null })
  fileUrl?: string;

  @Prop({
    required: true,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
  })
  status: string;

  @Prop({ default: null })
  errorMessage?: string;

  @Prop({ default: null })
  generatedAt?: Date;
}

export const CertificateSchema = SchemaFactory.createForClass(Certificate);
