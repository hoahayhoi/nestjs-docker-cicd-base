import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

import { BaseResponseDto } from '../dtos/base-response.dto';

import type { Type } from '@nestjs/common';

export const ApiCustomResponse = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(BaseResponseDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  );
};

//   // Sử dụng:
//   @Post()
//   @ApiCustomResponse(OrderDto)
//   createOrder() {...}
