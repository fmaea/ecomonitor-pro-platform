import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { Course } from './entities/course.entity';
import { Chapter } from './entities/chapter.entity';
import { User } from '../users/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { ChapterContentUnit } from './entities/chapter-content-unit.entity'; // Import ChapterContentUnit
import { Resource } from '../resources/entities/resource.entity'; // Import Resource

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      Chapter,
      User,
      ChapterContentUnit, // Add ChapterContentUnit
      Resource, // Add Resource for validation and linking
    ]),
    AuthModule,
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService], // If other modules need CoursesService
})
export class CoursesModule {}
