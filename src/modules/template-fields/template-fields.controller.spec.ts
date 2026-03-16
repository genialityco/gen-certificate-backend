import { Test, TestingModule } from '@nestjs/testing';
import { TemplateFieldsController } from './template-fields.controller';

describe('TemplateFieldsController', () => {
  let controller: TemplateFieldsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplateFieldsController],
    }).compile();

    controller = module.get<TemplateFieldsController>(TemplateFieldsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
