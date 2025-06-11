import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getManager } from 'typeorm'; // Consider EntityManager for complex transactions if needed
import { Course } from './entities/course.entity';
import { Chapter } from './entities/chapter.entity';
import { ChapterContentUnit } from './entities/chapter-content-unit.entity'; // Import ChapterContentUnit
import { Resource } from '../resources/entities/resource.entity'; // Import Resource for return type
import { User } from '../users/entities/user.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { AddResourceToChapterDto } from './dto/add-resource-to-chapter.dto';
import { ChapterResourceOrderUpdateItemDto } from './dto/update-chapter-resource-order.dto';


@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private coursesRepository: Repository<Course>,
    @InjectRepository(Chapter)
    private chaptersRepository: Repository<Chapter>,
    @InjectRepository(ChapterContentUnit) // Inject ChapterContentUnit repository
    private chapterContentUnitsRepository: Repository<ChapterContentUnit>,
    @InjectRepository(Resource) // Inject Resource repository for validation
    private resourcesRepository: Repository<Resource>,
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

  // --- Chapter Resource Linking Methods (Stubs) ---

  async addResourceToChapter(
    courseId: number,
    chapterId: number,
    addResourceDto: AddResourceToChapterDto,
    teacher: User
  ): Promise<ChapterContentUnit> {
    const course = await this.findCourseByIdWithAuthCheck(courseId, teacher.id);
    const chapter = await this.chaptersRepository.findOne({ where: { id: chapterId, courseId: course.id } });
    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${chapterId} in course ${courseId} not found.`);
    }

    const resource = await this.resourcesRepository.findOne({ where: { id: addResourceDto.resourceId }});
    if (!resource) {
        throw new NotFoundException(`Resource with ID ${addResourceDto.resourceId} not found.`);
    }

    // Check for existing unique constraint (chapterId, resourceId)
    const existingLink = await this.chapterContentUnitsRepository.findOne({
        where: { chapterId: chapter.id, resourceId: resource.id }
    });
    if (existingLink) {
        throw new BadRequestException(`Resource with ID ${resource.id} is already linked to chapter ID ${chapter.id}.`);
    }

    const newContentUnit = this.chapterContentUnitsRepository.create({
      chapterId: chapter.id,
      resourceId: resource.id, // from DTO
      order: addResourceDto.order,
    });
    // console.log(`Attempting to add resource ${resource.id} to chapter ${chapter.id} with order ${addResourceDto.order}`);
    try {
      return await this.chapterContentUnitsRepository.save(newContentUnit);
    } catch (error) {
      // Log detailed error if it's a unique constraint violation or other DB issue
      console.error("Error adding resource to chapter:", error);
      if (error.code === '23505') { // Unique violation code for PostgreSQL
          throw new BadRequestException('This resource is already added to this chapter or order conflicts (if order is unique).');
      }
      throw new InternalServerErrorException("Failed to add resource to chapter.");
    }
  }

  async removeResourceFromChapter(
    courseId: number,
    chapterId: number,
    resourceId: string, // resourceId from path, not contentUnitId
    teacher: User
  ): Promise<void> {
    const course = await this.findCourseByIdWithAuthCheck(courseId, teacher.id);
    const chapter = await this.chaptersRepository.findOne({ where: { id: chapterId, courseId: course.id } });
    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${chapterId} in course ${courseId} not found.`);
    }

    const contentUnit = await this.chapterContentUnitsRepository.findOne({
      where: { chapterId: chapter.id, resourceId: resourceId },
    });

    if (!contentUnit) {
      throw new NotFoundException(`Resource with ID ${resourceId} not found in chapter ${chapterId}.`);
    }

    // console.log(`Attempting to remove resource ${resourceId} from chapter ${chapter.id}`);
    try {
      await this.chapterContentUnitsRepository.remove(contentUnit);
    } catch (error) {
      console.error("Error removing resource from chapter:", error);
      throw new InternalServerErrorException("Failed to remove resource from chapter.");
    }
  }

  async updateResourceOrderInChapter(
    courseId: number,
    chapterId: number,
    orderUpdates: ChapterResourceOrderUpdateItemDto[],
    teacher: User
  ): Promise<ChapterContentUnit[]> {
    const course = await this.findCourseByIdWithAuthCheck(courseId, teacher.id);
    const chapter = await this.chaptersRepository.findOne({ where: { id: chapterId, courseId: course.id } });
    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${chapterId} in course ${courseId} not found.`);
    }

    // This is a complex operation if it needs to be transactional and handle order conflicts.
    // For a simpler approach, fetch all, update order, save all.
    // Or, update each item individually. Let's do individual updates for now.
    // A transaction would be better for atomicity.

    const updatedUnits: ChapterContentUnit[] = [];
    for (const update of orderUpdates) {
        const unit = await this.chapterContentUnitsRepository.findOne({where: {id: update.contentUnitId, chapterId: chapter.id}});
        if (unit) {
            unit.order = update.order;
            // Consider potential unique constraint violations on 'order' if (chapter, order) is unique
            try {
                updatedUnits.push(await this.chapterContentUnitsRepository.save(unit));
            } catch (error) {
                 console.error(`Error updating order for content unit ${unit.id}:`, error);
                 // Collect errors or throw immediately
                 throw new InternalServerErrorException(`Failed to update order for unit ${unit.id}.`);
            }
        } else {
            console.warn(`Content unit with ID ${update.contentUnitId} not found in chapter ${chapterId}. Skipping.`);
        }
    }
    // console.log(`Order updated for resources in chapter ${chapter.id}`);
    // Re-fetch to confirm order or return updatedUnits
    return this.chapterContentUnitsRepository.find({ where: { chapterId: chapter.id }, order: { order: 'ASC' }});
  }

  async getResourcesForChapter(chapterId: number): Promise<Resource[]> {
    const chapter = await this.chaptersRepository.findOne({
        where: { id: chapterId },
        // relations: ['contentUnits', 'contentUnits.resource', 'contentUnits.resource.tags'], // Deeply load related resources and their tags
    });

    if (!chapter) {
        throw new NotFoundException(`Chapter with ID ${chapterId} not found.`);
    }

    // Fetch ChapterContentUnits with their associated Resource, ordered by 'order'
    const contentUnits = await this.chapterContentUnitsRepository.find({
        where: { chapterId: chapter.id },
        relations: ['resource', 'resource.tags', 'resource.teacher'], // Ensure 'resource' and its sub-relations are loaded
        order: { order: 'ASC' },
    });

    // Extract the Resource objects from the ChapterContentUnits
    // Filter out any null/undefined resources just in case of data integrity issues
    return contentUnits.map(unit => unit.resource).filter(resource => resource != null);
  }
}
