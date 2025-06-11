import { Test, TestingModule } from '@nestjs/testing';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from '../services/resources.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { User, UserRole } from '../../users/entities/user.entity';
import { CreateResourceDto } from '../dto/create-resource.dto';
import { Resource, ResourceType } from '../entities/resource.entity';

const mockUser = (id: number, role: UserRole = UserRole.TEACHER): User => ({
  id, username: `user${id}`, email: `user${id}@example.com`, role,
  firstName: 'Test', lastName: 'User', createdAt: new Date(), updatedAt: new Date(),
  hashPassword: jest.fn(), validatePassword: jest.fn(), courses: [], authoredResources: [],
});

describe('ResourcesController', () => {
  let controller: ResourcesController;
  let service: ResourcesService;

  const mockResourcesService = {
    createResource: jest.fn(),
    findAllResources: jest.fn(),
    findResourceById: jest.fn(),
    findResourcesByTeacher: jest.fn(),
    updateResource: jest.fn(),
    removeResource: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResourcesController],
      providers: [{ provide: ResourcesService, useValue: mockResourcesService }],
    })
    .overrideGuard(JwtAuthGuard).useValue({ canActivate: jest.fn(() => true) })
    .overrideGuard(RolesGuard).useValue({ canActivate: jest.fn(() => true) })
    .compile();

    controller = module.get<ResourcesController>(ResourcesController);
    service = module.get<ResourcesService>(ResourcesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createResource', () => {
    it('should call service to create a resource', async () => {
      const dto: CreateResourceDto = { title: 'Test', type: ResourceType.TEXT, content_data: {} };
      const user = mockUser(1);
      const expectedResult = { id: 'uuid-1' } as Resource;
      mockResourcesService.createResource.mockResolvedValue(expectedResult);

      const result = await controller.createResource(dto, user);
      expect(service.createResource).toHaveBeenCalledWith(dto, user);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAllResources', () => {
    it('should call service to find all resources', async () => {
      const expectedResult = [{ id: 'uuid-1' }] as Resource[];
      mockResourcesService.findAllResources.mockResolvedValue(expectedResult);
      const result = await controller.findAllResources();
      expect(service.findAllResources).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  // Add similar basic tests for other endpoints:
  // findResourceById, findMyTeachingResources, updateResource, removeResource
  // to ensure they call the respective service methods.
});
