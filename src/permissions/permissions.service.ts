import { Injectable } from '@nestjs/common';

import { CreatePermissionRequestDto, PermissionResponseDto } from './dto/create-permission.dto';

import { DatabaseService } from '@/database/database.service';

@Injectable()
export class PermissionsService {
  constructor(private prisma: DatabaseService) {}

  async create(dto: CreatePermissionRequestDto): Promise<PermissionResponseDto> {
    const perm = await this.prisma.permission.create({
      data: {
        permission_name: dto.permission_name,
        description: dto.description,
      },
    });

    return {
      id: perm.id,
      permission_name: perm.permission_name,
      description: perm.description,
    };
  }

  async findAll(): Promise<PermissionResponseDto[]> {
    return await this.prisma.permission.findMany();
  }

  // findOne(id: number) {
  //   return `This action returns a #${id} permission`;
  // }

  // update(id: number, updatePermissionDto: UpdatePermissionDto) {
  //   return `This action updates a #${id} permission`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} permission`;
  // }
}
