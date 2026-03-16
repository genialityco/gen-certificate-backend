import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';
import { Certificate, CertificateSchema } from './schemas/certificate.schema';
import { TemplatesModule } from '../templates/templates.module';
import { TemplateFieldsModule } from '../template-fields/template-fields.module';
import { FirebaseModule } from '../../firebase';

@Module({
  imports: [
    TemplatesModule,
    TemplateFieldsModule,
    FirebaseModule,
    MongooseModule.forFeature([
      { name: Certificate.name, schema: CertificateSchema },
    ]),
  ],
  controllers: [CertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
