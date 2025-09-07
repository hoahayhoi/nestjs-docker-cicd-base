import { SetMetadata } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const RESPONSE_MESSAGE = 'response_message';
export const ResponseMessage = (message: string) => SetMetadata(RESPONSE_MESSAGE, message);

// export function IsEmailOrPhoneRequired(validationOptions?: ValidationOptions) {
//   return function (object: object, propertyName: string) {
//     registerDecorator({
//       name: 'isEmailOrPhoneRequired',
//       target: object.constructor,
//       propertyName: propertyName,
//       options: validationOptions,
//       validator: {
//         validate(value: any, args: ValidationArguments) {
//           const { email, phone } = args.object as any;

//           return !!email || !!phone; // Ít nhất một trong hai phải có
//         },
//         defaultMessage(args: ValidationArguments) {
//           return 'Phải cung cấp ít nhất một trong hai trường: email hoặc số điện thoại';
//         },
//       },
//     });
//   };
// }

/**
 * Custom decorator to validate if a value is either a valid email or phone number.
 * @param validationOptions Optional validation options.
 */
@ValidatorConstraint({ async: false })
export class IsEmailOrPhoneConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Kiểm tra định dạng email
    const phoneRegex = /^\d{10,11}$/; // Kiểm tra định dạng số điện thoại (10-11 chữ số)

    return emailRegex.test(value) || phoneRegex.test(value);
  }

  defaultMessage(): string {
    return 'Giá trị phải là email hoặc số điện thoại hợp lệ';
  }
}

export function IsEmailOrPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEmailOrPhoneConstraint,
    });
  };
}
