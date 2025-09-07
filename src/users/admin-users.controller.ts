import { Body, Controller, Get, Param, Delete, Query, HttpStatus, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

import { Public } from '@/common/decorator/customize';
import { PaginationDto } from '@/common/pagination/paginationDto';

@ApiTags('Users-Admin')
@ApiBearerAuth()
@Controller('users')
export class AdminUsersController {
  constructor(private readonly userService: UsersService) {}

  @Public()
  @ApiOperation({ summary: 'Fetch a list of users' })
  @Get()
  async getUsers(@Query() paginationDto: PaginationDto) {
    return await this.userService.users(paginationDto);
  }

  @Patch(':id')
  async updateUser(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return await this.userService.updatePartial(Number(id), updateUserDto);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: number) {
    const result = await this.userService.deleteUser(id);

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }
}
