import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TemplateField,
  TemplateFieldSchema,
} from './schemas/template-field.schema';
import { TemplateFieldsController } from './template-fields.controller';
import { TemplateFieldsService } from './template-fields.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TemplateField.name, schema: TemplateFieldSchema },
    ]),
  ],
  controllers: [TemplateFieldsController],
  providers: [TemplateFieldsService],
  exports: [TemplateFieldsService],
})
export class TemplateFieldsModule {}
