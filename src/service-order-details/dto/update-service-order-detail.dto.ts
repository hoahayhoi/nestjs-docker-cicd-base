import { PartialType } from '@nestjs/swagger';

import { CreateServiceOrderDetailDto } from './create-service-order-detail.dto';

export class UpdateServiceOrderDetailDto extends PartialType(CreateServiceOrderDetailDto) {}
