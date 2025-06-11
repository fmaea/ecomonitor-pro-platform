import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from './courses.controller';
import { CoursesService } from '../courses.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { User, UserRole } from '../../users/entities/user.entity';
import { AddResourceToChapterDto } from '../dto/add-resource-to-chapter.dto';
import { UpdateChapterResourceOrderDto, ChapterResourceOrderUpdateItemDto } from '../dto/update-chapter-resource-order.dto';
import { ChapterContentUnit } from '../entities/chapter-content-unit.entity';
import { Resource } from '../../resources/entities/resource.entity';

// Mock user for decorator
const mockUser = (id: number, role: UserRole = UserRole.TEACHER): User => ({
  id, username: `user${id}`, email: `user${id}@example.com`, role,
  firstName: 'Test', lastName: 'User', createdAt: new Date(), updatedAt: new Date(),
  hashPassword: jest.fn(), validatePassword: jest.fn(), courses: [], authoredResources: [],
});

describe('CoursesController', () => {
  let controller: CoursesController;
  let service: CoursesService;

  const mockCoursesService = {
    addResourceToChapter: jest.fn(),
    removeResourceFromChapter: jest.fn(),
    updateResourceOrderInChapter: jest.fn(),
    getResourcesForChapter: jest.fn(),
    // Mock other methods used by existing controller tests if any were present
    createCourse: jest.fn(),
    findAllCourses: jest.fn(),
    findCourseById: jest.fn(),
    findCoursesByTeacher: jest.fn(),
    updateCourse: jest.fn(),
    removeCourse: jest.fn(),
    createChapter: jest.fn(),
    findChaptersByCourseId: jest.fn(),
    findChapterById: jest.fn(),
    updateChapter: jest.fn(),
    removeChapter: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        { provide: CoursesService, useValue: mockCoursesService },
      ],
    })
    .overrideGuard(JwtAuthGuard).useValue({ canActivate: jest.fn(() => true) }) // Mock guards
    .overrideGuard(RolesGuard).useValue({ canActivate: jest.fn(() => true) })
    .compile();

    controller = module.get<CoursesController>(CoursesController);
    service = module.get<CoursesService>(CoursesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addResourceToChapter', () => {
    it('should call service to add resource to chapter', async () => {
      const courseId = 1;
      const chapterId = 1;
      const dto: AddResourceToChapterDto = { resourceId: 'uuid-res-1', order: 1 };
      const user = mockUser(1);
      const expectedResult = { id: 'uuid-ccu-1' } as ChapterContentUnit;
      mockCoursesService.addResourceToChapter.mockResolvedValue(expectedResult);

      const result = await controller.addResourceToChapter(courseId, chapterId, dto, user);
      expect(service.addResourceToChapter).toHaveBeenCalledWith(courseId, chapterId, dto, user);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('removeResourceFromChapter', () => {
    it('should call service to remove resource from chapter', async () => {
      const courseId = 1;
      const chapterId = 1;
      const resourceId = 'uuid-res-1';
      const user = mockUser(1);
      mockCoursesService.removeResourceFromChapter.mockResolvedValue(undefined);

      await controller.removeResourceFromChapter(courseId, chapterId, resourceId, user);
      expect(service.removeResourceFromChapter).toHaveBeenCalledWith(courseId, chapterId, resourceId, user);
    });
  });

  describe('updateResourceOrderInChapter', () => {
    it('should call service to update resource order', async () => {
      const courseId = 1;
      const chapterId = 1;
      const orderItem: ChapterResourceOrderUpdateItemDto = { contentUnitId: 'uuid-ccu-1', order: 1 };
      const dto: UpdateChapterResourceOrderDto = { orderUpdates: [orderItem] };
      const user = mockUser(1);
      const expectedResult = [{ id: 'uuid-ccu-1', order: 1 }] as ChapterContentUnit[];
      mockCoursesService.updateResourceOrderInChapter.mockResolvedValue(expectedResult);

      const result = await controller.updateResourceOrderInChapter(courseId, chapterId, dto, user);
      expect(service.updateResourceOrderInChapter).toHaveBeenCalledWith(courseId, chapterId, dto.orderUpdates, user);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getResourcesForChapter', () => {
    it('should call service to get resources for a chapter', async () => {
      const chapterId = 1;
      const courseId = 1; // courseId from path, though service might not use it if chapterId is globally unique
      const expectedResult = [{ id: 'uuid-res-1', title: 'Resource 1' }] as Resource[];
      mockCoursesService.getResourcesForChapter.mockResolvedValue(expectedResult);

      const result = await controller.getResourcesForChapter(chapterId);
      expect(service.getResourcesForChapter).toHaveBeenCalledWith(chapterId);
      expect(result).toEqual(expectedResult);
    });
  });
});
