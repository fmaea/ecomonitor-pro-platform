import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
  ParseUUIDPipe, // For resourceId if it's UUID
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { AddResourceToChapterDto } from './dto/add-resource-to-chapter.dto'; // Import new DTO
import { UpdateChapterResourceOrderDto } from './dto/update-chapter-resource-order.dto'; // Import new DTO
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, User } from '../users/entities/user.entity';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';

@Controller('courses') // Global prefix /api/courses
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // --- Course Endpoints ---

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  createCourse(
    @Body() createCourseDto: CreateCourseDto,
    @GetCurrentUser() teacher: User,
  ) {
    return this.coursesService.createCourse(createCourseDto, teacher);
  }

  @Get()
  findAllCourses() {
    return this.coursesService.findAllCourses();
  }

  @Get('teacher/my-courses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  findMyTeachingCourses(@GetCurrentUser() teacher: User) {
    return this.coursesService.findCoursesByTeacher(teacher.id);
  }

  @Get(':id')
  findCourseById(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.findCourseById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  updateCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
    @GetCurrentUser() teacher: User,
  ) {
    return this.coursesService.updateCourse(id, updateCourseDto, teacher);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeCourse(
    @Param('id', ParseIntPipe) id: number,
    @GetCurrentUser() teacher: User,
  ) {
    return this.coursesService.removeCourse(id, teacher);
  }

  // --- Chapter Endpoints ---

  @Post(':courseId/chapters')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  createChapter(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() createChapterDto: CreateChapterDto,
    @GetCurrentUser() teacher: User,
  ) {
    return this.coursesService.createChapter(courseId, createChapterDto, teacher);
  }

  @Get(':courseId/chapters')
  getCourseChapters(@Param('courseId', ParseIntPipe) courseId: number) {
    // Here, you might want to check if the course itself is public or if the user has access
    // For now, assuming public access to chapter lists of a course
    return this.coursesService.findChaptersByCourseId(courseId);
  }

  @Get(':courseId/chapters/:chapterId')
  getChapterDetails(
    @Param('courseId', ParseIntPipe) courseId: number, // courseId might be used for validation or context
    @Param('chapterId', ParseIntPipe) chapterId: number,
  ) {
    // Add validation if chapter must belong to courseId if necessary
    return this.coursesService.findChapterById(chapterId);
  }

  @Patch(':courseId/chapters/:chapterId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  updateChapter(
    @Param('courseId', ParseIntPipe) courseId: number, // For context/validation
    @Param('chapterId', ParseIntPipe) chapterId: number,
    @Body() updateChapterDto: UpdateChapterDto,
    @GetCurrentUser() teacher: User,
  ) {
    // The service method `updateChapter` already checks if teacher owns the parent course via chapter relation
    return this.coursesService.updateChapter(chapterId, updateChapterDto, teacher);
  }

  @Delete(':courseId/chapters/:chapterId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeChapter(
    @Param('courseId', ParseIntPipe) courseId: number, // For context/validation
    @Param('chapterId', ParseIntPipe) chapterId: number,
    @GetCurrentUser() teacher: User,
  ) {
    // The service method `removeChapter` already checks if teacher owns the parent course
    return this.coursesService.removeChapter(chapterId, teacher);
  }

  // --- Chapter Resource Linking Endpoints ---

  @Post(':courseId/chapters/:chapterId/resources')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  addResourceToChapter(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('chapterId', ParseIntPipe) chapterId: number,
    @Body() addResourceDto: AddResourceToChapterDto,
    @GetCurrentUser() teacher: User,
  ) {
    return this.coursesService.addResourceToChapter(courseId, chapterId, addResourceDto, teacher);
  }

  @Delete(':courseId/chapters/:chapterId/resources/:resourceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeResourceFromChapter(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('chapterId', ParseIntPipe) chapterId: number,
    @Param('resourceId', ParseUUIDPipe) resourceId: string, // Assuming resourceId is UUID
    @GetCurrentUser() teacher: User,
  ) {
    return this.coursesService.removeResourceFromChapter(courseId, chapterId, resourceId, teacher);
  }

  @Patch(':courseId/chapters/:chapterId/resources/order')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  updateResourceOrderInChapter(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('chapterId', ParseIntPipe) chapterId: number,
    @Body() updateOrderDto: UpdateChapterResourceOrderDto,
    @GetCurrentUser() teacher: User,
  ) {
    return this.coursesService.updateResourceOrderInChapter(courseId, chapterId, updateOrderDto.orderUpdates, teacher);
  }

  @Get(':courseId/chapters/:chapterId/resources')
  // Public or protected as needed. For now, public.
  getResourcesForChapter(
    // @Param('courseId', ParseIntPipe) courseId: number, // Not strictly needed if chapterId is globally unique
    @Param('chapterId', ParseIntPipe) chapterId: number,
  ) {
    return this.coursesService.getResourcesForChapter(chapterId);
  }
}
