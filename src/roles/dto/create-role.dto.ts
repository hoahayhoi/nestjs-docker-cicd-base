import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

import { PermissionResponseDto } from '@/permissions/dto/create-permission.dto';

export class RoleResponseDto {
  @ApiProperty({ description: 'ID của vai trò' })
  id: number;

  @ApiProperty({ description: 'Tên vai trò' })
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả vai trò' })
  description?: string | null;
}

export class CreateRoleRequestDto extends PickType(RoleResponseDto, ['name', 'description']) {}

export class AddPermissionsToRoleRequestDto {
  @ApiProperty({
    description: 'Mảng ID các permission cần thêm vào role',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsNotEmpty()
  permissionIds: number[];
}

export class AddPermissionsToRoleResponseDto extends RoleResponseDto {
  @ApiProperty({ type: [PermissionResponseDto] })
  permissions: PermissionResponseDto[];
}
