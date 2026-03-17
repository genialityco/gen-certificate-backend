import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Certificate, CertificateDocument } from './schemas/certificate.schema';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { TemplatesService } from '../templates/templates.service';
import { TemplateFieldsService } from '../template-fields/template-fields.service';
import { FIREBASE_STORAGE } from '../../firebase';
import { Storage } from 'firebase-admin/storage';
import { extname } from 'path';
import sharp from 'sharp';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectModel(Certificate.name)
    private readonly certificateModel: Model<CertificateDocument>,
    private readonly templatesService: TemplatesService,
    private readonly templateFieldsService: TemplateFieldsService,
    @Inject(FIREBASE_STORAGE)
    private readonly firebaseStorage: Storage,
  ) {}

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private normalizeFieldKey(value: string): string {
    return value.trim().toLowerCase().replace(/[\s_-]+/g, '');
  }

  private getFieldValue(
    field: { name?: string; label?: string; defaultValue?: string | null },
    data: Record<string, unknown>,
  ): unknown {
    const key = field.name?.trim();
    if (key && Object.prototype.hasOwnProperty.call(data, key)) {
      return data[key];
    }

    const normalizedMap = new Map<string, unknown>();
    for (const [dataKey, value] of Object.entries(data)) {
      normalizedMap.set(this.normalizeFieldKey(dataKey), value);
    }

    const candidates = [field.name, field.label]
      .filter((candidate): candidate is string => Boolean(candidate?.trim()))
      .map((candidate) => this.normalizeFieldKey(candidate));

    for (const candidate of candidates) {
      if (normalizedMap.has(candidate)) {
        return normalizedMap.get(candidate);
      }
    }

    return field.defaultValue ?? '';
  }

  private shouldUsePercentageCoordinates(
    fields: Array<{ posX?: number; posY?: number }>,
  ): boolean {
    return !fields.some((field) => (field.posX ?? 0) > 100 || (field.posY ?? 0) > 100);
  }

  private toAbsoluteCoordinate(
    value: number | undefined,
    size: number,
    usePercentageCoordinates: boolean,
  ): number {
    const safeValue = value ?? 0;
    return usePercentageCoordinates ? (safeValue / 100) * size : safeValue;
  }

  private toSvgCertificate(
    width: number,
    height: number,
    backgroundUrl: string,
    fields: Array<{
      name?: string;
      label?: string;
      defaultValue?: string | null;
      posX?: number;
      posY?: number;
      fontSize?: number;
      fontFamily?: string;
      fontColor?: string;
      fontWeight?: string;
      textAlign?: string;
      rotation?: number;
    }>,
    data: Record<string, unknown>,
  ): string {
    const usePercentageCoordinates = this.shouldUsePercentageCoordinates(fields);

    const textElements = fields
      .map((field) => {
        const rawValue = this.getFieldValue(field, data);
        const textValue = this.escapeXml(String(rawValue));
        const x = this.toAbsoluteCoordinate(
          field.posX,
          width,
          usePercentageCoordinates,
        );
        const y = this.toAbsoluteCoordinate(
          field.posY,
          height,
          usePercentageCoordinates,
        );
        const fontSize = field.fontSize ?? 16;
        const fontFamily = this.escapeXml(field.fontFamily ?? 'Arial');
        const fill = this.escapeXml(field.fontColor ?? '#000000');
        const fontWeight = this.escapeXml(field.fontWeight ?? 'normal');
        const align = field.textAlign ?? 'left';
        const rotation = field.rotation ?? 0;

        const anchor =
          align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start';

        return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-size="${fontSize}" font-family="${fontFamily}" fill="${fill}" font-weight="${fontWeight}" text-anchor="${anchor}" dominant-baseline="middle" transform="rotate(${rotation.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)})">${textValue}</text>`;
      })
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image href="${this.escapeXml(backgroundUrl)}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none"/>
  ${textElements}
</svg>`;
  }

  private toSvgTextOverlay(
    width: number,
    height: number,
    fields: Array<{
      name?: string;
      label?: string;
      defaultValue?: string | null;
      posX?: number;
      posY?: number;
      fontSize?: number;
      fontFamily?: string;
      fontColor?: string;
      fontWeight?: string;
      textAlign?: string;
      rotation?: number;
    }>,
    data: Record<string, unknown>,
  ): string {
    const usePercentageCoordinates = this.shouldUsePercentageCoordinates(fields);

    const textElements = fields
      .map((field) => {
        const rawValue = this.getFieldValue(field, data);
        const textValue = this.escapeXml(String(rawValue));
        const x = this.toAbsoluteCoordinate(
          field.posX,
          width,
          usePercentageCoordinates,
        );
        const y = this.toAbsoluteCoordinate(
          field.posY,
          height,
          usePercentageCoordinates,
        );
        const fontSize = field.fontSize ?? 16;
        const fontFamily = this.escapeXml(field.fontFamily ?? 'Arial');
        const fill = this.escapeXml(field.fontColor ?? '#000000');
        const fontWeight = this.escapeXml(field.fontWeight ?? 'normal');
        const align = field.textAlign ?? 'left';
        const rotation = field.rotation ?? 0;

        const anchor =
          align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start';

        return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-size="${fontSize}" font-family="${fontFamily}" fill="${fill}" font-weight="${fontWeight}" text-anchor="${anchor}" dominant-baseline="middle" transform="rotate(${rotation.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)})">${textValue}</text>`;
      })
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${textElements}
</svg>`;
  }

  private async uploadFileToStorage(
    certificateId: string,
    templateId: string,
    fileBuffer: Buffer,
    extension: 'svg' | 'png',
    contentType: string,
  ) {
    const path = `certificates/${templateId}/${certificateId}.${extension}`;
    const bucket = this.firebaseStorage.bucket();
    const file = bucket.file(path);

    await file.save(fileBuffer, {
      resumable: false,
      contentType,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '01-01-2500',
    });

    return { path, url };
  }

  private async renderPngCertificate(
    width: number,
    height: number,
    backgroundUrl: string,
    fields: Array<{
      name?: string;
      defaultValue?: string | null;
      posX?: number;
      posY?: number;
      fontSize?: number;
      fontFamily?: string;
      fontColor?: string;
      fontWeight?: string;
      textAlign?: string;
      rotation?: number;
    }>,
    data: Record<string, unknown>,
  ): Promise<Buffer> {
    const response = await fetch(backgroundUrl);
    if (!response.ok) {
      throw new InternalServerErrorException(
        'No se pudo descargar la imagen base del template',
      );
    }

    const backgroundBuffer = Buffer.from(await response.arrayBuffer());
    const overlaySvg = this.toSvgTextOverlay(width, height, fields, data);
    const overlayBuffer = Buffer.from(overlaySvg, 'utf-8');

    return sharp(backgroundBuffer)
      .resize(width, height, { fit: 'fill' })
      .composite([{ input: overlayBuffer, top: 0, left: 0 }])
      .png()
      .toBuffer();
  }

  async create(dto: CreateCertificateDto) {
    const certificate = await this.certificateModel.create({
      ...dto,
      status: 'PENDING',
    });

    try {
      const template = await this.templatesService.findOne(dto.templateId);
      const fields = await this.templateFieldsService.findByTemplate(dto.templateId);

      const svgContent = this.toSvgCertificate(
        template.width,
        template.height,
        template.backgroundUrl,
        fields,
        dto.data,
      );

      const upload =
        dto.format === 'PNG'
          ? await this.uploadFileToStorage(
              certificate._id.toString(),
              dto.templateId,
              await this.renderPngCertificate(
                template.width,
                template.height,
                template.backgroundUrl,
                fields,
                dto.data,
              ),
              'png',
              'image/png',
            )
          : await this.uploadFileToStorage(
              certificate._id.toString(),
              dto.templateId,
              Buffer.from(svgContent, 'utf-8'),
              'svg',
              'image/svg+xml',
            );

      const completed = await this.markCompleted(
        certificate._id.toString(),
        upload.path,
        upload.url,
      );

      return completed;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error generando certificado';
      await this.markFailed(certificate._id.toString(), message);
      throw new InternalServerErrorException(
        `No se pudo generar el certificado: ${message}`,
      );
    }
  }

  async findAll() {
    return this.certificateModel.find().sort({ createdAt: -1 }).lean();
  }

  async findOne(id: string) {
    const certificate = await this.certificateModel.findById(id).lean();
    if (!certificate) throw new NotFoundException('Certificate no encontrado');
    return certificate;
  }

  async getFileDeliveryData(id: string) {
    const certificate = await this.certificateModel.findById(id).lean();
    if (!certificate) throw new NotFoundException('Certificate no encontrado');
    if (!certificate.filePath) {
      throw new BadRequestException('El certificado aún no tiene archivo generado');
    }

    const bucket = this.firebaseStorage.bucket();
    const file = bucket.file(certificate.filePath);
    const [exists] = await file.exists();

    if (!exists) {
      throw new NotFoundException('Archivo del certificado no encontrado en storage');
    }

    const extension = extname(certificate.filePath).toLowerCase();
    const contentType =
      extension === '.svg'
        ? 'image/svg+xml'
        : extension === '.png'
          ? 'image/png'
          : extension === '.pdf'
            ? 'application/pdf'
            : 'application/octet-stream';

    const fileName = `certificado-${certificate._id}${extension || '.bin'}`;

    return {
      stream: file.createReadStream(),
      contentType,
      fileName,
    };
  }

  async markCompleted(id: string, filePath: string, fileUrl: string) {
    return this.certificateModel.findByIdAndUpdate(
      id,
      {
        status: 'COMPLETED',
        filePath,
        fileUrl,
        generatedAt: new Date(),
        errorMessage: null,
      },
      { returnDocument: 'after' },
    );
  }

  async markFailed(id: string, errorMessage: string) {
    return this.certificateModel.findByIdAndUpdate(
      id,
      {
        status: 'FAILED',
        errorMessage,
      },
      { returnDocument: 'after' },
    );
  }
}
