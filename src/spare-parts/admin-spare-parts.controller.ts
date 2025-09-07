import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';
import { SparePartsService } from './spare-parts.service';

@ApiTags('Spare-Parts-Admin')
@ApiBearerAuth()
@Controller('spare-parts')
export class AdminSparePartsController {
  constructor(private readonly sparePartsService: SparePartsService) {}

  @Post()
  create(@Body() createSparePartDto: CreateSparePartDto) {
    return this.sparePartsService.create(createSparePartDto);
  }

  @Get()
  findAll() {
    return this.sparePartsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sparePartsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSparePartDto: UpdateSparePartDto) {
    return this.sparePartsService.update(+id, updateSparePartDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sparePartsService.remove(+id);
  }
}
