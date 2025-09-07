import type { User } from '@prisma/client';

export type UpdateUserPayload = Omit<Partial<User>, 'id' | 'createdAt' | 'updatedAt'>;

export type PartialUpdate<T> = {
  [P in keyof T]?: T[P] extends infer U
    ? U extends null | undefined
      ? Exclude<U, null | undefined> | null
      : U
    : never;
};
