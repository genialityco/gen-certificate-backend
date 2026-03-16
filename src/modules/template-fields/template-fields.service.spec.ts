import { Test, TestingModule } from '@nestjs/testing';
import { TemplateFieldsService } from './template-fields.service';

describe('TemplateFieldsService', () => {
  let service: TemplateFieldsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplateFieldsService],
    }).compile();

    service = module.get<TemplateFieldsService>(TemplateFieldsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
