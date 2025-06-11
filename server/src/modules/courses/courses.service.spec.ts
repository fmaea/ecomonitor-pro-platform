import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoursesService } from './courses.service';
import { Course } from './entities/course.entity';
import { Chapter } from './entities/chapter.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';

// Mock User for testing
const mockUser = (id: number, role: UserRole = UserRole.TEACHER): User => ({
  id,
  username: `user${id}`,
  email: `user${id}@example.com`,
  role,
  firstName: 'Test',
  lastName: 'User',
  createdAt: new Date(),
  updatedAt: new Date(),
  hashPassword: jest.fn(),
  validatePassword: jest.fn(),
  courses: [], // Initialize as empty or provide mock courses if needed
});


describe('CoursesService', () => {
  let service: CoursesService;
  let courseRepository: Repository<Course>;
  let chapterRepository: Repository<Chapter>;

  const mockCourseRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockChapterRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getRepositoryToken(Course), useValue: mockCourseRepository },
        { provide: getRepositoryToken(Chapter), useValue: mockChapterRepository },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    courseRepository = module.get<Repository<Course>>(getRepositoryToken(Course));
    chapterRepository = module.get<Repository<Chapter>>(getRepositoryToken(Chapter));

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Course Method Tests ---
  describe('createCourse', () => {
    it('should create and return a course', async () => {
      const teacher = mockUser(1);
      const createCourseDto: CreateCourseDto = { title: 'New Course', description: 'A great course' };
      const expectedCourse = { id: 1, ...createCourseDto, teacherId: teacher.id, teacher } as Course;

      mockCourseRepository.create.mockReturnValue(expectedCourse);
      mockCourseRepository.save.mockResolvedValue(expectedCourse);

      const result = await service.createCourse(createCourseDto, teacher);
      expect(mockCourseRepository.create).toHaveBeenCalledWith({ ...createCourseDto, teacherId: teacher.id, teacher });
      expect(mockCourseRepository.save).toHaveBeenCalledWith(expectedCourse);
      expect(result).toEqual(expectedCourse);
    });
     it('should throw InternalServerErrorException on save failure', async () => {
      const teacher = mockUser(1);
      const createCourseDto: CreateCourseDto = { title: 'New Course' };
      mockCourseRepository.create.mockReturnValue({} as Course); // Don't care about this part for this test
      mockCourseRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.createCourse(createCourseDto, teacher)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findAllCourses', () => {
    it('should return an array of courses', async () => {
      const expectedCourses = [{ id: 1, title: 'Course 1' }] as Course[];
      mockCourseRepository.find.mockResolvedValue(expectedCourses);
      const result = await service.findAllCourses();
      expect(result).toEqual(expectedCourses);
    });
  });

  describe('findCourseById', () => {
    it('should return a course if found', async () => {
      const courseId = 1;
      const expectedCourse = { id: courseId, title: 'Test Course', chapters: [{id: 1, order: 2}, {id: 2, order: 1}] } as Course;
      mockCourseRepository.findOne.mockResolvedValue(expectedCourse);

      const result = await service.findCourseById(courseId);
      expect(mockCourseRepository.findOne).toHaveBeenCalledWith({ where: { id: courseId }, relations: ['teacher', 'chapters'] });
      expect(result).toEqual(expectedCourse);
      expect(result.chapters[0].order).toBe(1); // Check sorting
    });

    it('should throw NotFoundException if course not found', async () => {
      mockCourseRepository.findOne.mockResolvedValue(null);
      await expect(service.findCourseById(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findCoursesByTeacher', () => {
    it('should return courses for a teacher', async () => {
      const teacherId = 1;
      const expectedCourses = [{ id: 1, title: 'Course 1', teacherId }] as Course[];
      mockCourseRepository.find.mockResolvedValue(expectedCourses);
      const result = await service.findCoursesByTeacher(teacherId);
      expect(mockCourseRepository.find).toHaveBeenCalledWith({ where: { teacherId }, relations: ['chapters'] });
      expect(result).toEqual(expectedCourses);
    });
  });

  describe('updateCourse', () => {
    const teacher = mockUser(1);
    const courseId = 1;
    const updateDto: UpdateCourseDto = { title: 'Updated Title' };
    const existingCourse = { id: courseId, title: 'Old Title', teacherId: teacher.id } as Course;

    it('should update and return a course if teacher owns it', async () => {
      mockCourseRepository.findOne.mockResolvedValue(existingCourse); // For findCourseByIdWithAuthCheck
      mockCourseRepository.save.mockResolvedValue({ ...existingCourse, ...updateDto });

      const result = await service.updateCourse(courseId, updateDto, teacher);
      expect(mockCourseRepository.findOne).toHaveBeenCalledWith({ where: { id: courseId } });
      expect(mockCourseRepository.save).toHaveBeenCalledWith(expect.objectContaining(updateDto));
      expect(result.title).toEqual(updateDto.title);
    });

    it('should throw NotFoundException if course not found', async () => {
      mockCourseRepository.findOne.mockResolvedValue(null);
      await expect(service.updateCourse(courseId, updateDto, teacher)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if teacher does not own the course', async () => {
      const anotherTeacher = mockUser(2);
      mockCourseRepository.findOne.mockResolvedValue(existingCourse); // Course belongs to teacher 1
      await expect(service.updateCourse(courseId, updateDto, anotherTeacher)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeCourse', () => {
    const teacher = mockUser(1);
    const courseId = 1;
    const existingCourse = { id: courseId, title: 'Test Course', teacherId: teacher.id } as Course;

    it('should remove a course if teacher owns it', async () => {
      mockCourseRepository.findOne.mockResolvedValue(existingCourse);
      mockCourseRepository.remove.mockResolvedValue(undefined); // remove returns void

      await service.removeCourse(courseId, teacher);
      expect(mockCourseRepository.findOne).toHaveBeenCalledWith({ where: { id: courseId } });
      expect(mockCourseRepository.remove).toHaveBeenCalledWith(existingCourse);
    });

    it('should throw ForbiddenException if teacher does not own course', async () => {
      const otherTeacher = mockUser(2);
      mockCourseRepository.findOne.mockResolvedValue({ ...existingCourse, teacherId: 1 });
      await expect(service.removeCourse(courseId, otherTeacher)).rejects.toThrow(ForbiddenException);
    });
  });

  // --- Chapter Method Tests ---
  describe('createChapter', () => {
    const teacher = mockUser(1);
    const courseId = 1;
    const parentCourse = { id: courseId, title: 'Parent Course', teacherId: teacher.id, chapters: [] } as Course;
    const createChapterDto: CreateChapterDto = { title: 'New Chapter', content: 'Content', order: 1 };
    const expectedChapter = { id: 1, ...createChapterDto, courseId: parentCourse.id, course: parentCourse } as Chapter;

    it('should create a chapter if teacher owns the course', async () => {
      mockCourseRepository.findOne.mockResolvedValue(parentCourse); // For findCourseByIdWithAuthCheck
      mockChapterRepository.create.mockReturnValue(expectedChapter);
      mockChapterRepository.save.mockResolvedValue(expectedChapter);

      const result = await service.createChapter(courseId, createChapterDto, teacher);
      expect(mockCourseRepository.findOne).toHaveBeenCalledWith({ where: { id: courseId } });
      expect(mockChapterRepository.create).toHaveBeenCalledWith({ ...createChapterDto, courseId: parentCourse.id, course: parentCourse });
      expect(mockChapterRepository.save).toHaveBeenCalledWith(expectedChapter);
      expect(result).toEqual(expectedChapter);
    });

    it('should throw ForbiddenException if teacher does not own course', async () => {
      const otherTeacher = mockUser(2);
      mockCourseRepository.findOne.mockResolvedValue({ ...parentCourse, teacherId: 1 });
      await expect(service.createChapter(courseId, createChapterDto, otherTeacher)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findChapterById', () => {
    it('should return a chapter if found', async () => {
        const chapterId = 1;
        const expectedChapter = { id: chapterId, title: 'Test Chapter' } as Chapter;
        mockChapterRepository.findOne.mockResolvedValue(expectedChapter);
        const result = await service.findChapterById(chapterId);
        expect(mockChapterRepository.findOne).toHaveBeenCalledWith({ where: { id: chapterId }, relations: ['course'] });
        expect(result).toEqual(expectedChapter);
    });

    it('should throw NotFoundException if chapter not found', async () => {
        mockChapterRepository.findOne.mockResolvedValue(null);
        await expect(service.findChapterById(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findChaptersByCourseId', () => {
    it('should return chapters for a course ordered by `order`', async () => {
      const courseId = 1;
      const chapters = [{id: 1, order: 2}, {id:2, order: 1}] as Chapter[];
      mockChapterRepository.find.mockResolvedValue(chapters);
      const result = await service.findChaptersByCourseId(courseId);
      expect(mockChapterRepository.find).toHaveBeenCalledWith({ where: { courseId }, order: { order: 'ASC' } });
      expect(result).toEqual(chapters);
    });
  });

  describe('updateChapter', () => {
    const teacher = mockUser(1);
    const chapterId = 1;
    const courseId = 1;
    const parentCourse = { id: courseId, teacherId: teacher.id } as Course;
    const existingChapter = { id: chapterId, title: 'Old Chapter', course: parentCourse, courseId: courseId } as Chapter;
    const updateDto: UpdateChapterDto = { title: 'Updated Chapter Title' };

    it('should update chapter if teacher owns parent course', async () => {
      mockChapterRepository.findOne.mockResolvedValue(existingChapter);
      mockChapterRepository.save.mockResolvedValue({ ...existingChapter, ...updateDto });

      const result = await service.updateChapter(chapterId, updateDto, teacher);
      expect(mockChapterRepository.findOne).toHaveBeenCalledWith({ where: { id: chapterId }, relations: ['course'] });
      expect(mockChapterRepository.save).toHaveBeenCalledWith(expect.objectContaining(updateDto));
      expect(result.title).toEqual(updateDto.title);
    });

    it('should throw NotFoundException if chapter not found', async () => {
      mockChapterRepository.findOne.mockResolvedValue(null);
      await expect(service.updateChapter(chapterId, updateDto, teacher)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if teacher does not own parent course', async () => {
      const anotherTeacher = mockUser(2);
      const chapterOwnedByTeacher1 = { ...existingChapter, course: { ...parentCourse, teacherId: teacher.id }};
      mockChapterRepository.findOne.mockResolvedValue(chapterOwnedByTeacher1);
      await expect(service.updateChapter(chapterId, updateDto, anotherTeacher)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeChapter', () => {
    const teacher = mockUser(1);
    const chapterId = 1;
    const courseId = 1;
    const parentCourse = { id: courseId, teacherId: teacher.id } as Course;
    const existingChapter = { id: chapterId, title: 'Old Chapter', course: parentCourse, courseId: courseId } as Chapter;

    it('should remove chapter if teacher owns parent course', async () => {
      mockChapterRepository.findOne.mockResolvedValue(existingChapter);
      mockChapterRepository.remove.mockResolvedValue(undefined);

      await service.removeChapter(chapterId, teacher);
      expect(mockChapterRepository.findOne).toHaveBeenCalledWith({ where: { id: chapterId }, relations: ['course'] });
      expect(mockChapterRepository.remove).toHaveBeenCalledWith(existingChapter);
    });

     it('should throw ForbiddenException if teacher does not own parent course for chapter deletion', async () => {
      const anotherTeacher = mockUser(2); // Different teacher
      mockChapterRepository.findOne.mockResolvedValue(existingChapter); // Chapter's course is owned by 'teacher' (ID 1)
      await expect(service.removeChapter(chapterId, anotherTeacher)).rejects.toThrow(ForbiddenException);
    });
  });
});
