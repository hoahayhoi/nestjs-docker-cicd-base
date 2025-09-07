import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreatePermissionRequestDto {
  @ApiProperty({
    description: 'Tên quyền (duy nhất)',
    example: 'user.create',
    maxLength: 50,
  })
  @IsNotEmpty()
  @MaxLength(50)
  permission_name: string;

  @ApiPropertyOptional({
    description: 'Mô tả quyền',
    example: 'Quyền tạo người dùng mới',
  })
  @IsOptional()
  @MaxLength(255)
  description?: string;
}

export class PermissionResponseDto {
  @ApiProperty({ description: 'ID quyền' })
  id: number;

  @ApiProperty({ description: 'Tên quyền' })
  permission_name: string;

  @ApiPropertyOptional({ description: 'Mô tả quyền' })
  description?: string | null;
}

// export class PermissionWithRolesResponseDto extends PermissionResponseDto {
//   @ApiProperty({
//     type: [RoleBasicResponseDto],
//     description: 'Danh sách vai trò có quyền này',
//   })
//   roles: RoleBasicResponseDto[];
// }

export class RolePermissionsResponseDto {
  @ApiProperty({ description: 'ID của vai trò' })
  id: number;

  @ApiProperty({ description: 'Tên vai trò' })
  name: string;

  @ApiProperty({ description: 'Mô tả vai trò', required: false })
  description?: string | null;

  @ApiProperty({
    type: [PermissionResponseDto],
    description: 'Danh sách các quyền',
  })
  permissions: PermissionResponseDto[];
}
