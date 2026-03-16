import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TemplateDocument = HydratedDocument<Template>;

@Schema({ timestamps: true, collection: 'templates' })
export class Template {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: null })
  description?: string;

  @Prop({ required: true })
  backgroundUrl: string;

  @Prop({ required: true, min: 1 })
  width: number;

  @Prop({ required: true, min: 1 })
  height: number;

  @Prop({ default: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] })
  status: string;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);
