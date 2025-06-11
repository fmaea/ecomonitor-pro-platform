import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { Chapter } from './entities/chapter.entity';
import { User } from '../users/entities/user.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private coursesRepository: Repository<Course>,
    @InjectRepository(Chapter)
    private chaptersRepository: Repository<Chapter>,
  ) {}

  // --- Course Methods ---

  async createCourse(createCourseDto: CreateCourseDto, teacher: User): Promise<Course> {
    const course = this.coursesRepository.create({
      ...createCourseDto,
      teacherId: teacher.id, // Set teacherId explicitly
      teacher: teacher,       // Associate the teacher object
    });
    try {
      return await this.coursesRepository.save(course);
    } catch (error) {
        // Log the error for debugging
        console.error("Error creating course:", error);
        throw new InternalServerErrorException("Failed to create course.");
    }
  }

  async findAllCourses(): Promise<Course[]> {
    return this.coursesRepository.find({ relations: ['teacher', 'chapters'] });
  }

  async findCourseById(id: number): Promise<Course | null> {
    const course = await this.coursesRepository.findOne({
      where: { id },
      relations: ['teacher', 'chapters'], // Load teacher and chapters
    });
    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
    // Sort chapters by order
    if (course.chapters) {
      course.chapters.sort((a, b) => a.order - b.order);
    }
    return course;
  }

  async findCoursesByTeacher(teacherId: number): Promise<Course[]> {
    return this.coursesRepository.find({
      where: { teacherId },
      relations: ['chapters'], // Optionally load chapters
    });
  }

  async updateCourse(id: number, updateCourseDto: UpdateCourseDto, teacher: User): Promise<Course> {
    const course = await this.findCourseByIdWithAuthCheck(id, teacher.id);
    Object.assign(course, updateCourseDto);
    try {
        return await this.coursesRepository.save(course);
    } catch (error) {
        console.error(`Error updating course ID ${id}:`, error);
        throw new InternalServerErrorException("Failed to update course.");
    }
  }

  async removeCourse(id: number, teacher: User): Promise<void> {
    const course = await this.findCourseByIdWithAuthCheck(id, teacher.id);
    try {
        await this.coursesRepository.remove(course);
    } catch (error) {
        console.error(`Error removing course ID ${id}:`, error);
        throw new InternalServerErrorException("Failed to remove course.");
    }
  }

  // --- Chapter Methods ---

  async createChapter(courseId: number, createChapterDto: CreateChapterDto, teacher: User): Promise<Chapter> {
    const course = await this.findCourseByIdWithAuthCheck(courseId, teacher.id);
    const chapter = this.chaptersRepository.create({
      ...createChapterDto,
      courseId: course.id, // Set courseId explicitly
      course: course,       // Associate the course object
    });
     try {
        return await this.chaptersRepository.save(chapter);
    } catch (error) {
        console.error(`Error creating chapter for course ID ${courseId}:`, error);
        throw new InternalServerErrorException("Failed to create chapter.");
    }
  }

  async findChapterById(id: number): Promise<Chapter | null> {
    const chapter = await this.chaptersRepository.findOne({ where: { id }, relations: ['course'] });
    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${id} not found`);
    }
    return chapter;
  }

  async findChaptersByCourseId(courseId: number): Promise<Chapter[]> {
    const chapters = await this.chaptersRepository.find({
        where: { courseId },
        order: { order: 'ASC' }, // Order chapters by their 'order' field
    });
    if (!chapters || chapters.length === 0) {
        // Consider if this should be an error or just return empty array
        // For now, let's return empty array as a course might not have chapters
    }
    return chapters;
  }


  async updateChapter(chapterId: number, updateChapterDto: UpdateChapterDto, teacher: User): Promise<Chapter> {
    const chapter = await this.chaptersRepository.findOne({
        where: { id: chapterId },
        relations: ['course']
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${chapterId} not found`);
    }
    // Ensure the teacher owns the parent course
    if (chapter.course.teacherId !== teacher.id) {
      throw new ForbiddenException('You are not authorized to update chapters for this course.');
    }

    Object.assign(chapter, updateChapterDto);
    try {
        return await this.chaptersRepository.save(chapter);
    } catch (error) {
        console.error(`Error updating chapter ID ${chapterId}:`, error);
        throw new InternalServerErrorException("Failed to update chapter.");
    }
  }

  async removeChapter(chapterId: number, teacher: User): Promise<void> {
    const chapter = await this.chaptersRepository.findOne({
        where: { id: chapterId },
        relations: ['course']
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${chapterId} not found`);
    }
    // Ensure the teacher owns the parent course
    if (chapter.course.teacherId !== teacher.id) {
      throw new ForbiddenException('You are not authorized to remove chapters from this course.');
    }
    try {
        await this.chaptersRepository.remove(chapter);
    } catch (error) {
        console.error(`Error removing chapter ID ${chapterId}:`, error);
        throw new InternalServerErrorException("Failed to remove chapter.");
    }
  }

  // --- Helper Methods ---
  private async findCourseByIdWithAuthCheck(courseId: number, teacherId: number): Promise<Course> {
    const course = await this.coursesRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }
    if (course.teacherId !== teacherId) {
      throw new ForbiddenException('You are not authorized to perform this action on this course.');
    }
    return course;
  }
}
