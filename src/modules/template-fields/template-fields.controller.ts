import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { TemplateFieldsService } from './template-fields.service';
import { CreateTemplateFieldDto } from './dto/create-template-field.dto';
import { UpdateTemplateFieldDto } from './dto/update-template-field.dto';
import { SyncTemplateFieldsDto } from './dto/sync-template-fields.dto';

@Controller('internal/template-fields')
export class TemplateFieldsController {
  constructor(private readonly templateFieldsService: TemplateFieldsService) {}

  @Post()
  create(@Body() dto: CreateTemplateFieldDto) {
    return this.templateFieldsService.create(dto);
  }

  @Get('template/:templateId')
  findByTemplate(@Param('templateId') templateId: string) {
    return this.templateFieldsService.findByTemplate(templateId);
  }

  @Put('template/:templateId')
  replaceByTemplate(
    @Param('templateId') templateId: string,
    @Body() dto: SyncTemplateFieldsDto,
  ) {
    return this.templateFieldsService.replaceByTemplate(templateId, dto.fields);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTemplateFieldDto) {
    return this.templateFieldsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.templateFieldsService.remove(id);
  }

  @Delete('template/:templateId')
  removeByTemplate(@Param('templateId') templateId: string) {
    return this.templateFieldsService.removeByTemplate(templateId);
  }
}
