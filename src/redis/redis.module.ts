import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
       const redisInstance = new Redis({
    host: config.get<string>('redis.host') ,
    port: Number(config.get<number>('redis.port')) ,
    connectTimeout: 10000, 
    lazyConnect: false,   
  });

  redisInstance.on('error', (err) => {
    console.error('❌ Redis Error:', err.message);
  });

  redisInstance.on('connect', () => {
    console.log('✅ Connected to Redis successfully!');
  });

  return redisInstance;
        
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}

