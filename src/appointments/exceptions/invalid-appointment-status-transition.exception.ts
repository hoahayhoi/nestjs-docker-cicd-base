import { HttpException, HttpStatus } from '@nestjs/common';
import { AppointmentStatusEnum } from '@prisma/client';

const VALID_STATUS_TRANSITIONS: Partial<Record<AppointmentStatusEnum, AppointmentStatusEnum[]>> = {
  [AppointmentStatusEnum.confirmed]: [AppointmentStatusEnum.en_route],
  [AppointmentStatusEnum.en_route]: [AppointmentStatusEnum.arrived],
  [AppointmentStatusEnum.quote_confirmed]: [AppointmentStatusEnum.in_progress],
};

export class InvalidAppointmentStatusTransitionException extends HttpException {
  constructor(currentStatus: string, newStatus: string, validNextStatuses: string[]) {
    super(
      {
        errorCode: 'INVALID_STATUS_TRANSITION',
        message: `Cannot transition from '${currentStatus}' to '${newStatus}'`,
        validNextStatuses,
        currentStatus,
        attemptedStatus: newStatus,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export function validateStatusTransition(currentStatus: AppointmentStatusEnum, newStatus: AppointmentStatusEnum) {
  const allowedStatuses = VALID_STATUS_TRANSITIONS[currentStatus];

  if (!allowedStatuses) {
    throw new InvalidAppointmentStatusTransitionException(currentStatus, newStatus, []);
  }

  if (!allowedStatuses.includes(newStatus)) {
    throw new InvalidAppointmentStatusTransitionException(currentStatus, newStatus, allowedStatuses);
  }
}
