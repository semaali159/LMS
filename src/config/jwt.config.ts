import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({  
  accessSecret: process.env.JWT_ACCESS_SECRET || 'your-access-secret',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
  accessExpiresIn: '15m' as const,
  refreshExpiresIn: '7d' as const,
 }));
