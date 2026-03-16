import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TemplateField,
  TemplateFieldDocument,
  TemplateFieldElement,
} from './schemas/template-field.schema';
import { CreateTemplateFieldDto } from './dto/create-template-field.dto';
import { UpdateTemplateFieldDto } from './dto/update-template-field.dto';
import { Types } from 'mongoose';

@Injectable()
export class TemplateFieldsService implements OnModuleInit {
  private readonly logger = new Logger(TemplateFieldsService.name);

  constructor(
    @InjectModel(TemplateField.name)
    private readonly templateFieldModel: Model<TemplateFieldDocument>,
  ) {}

  async onModuleInit() {
    await this.consolidateAllTemplateDocuments();
    await this.templateFieldModel.syncIndexes();
  }

  private async consolidateAllTemplateDocuments() {
    const templateIds = await this.templateFieldModel.distinct('templateId');

    for (const templateId of templateIds) {
      await this.consolidateTemplateDocuments(new Types.ObjectId(templateId));
    }

    if (templateIds.length > 0) {
      this.logger.log(
        `Consolidación de template_fields completada para ${templateIds.length} template(s)`,
      );
    }
  }

  private async consolidateTemplateDocuments(templateId: Types.ObjectId) {
    const docs = await this.templateFieldModel
      .find({ templateId })
      .sort({ createdAt: 1, _id: 1 });

    if (docs.length <= 1) return docs[0] ?? null;

    const [primary, ...duplicates] = docs;
    const mergedElements = docs
      .flatMap((doc) => doc.elements ?? [])
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((element, index) => ({
        name: element.name,
        label: element.label,
        type: element.type,
        required: element.required,
        defaultValue: element.defaultValue,
        posX: element.posX,
        posY: element.posY,
        width: element.width,
        height: element.height,
        fontSize: element.fontSize,
        fontFamily: element.fontFamily,
        fontColor: element.fontColor,
        fontWeight: element.fontWeight,
        textAlign: element.textAlign,
        rotation: element.rotation,
        order: index,
      }));

    primary.elements = mergedElements as unknown as TemplateFieldElement[];
    await primary.save();

    await this.templateFieldModel.deleteMany({
      _id: { $in: duplicates.map((doc) => doc._id) },
    });

    return primary;
  }

  private toElement(
    dto: Omit<CreateTemplateFieldDto, 'templateId'>,
    order: number,
  ): TemplateFieldElement {
    return {
      name: dto.name,
      label: dto.label,
      type: dto.type,
      required: dto.required ?? true,
      defaultValue: dto.defaultValue,
      posX: dto.posX,
      posY: dto.posY,
      width: dto.width ?? 120,
      height: dto.height ?? 36,
      fontSize: dto.fontSize ?? 16,
      fontFamily: dto.fontFamily ?? 'Arial',
      fontColor: dto.fontColor ?? '#000000',
      fontWeight: dto.fontWeight ?? 'normal',
      textAlign: dto.textAlign ?? 'left',
      rotation: dto.rotation ?? 0,
      order: dto.order ?? order,
    };
  }

  private toApiField(
    templateId: Types.ObjectId,
    element: Partial<TemplateFieldElement> & { _id?: unknown },
  ) {
    return {
      _id: element._id,
      templateId,
      name: element.name,
      label: element.label,
      type: element.type,
      required: element.required,
      defaultValue: element.defaultValue ?? null,
      posX: element.posX,
      posY: element.posY,
      width: element.width,
      height: element.height,
      fontSize: element.fontSize,
      fontFamily: element.fontFamily,
      fontColor: element.fontColor,
      fontWeight: element.fontWeight,
      textAlign: element.textAlign,
      rotation: element.rotation,
      order: element.order ?? 0,
    };
  }

  async create(dto: CreateTemplateFieldDto) {
    const templateObjectId = new Types.ObjectId(dto.templateId);
    await this.consolidateTemplateDocuments(templateObjectId);
    const element = this.toElement(dto, 0);

    const doc = await this.templateFieldModel.findOneAndUpdate(
      { templateId: templateObjectId },
      {
        $setOnInsert: { templateId: templateObjectId },
        $push: { elements: element },
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    );

    const createdElement = doc?.elements
      ?.slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .at(-1);

    if (!doc || !createdElement) {
      throw new NotFoundException('No se pudo crear el campo');
    }

    return this.toApiField(doc.templateId, createdElement as unknown as TemplateFieldElement & { _id: unknown });
  }

  async findByTemplate(templateId: string) {
    const templateObjectId = new Types.ObjectId(templateId);
    await this.consolidateTemplateDocuments(templateObjectId);

    const docs = await this.templateFieldModel
      .find({ templateId: templateObjectId })
      .lean();
    if (!docs.length) return [];

    const elements = docs
      .flatMap((doc) =>
        (doc.elements ?? []).map((element) => ({
          templateId: doc.templateId,
          element,
        })),
      )
      .sort(
        (a, b) => (a.element.order ?? 0) - (b.element.order ?? 0),
      );

    return elements.map(({ templateId: docTemplateId, element }) =>
      this.toApiField(docTemplateId, element),
    );
  }

  async update(id: string, dto: UpdateTemplateFieldDto) {
    const doc = await this.templateFieldModel.findOne({ 'elements._id': id });
    if (!doc) throw new NotFoundException('Campo no encontrado');

    const element = doc.elements.find(
      (item) => (item as { _id?: Types.ObjectId })._id?.toString() === id,
    ) as (TemplateFieldElement & { _id: Types.ObjectId }) | undefined;

    if (!element) throw new NotFoundException('Campo no encontrado');

    if (dto.name !== undefined) element.name = dto.name;
    if (dto.label !== undefined) element.label = dto.label;
    if (dto.type !== undefined) element.type = dto.type;
    if (dto.required !== undefined) element.required = dto.required;
    if (dto.defaultValue !== undefined) element.defaultValue = dto.defaultValue;
    if (dto.posX !== undefined) element.posX = dto.posX;
    if (dto.posY !== undefined) element.posY = dto.posY;
    if (dto.width !== undefined) element.width = dto.width;
    if (dto.height !== undefined) element.height = dto.height;
    if (dto.fontSize !== undefined) element.fontSize = dto.fontSize;
    if (dto.fontFamily !== undefined) element.fontFamily = dto.fontFamily;
    if (dto.fontColor !== undefined) element.fontColor = dto.fontColor;
    if (dto.fontWeight !== undefined) element.fontWeight = dto.fontWeight;
    if (dto.textAlign !== undefined) element.textAlign = dto.textAlign;
    if (dto.rotation !== undefined) element.rotation = dto.rotation;
    if (dto.order !== undefined) element.order = dto.order;

    await doc.save();

    return this.toApiField(doc.templateId, element);
  }

  async remove(id: string) {
    const doc = await this.templateFieldModel.findOne({ 'elements._id': id });
    if (!doc) throw new NotFoundException('Campo no encontrado');

    doc.elements = doc.elements.filter(
      (item) => (item as { _id?: Types.ObjectId })._id?.toString() !== id,
    );
    await doc.save();

    return { message: 'Campo eliminado' };
  }

  async removeByTemplate(templateId: string) {
    const result = await this.templateFieldModel.deleteMany({ templateId });
    return {
      message: 'Campos eliminados',
      deletedCount: result.deletedCount ?? 0,
    };
  }

  async replaceByTemplate(
    templateId: string,
    fields: Omit<CreateTemplateFieldDto, 'templateId'>[],
  ) {
    const templateObjectId = new Types.ObjectId(templateId);
    const elements = fields.map((field, index) => this.toElement(field, index));

    await this.consolidateTemplateDocuments(templateObjectId);

    const doc = await this.templateFieldModel.findOneAndUpdate(
      { templateId: templateObjectId },
      {
        $set: {
          templateId: templateObjectId,
          elements,
        },
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    );

    if (!doc) return [];

    const sorted = [...doc.elements].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );

    return sorted.map((element) => this.toApiField(doc.templateId, element as unknown as TemplateFieldElement & { _id: unknown }));
  }
}
