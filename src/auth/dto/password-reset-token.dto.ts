export enum TokenType {
  EMAIL = 'email',
  SMS = 'sms',
}

export class PasswordResetTokenDto {
  id: number;
  userId: number;
  token: string;
  tokenType: TokenType;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}
