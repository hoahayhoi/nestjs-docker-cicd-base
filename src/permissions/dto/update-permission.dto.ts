import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, MaxLength } from 'class-validator';

// export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}

export class UpdatePermissionRequestDto {
  @ApiPropertyOptional({
    description: 'Tên quyền (duy nhất)',
    example: 'user.create',
    maxLength: 50,
  })
  @IsOptional()
  @MaxLength(50)
  permission_name?: string;

  @ApiPropertyOptional({
    description: 'Mô tả quyền',
    example: 'Quyền tạo người dùng mới',
  })
  @IsOptional()
  @MaxLength(255)
  description?: string;
}
