import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CoursesModule } from './modules/courses/courses.module';
import { ResourcesModule } from './modules/resources/resources.module'; // Added ResourcesModule
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig], // Load app specific configurations
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    CoursesModule,
    ResourcesModule, // Added ResourcesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}