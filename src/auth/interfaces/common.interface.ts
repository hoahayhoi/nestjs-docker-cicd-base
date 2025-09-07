export interface DecodedToken {
  username: string;
  sub: number;
  sub2?: number;
}

export interface GoogleProfile {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  accessToken: string;
  refreshToken: string;
}
