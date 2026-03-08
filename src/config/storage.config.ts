import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  endpoint: process.env.STORAGE_ENDPOINT,
  api_key: process.env.STORAGE_CREDENTIALS_KEY,
  api_secret: process.env.STORAGE_CREDENTIALS_SECRET,
  bucket:process.env.STORAGE_BUCKET
 }));
