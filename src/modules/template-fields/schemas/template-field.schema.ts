import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Template } from '../../templates/schemas/template.schema';

export type TemplateFieldDocument = HydratedDocument<TemplateField>;

@Schema({ _id: true })
export class TemplateFieldElement {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  label: string;

  @Prop({ required: true, enum: ['TEXT', 'EMAIL', 'DATE', 'NUMBER'] })
  type: string;

  @Prop({ default: true })
  required: boolean;

  @Prop({ default: null })
  defaultValue?: string;

  @Prop({ required: true, min: 0 })
  posX: number;

  @Prop({ required: true, min: 0 })
  posY: number;

  @Prop({ required: true, min: 1, default: 120 })
  width: number;

  @Prop({ required: true, min: 1, default: 36 })
  height: number;

  @Prop({ required: true, min: 1, default: 16 })
  fontSize: number;

  @Prop({ default: 'Arial' })
  fontFamily: string;

  @Prop({ default: '#000000' })
  fontColor: string;

  @Prop({ default: 'normal', enum: ['normal', 'bold'] })
  fontWeight: string;

  @Prop({ default: 'left', enum: ['left', 'center', 'right'] })
  textAlign: string;

  @Prop({ default: 0 })
  rotation: number;

  @Prop({ default: 0 })
  order: number;
}

export const TemplateFieldElementSchema = SchemaFactory.createForClass(
  TemplateFieldElement,
);

@Schema({ timestamps: true, collection: 'template_fields' })
export class TemplateField {
  @Prop({
    type: Types.ObjectId,
    ref: Template.name,
    required: true,
    index: true,
    unique: true,
  })
  templateId: Types.ObjectId;

  @Prop({ type: [TemplateFieldElementSchema], default: [] })
  elements: TemplateFieldElement[];
}

export const TemplateFieldSchema = SchemaFactory.createForClass(TemplateField);
