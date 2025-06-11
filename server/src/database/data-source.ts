import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const finalDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'ecomonitor_pro_training',
  entities: [path.join(__dirname, '/../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '/migrations/*{.ts,.js}')],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

export default new DataSource(finalDataSourceOptions);

// This function is intended for use in database.module.ts with TypeOrmModule.forRootAsync
// It should align with TypeOrmModuleOptions, which can include NestJS-specific helpers like autoLoadEntities.
// However, to avoid TS errors in this standalone file, we'll define it more generically or ensure
// it's only used where TypeOrmModuleOptions is the expected type.
// For the purpose of this file being valid TypeScript that the CLI can execute without
// full NestJS context, we'll make its return type DataSourceOptions.
// The actual TypeOrmModule in NestJS can still use autoLoadEntities.
export const getTypeOrmModuleOptions = (configService: ConfigService): DataSourceOptions => ({
    type: 'postgres',
    host: configService.get<string>('DATABASE_HOST'),
    port: configService.get<number>('DATABASE_PORT'),
    username: configService.get<string>('DATABASE_USER'),
    password: configService.get<string>('DATABASE_PASSWORD'),
    database: configService.get<string>('DATABASE_NAME'),
    entities: [path.join(__dirname, '/../**/*.entity{.ts,.js}')], // Explicit entities path
    // autoLoadEntities: true, // This is a NestJS TypeOrm specific helper, not a direct DataSourceOption.
                              // It should be used in the TypeOrmModule.forRootAsync factory in database.module.ts itself.
    synchronize: false,
    logging: configService.get<string>('NODE_ENV') === 'development',
});

// To clarify: the `getTypeOrmModuleOptions` function above is fine for this file to export.
// When `database.module.ts` imports and uses it in `TypeOrmModule.forRootAsync({ useFactory: getTypeOrmModuleOptions, ...})`,
// the factory's return type is `TypeOrmModuleOptions`. NestJS will correctly interpret `autoLoadEntities: true`
// if you decide to add it there. The error was due to this file's strict `DataSourceOptions` context for the CLI.
// For now, `entities` is explicitly listed, which is safe for both contexts.
// The `DatabaseModule` will be reviewed next to ensure it correctly uses `autoLoadEntities` or provides the entity list.
