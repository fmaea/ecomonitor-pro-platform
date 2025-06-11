import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: parseInt(configService.get<string>('DATABASE_PORT'), 10),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'], // Or use autoLoadEntities: true
        synchronize: false, // Explicitly disabled for migrations
        // migrations: [__dirname + '/migrations/*{.ts,.js}'], // Usually not needed for runtime
        // migrationsRun: false, // Ensure migrations are not run automatically by app if CLI handles it
      }),
    }),
  ],
})
export class DatabaseModule {}
