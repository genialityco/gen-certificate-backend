import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Template, TemplateDocument } from './schemas/template.schema';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplateFieldsService } from '../template-fields/template-fields.service';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(Template.name)
    private readonly templateModel: Model<TemplateDocument>,
    private readonly templateFieldsService: TemplateFieldsService,
  ) {}

  async create(dto: CreateTemplateDto) {
    return this.templateModel.create(dto);
  }

  async findAll() {
    return this.templateModel.find().sort({ createdAt: -1 }).lean();
  }

  async findOne(id: string) {
    const template = await this.templateModel.findById(id).lean();
    if (!template) throw new NotFoundException('Template no encontrado');
    return template;
  }

  async update(id: string, dto: UpdateTemplateDto) {
    const template = await this.templateModel
      .findByIdAndUpdate(id, dto, { returnDocument: 'after' })
      .lean();

    if (!template) throw new NotFoundException('Template no encontrado');
    return template;
  }

  async remove(id: string) {
    const template = await this.templateModel.findById(id).lean();
    if (!template) throw new NotFoundException('Template no encontrado');

    await this.templateFieldsService.removeByTemplate(id);
    await this.templateModel.findByIdAndDelete(id).lean();

    return { message: 'Template eliminado' };
  }
}
