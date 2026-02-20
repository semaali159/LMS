export interface JwtPayload {
  userId: string;
  email: string;
  refreshToken?: string;
}
