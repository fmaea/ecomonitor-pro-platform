import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoursesService } from './courses.service';
import { Course } from './entities/course.entity';
import { Chapter } from './entities/chapter.entity';
import { ChapterContentUnit } from './entities/chapter-content-unit.entity'; // Added
import { Resource } from '../resources/entities/resource.entity'; // Added
import { User, UserRole } from '../users/entities/user.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { AddResourceToChapterDto } from './dto/add-resource-to-chapter.dto'; // Added
import { ChapterResourceOrderUpdateItemDto } from './dto/update-chapter-resource-order.dto'; // Added
import { NotFoundException, ForbiddenException, InternalServerErrorException, BadRequestException } from '@nestjs/common'; // Added BadRequestException

// Mock User for testing - Added authoredResources for completeness
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
  courses: [],
  authoredResources: [], // Added
});

const mockResource = (id: string, teacherId: number): Partial<Resource> => ({
  id,
  title: `Resource ${id}`,
  teacherId,
});


describe('CoursesService', () => {
  let service: CoursesService;
  let courseRepository: Repository<Course>;
  let chapterRepository: Repository<Chapter>;
  let chapterContentUnitsRepository: Repository<ChapterContentUnit>; // Added
  let resourcesRepository: Repository<Resource>; // Added


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

  const mockChapterContentUnitsRepository = { // Added
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockResourcesRepository = { // Added
      findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getRepositoryToken(Course), useValue: mockCourseRepository },
        { provide: getRepositoryToken(Chapter), useValue: mockChapterRepository },
        { provide: getRepositoryToken(ChapterContentUnit), useValue: mockChapterContentUnitsRepository }, // Added
        { provide: getRepositoryToken(Resource), useValue: mockResourcesRepository }, // Added
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    courseRepository = module.get<Repository<Course>>(getRepositoryToken(Course));
    chapterRepository = module.get<Repository<Chapter>>(getRepositoryToken(Chapter));
    chapterContentUnitsRepository = module.get<Repository<ChapterContentUnit>>(getRepositoryToken(ChapterContentUnit)); // Added
    resourcesRepository = module.get<Repository<Resource>>(getRepositoryToken(Resource)); // Added


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

  // --- Chapter Resource Linking Tests ---
  describe('addResourceToChapter', () => {
    const teacher = mockUser(1);
    const courseId = 1;
    const chapterId = 1;
    const resourceId = 'uuid-resource-1';
    const addDto: AddResourceToChapterDto = { resourceId, order: 1 };
    const mockCourse = { id: courseId, teacherId: teacher.id } as Course;
    const mockChapter = { id: chapterId, courseId } as Chapter;
    const mockResourceEntity = mockResource(resourceId, teacher.id) as Resource;
    const mockContentUnit = { id: 'uuid-ccu-1', chapterId, resourceId, order: 1 } as ChapterContentUnit;

    beforeEach(() => {
        mockCourseRepository.findOne.mockResolvedValue(mockCourse);
        mockChapterRepository.findOne.mockResolvedValue(mockChapter);
        mockResourcesRepository.findOne.mockResolvedValue(mockResourceEntity);
        mockChapterContentUnitsRepository.findOne.mockResolvedValue(null); // Assume not existing for most tests
        mockChapterContentUnitsRepository.create.mockReturnValue(mockContentUnit);
        mockChapterContentUnitsRepository.save.mockResolvedValue(mockContentUnit);
    });

    it('should successfully add a resource to a chapter', async () => {
      const result = await service.addResourceToChapter(courseId, chapterId, addDto, teacher);
      expect(mockCourseRepository.findOne).toHaveBeenCalledWith({ where: { id: courseId } });
      expect(mockChapterRepository.findOne).toHaveBeenCalledWith({ where: { id: chapterId, courseId } });
      expect(mockResourcesRepository.findOne).toHaveBeenCalledWith({ where: { id: resourceId } });
      expect(mockChapterContentUnitsRepository.create).toHaveBeenCalledWith({ chapterId, resourceId, order: addDto.order });
      expect(mockChapterContentUnitsRepository.save).toHaveBeenCalledWith(mockContentUnit);
      expect(result).toEqual(mockContentUnit);
    });

    it('should throw ForbiddenException if teacher does not own course', async () => {
        const otherTeacher = mockUser(2);
        // Course is owned by teacher 1
        await expect(service.addResourceToChapter(courseId, chapterId, addDto, otherTeacher)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if chapter not found in course', async () => {
        mockChapterRepository.findOne.mockResolvedValue(null);
        await expect(service.addResourceToChapter(courseId, chapterId, addDto, teacher)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if resource not found', async () => {
        mockResourcesRepository.findOne.mockResolvedValue(null);
        await expect(service.addResourceToChapter(courseId, chapterId, addDto, teacher)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if resource already linked to chapter', async () => {
        mockChapterContentUnitsRepository.findOne.mockResolvedValue(mockContentUnit); // Resource already exists
        await expect(service.addResourceToChapter(courseId, chapterId, addDto, teacher)).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException on save failure', async () => {
        mockChapterContentUnitsRepository.save.mockRejectedValue(new Error('DB save error'));
        await expect(service.addResourceToChapter(courseId, chapterId, addDto, teacher)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('removeResourceFromChapter', () => {
    const teacher = mockUser(1);
    const courseId = 1;
    const chapterId = 1;
    const resourceId = 'uuid-resource-1';
    const mockCourse = { id: courseId, teacherId: teacher.id } as Course;
    const mockChapter = { id: chapterId, courseId } as Chapter;
    const mockContentUnit = { id: 'uuid-ccu-1', chapterId, resourceId } as ChapterContentUnit;

    beforeEach(() => {
        mockCourseRepository.findOne.mockResolvedValue(mockCourse);
        mockChapterRepository.findOne.mockResolvedValue(mockChapter);
        mockChapterContentUnitsRepository.findOne.mockResolvedValue(mockContentUnit);
        mockChapterContentUnitsRepository.remove.mockResolvedValue(undefined);
    });

    it('should successfully remove a resource from a chapter', async () => {
      await service.removeResourceFromChapter(courseId, chapterId, resourceId, teacher);
      expect(mockChapterContentUnitsRepository.findOne).toHaveBeenCalledWith({ where: { chapterId, resourceId } });
      expect(mockChapterContentUnitsRepository.remove).toHaveBeenCalledWith(mockContentUnit);
    });

    it('should throw NotFoundException if content unit not found', async () => {
        mockChapterContentUnitsRepository.findOne.mockResolvedValue(null);
        await expect(service.removeResourceFromChapter(courseId, chapterId, resourceId, teacher)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateResourceOrderInChapter', () => {
    const teacher = mockUser(1);
    const courseId = 1;
    const chapterId = 1;
    const orderUpdates: ChapterResourceOrderUpdateItemDto[] = [
        { contentUnitId: 'uuid-ccu-1', order: 2 },
        { contentUnitId: 'uuid-ccu-2', order: 1 },
    ];
    const mockCourse = { id: courseId, teacherId: teacher.id } as Course;
    const mockChapter = { id: chapterId, courseId } as Chapter;
    const mockUnit1 = { id: 'uuid-ccu-1', chapterId, resourceId: 'res1', order: 1 } as ChapterContentUnit;
    const mockUnit2 = { id: 'uuid-ccu-2', chapterId, resourceId: 'res2', order: 2 } as ChapterContentUnit;

    beforeEach(() => {
        mockCourseRepository.findOne.mockResolvedValue(mockCourse);
        mockChapterRepository.findOne.mockResolvedValue(mockChapter);
        mockChapterContentUnitsRepository.findOne
            .mockImplementation(async ({where}: any) => {
                if (where.id === 'uuid-ccu-1') return mockUnit1;
                if (where.id === 'uuid-ccu-2') return mockUnit2;
                return null;
            });
        mockChapterContentUnitsRepository.save.mockImplementation(async (unit: any) => unit); // Save returns the unit
        mockChapterContentUnitsRepository.find.mockResolvedValue([ // Simulates re-fetch after update
            { ...mockUnit2, order: 1 },
            { ...mockUnit1, order: 2 }
        ]);
    });

    it('should update the order of resources in a chapter', async () => {
      const result = await service.updateResourceOrderInChapter(courseId, chapterId, orderUpdates, teacher);
      expect(mockChapterContentUnitsRepository.save).toHaveBeenCalledTimes(2);
      expect(mockChapterContentUnitsRepository.save).toHaveBeenCalledWith({ ...mockUnit1, order: 2 });
      expect(mockChapterContentUnitsRepository.save).toHaveBeenCalledWith({ ...mockUnit2, order: 1 });
      expect(result[0].order).toBe(1);
      expect(result[1].order).toBe(2);
    });
  });

  describe('getResourcesForChapter', () => {
    const chapterId = 1;
    const resource1 = mockResource('res1', 1) as Resource;
    const resource2 = mockResource('res2', 1) as Resource;
    const contentUnits = [
        { id: 'uuid1', chapterId, resourceId: 'res1', order: 1, resource: resource1 },
        { id: 'uuid2', chapterId, resourceId: 'res2', order: 2, resource: resource2 },
    ] as ChapterContentUnit[];
    const mockChapter = { id: chapterId, contentUnits } as Chapter;

    beforeEach(() => {
        mockChapterRepository.findOne.mockResolvedValue(mockChapter); // For initial chapter check
        mockChapterContentUnitsRepository.find.mockResolvedValue(contentUnits);
    });

    it('should return resources for a chapter, ordered by `order`', async () => {
      const result = await service.getResourcesForChapter(chapterId);
      expect(mockChapterContentUnitsRepository.find).toHaveBeenCalledWith({
          where: { chapterId },
          relations: ['resource', 'resource.tags', 'resource.teacher'],
          order: { order: 'ASC' },
      });
      expect(result).toEqual([resource1, resource2]);
    });

    it('should throw NotFoundException if chapter not found', async () => {
        mockChapterRepository.findOne.mockResolvedValue(null); // Make getResourcesForChapter's initial check fail
        mockChapterContentUnitsRepository.find.mockResolvedValue([]); // Subsequent find in getResourcesForChapter will be empty
        await expect(service.getResourcesForChapter(chapterId)).rejects.toThrow(NotFoundException);
    });
  });
});
