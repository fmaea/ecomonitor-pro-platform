import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { Course } from './entities/course.entity';
import { Chapter } from './entities/chapter.entity';
import { User } from '../users/entities/user.entity'; // Import User entity
import { AuthModule } from '../auth/auth.module'; // For guards and user context

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, Chapter, User]), // Include User here for teacher relations
    AuthModule, // To make JwtAuthGuard, RolesGuard, and user available
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService], // If other modules need CoursesService
})
export class CoursesModule {}
