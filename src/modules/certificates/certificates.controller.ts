import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { Res } from '@nestjs/common';
import type { Response } from 'express';
import { InternalServerErrorException } from '@nestjs/common';

@Controller('api/v1/certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  private withDeliveryUrls<T extends { _id: unknown }>(certificate: T) {
    const id = String(certificate._id);
    return {
      ...certificate,
      viewUrl: `/api/v1/certificates/${id}/view`,
      downloadUrl: `/api/v1/certificates/${id}/download`,
    };
  }

  @Get()
  async findAll() {
    const certificates = await this.certificatesService.findAll();
    return certificates.map((certificate) => this.withDeliveryUrls(certificate));
  }

  @Post('generate')
  async create(@Body() dto: CreateCertificateDto) {
    const certificate = await this.certificatesService.create(dto);
    if (!certificate) {
      throw new InternalServerErrorException(
        'No se pudo generar el certificado',
      );
    }
    return this.withDeliveryUrls(certificate);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const certificate = await this.certificatesService.findOne(id);
    return this.withDeliveryUrls(certificate);
  }

  @Get(':id/view')
  async view(@Param('id') id: string, @Res() res: Response) {
    const file = await this.certificatesService.getFileDeliveryData(id);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
    file.stream.pipe(res);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const file = await this.certificatesService.getFileDeliveryData(id);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    file.stream.pipe(res);
  }
}
