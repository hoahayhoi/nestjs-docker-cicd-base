import { Module } from '@nestjs/common';

import { AdminUsersController } from './admin-users.controller';
import { CustomerUsersController } from './customer-users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [],
  controllers: [CustomerUsersController, AdminUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
