import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import appConfig from '../../config/app.config';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule.forRoot({ // Make sure ConfigModule is loaded, or rely on global if set in AppModule
      load: [appConfig],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule], // Import ConfigModule here if not global
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('app.jwtSecret'),
        signOptions: {
          expiresIn: configService.get<string>('app.jwtExpirationTime'),
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
