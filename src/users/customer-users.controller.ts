import { Body, Controller, Get, Param, Post, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { CreateUserAddressDto, DeleteUserAddressDto } from './dto/add-address.dto';
import { UsersService } from './users.service';

@ApiTags('Users-Customer')
@ApiBearerAuth()
@Controller('users')
export class CustomerUsersController {
  constructor(private readonly userService: UsersService) {}

  @ApiOperation({ summary: 'Tạo địa chỉ người dùng' })
  @Post('/address')
  async createAddress(@Body() createUserAddressDto: CreateUserAddressDto) {
    return await this.userService.createUserAddress(createUserAddressDto);
  }

  @ApiOperation({ summary: 'Xoá địa chỉ người dùng' })
  @Delete('/address')
  async deleteAddress(@Body() data: DeleteUserAddressDto) {
    return await this.userService.deleteUserAddress(data);
  }

  @Get('/address/:userId')
  @ApiOperation({ summary: 'Lấy danh sách địa chỉ của người dùng' })
  @ApiParam({
    name: 'userId',
    type: 'number',
    description: 'ID của người dùng cần lấy danh sách địa chỉ',
    example: 10,
  })
  async getAddress(@Param('userId') userId: number) {
    return await this.userService.getUserAddresses(userId);
  }
  // @Post('/')
  // @Public()
  // async signupUser(
  //   @Body() createUserDto: CreateUserDto,
  // ): Promise<Partial<User>> {
  //   return await this.userService.createUser(createUserDto);
  // }

  // @ApiOperation({ summary: 'Fetch a list of users' })
  // @Get()
  // async getUsers(@Query() paginationDto: PaginationDto) {
  //   return await this.userService.users(paginationDto);
  // }

  // @Patch(':id')
  // async updateUser(
  //   @Param('id') id: number,
  //   @Body() updateUserDto: UpdateUserDto,
  // ) {
  //   return await this.userService.updatePartial(Number(id), updateUserDto);
  // }

  // @Delete(':id')
  // async deleteUser(@Param('id') id: number) {
  //   const result = await this.userService.deleteUser(id);
  //   return {
  //     statusCode: HttpStatus.OK,
  //     message: result.message,
  //   };
  // }
}
