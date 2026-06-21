import { Role } from "../enums/roles.enum";
export interface JwtPayload {
  userId: string;
  email: string;
  refreshToken?: string;
  role?:Role
}
