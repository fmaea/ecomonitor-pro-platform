import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ResourcesService } from './resources.service';
import { TagsService } from './tags.service';
import { Resource, ResourceType } from '../entities/resource.entity';
import { Tag } from '../entities/tag.entity';
import { User, UserRole } from '../../users/entities/user.entity';
import { CreateResourceDto } from '../dto/create-resource.dto';
import { UpdateResourceDto } from '../dto/update-resource.dto';
import { NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';

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
  authoredResources: [],
});

describe('ResourcesService', () => {
  let service: ResourcesService;
  let resourcesRepository: Repository<Resource>;
  let tagsRepository: Repository<Tag>; // Keep this for findBy({id: In(...)})
  let tagsService: TagsService;

  const mockResourcesRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnThis(), // Basic mock for query builder
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockTagsRepository = {
    findBy: jest.fn(),
  };

  const mockTagsService = {
    findOrCreateTags: jest.fn(),
    getAllTags: jest.fn(),
  };

  beforeEach(async () => {
    // Reset queryBuilder mocks for each test if needed
    Object.assign(mockResourcesRepository, {
        createQueryBuilder: jest.fn(() => mockResourcesRepository), // Return self for chaining
        leftJoinAndSelect: jest.fn(() => mockResourcesRepository),
        andWhere: jest.fn(() => mockResourcesRepository),
        orderBy: jest.fn(() => mockResourcesRepository),
        getMany: jest.fn(), // This will be mocked per test where queryBuilder is used
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourcesService,
        { provide: getRepositoryToken(Resource), useValue: mockResourcesRepository },
        { provide: getRepositoryToken(Tag), useValue: mockTagsRepository },
        { provide: TagsService, useValue: mockTagsService },
      ],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
    resourcesRepository = module.get<Repository<Resource>>(getRepositoryToken(Resource));
    tagsRepository = module.get<Repository<Tag>>(getRepositoryToken(Tag));
    tagsService = module.get<TagsService>(TagsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createResource', () => {
    const teacher = mockUser(1);
    const createDto: CreateResourceDto = {
      title: 'New Resource',
      type: ResourceType.TEXT,
      content_data: { text: 'Hello' },
      newTags: ['newTag1'],
      tagIds: [1],
    };
    const newTagsFromService = [{ id: 2, name: 'newtag1' }] as Tag[];
    const existingTagsFromRepo = [{ id: 1, name: 'existingtag' }] as Tag[];
    const finalResource = { id: 'uuid-1', ...createDto, teacher, tags: [...newTagsFromService, ...existingTagsFromRepo] } as unknown as Resource;


    it('should create and return a resource with tags', async () => {
      mockTagsService.findOrCreateTags.mockResolvedValue(newTagsFromService);
      mockTagsRepository.findBy.mockResolvedValue(existingTagsFromRepo);
      mockResourcesRepository.create.mockReturnValue(finalResource); // Mock create to return the object with tags
      mockResourcesRepository.save.mockResolvedValue(finalResource);

      const result = await service.createResource(createDto, teacher);

      expect(tagsService.findOrCreateTags).toHaveBeenCalledWith(createDto.newTags);
      expect(tagsRepository.findBy).toHaveBeenCalledWith({ id: In(createDto.tagIds) });
      expect(mockResourcesRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        title: createDto.title,
        teacherId: teacher.id,
        // tags should be a merged list here
      }));
      expect(mockResourcesRepository.save).toHaveBeenCalledWith(finalResource);
      expect(result).toEqual(finalResource);
    });

    it('should handle creation with only newTags', async () => {
        const dto: CreateResourceDto = { ...createDto, tagIds: undefined };
        mockTagsService.findOrCreateTags.mockResolvedValue(newTagsFromService);
        // tagsRepository.findBy should not be called
        mockResourcesRepository.create.mockReturnValue({ ...finalResource, tags: newTagsFromService } as any);
        mockResourcesRepository.save.mockResolvedValue({ ...finalResource, tags: newTagsFromService } as any);

        await service.createResource(dto, teacher);
        expect(tagsService.findOrCreateTags).toHaveBeenCalledWith(dto.newTags);
        expect(tagsRepository.findBy).not.toHaveBeenCalled();
    });

    it('should handle creation with only tagIds', async () => {
        const dto: CreateResourceDto = { ...createDto, newTags: undefined };
        // tagsService.findOrCreateTags should not be called
        mockTagsRepository.findBy.mockResolvedValue(existingTagsFromRepo);
        mockResourcesRepository.create.mockReturnValue({ ...finalResource, tags: existingTagsFromRepo } as any);
        mockResourcesRepository.save.mockResolvedValue({ ...finalResource, tags: existingTagsFromRepo } as any);

        await service.createResource(dto, teacher);
        expect(tagsService.findOrCreateTags).not.toHaveBeenCalled();
        expect(tagsRepository.findBy).toHaveBeenCalledWith({ id: In(dto.tagIds) });
    });

    it('should throw InternalServerErrorException on save failure', async () => {
        mockResourcesRepository.save.mockRejectedValue(new Error('DB error'));
        await expect(service.createResource(createDto, teacher)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findAllResources', () => {
    it('should find all resources with various filters', async () => {
      const expectedResources = [{id: '1', title: 'Resource 1'}] as Resource[];
      mockResourcesRepository.getMany.mockResolvedValue(expectedResources); // Mock getMany for the queryBuilder

      const result = await service.findAllResources({ tag: 'test', type: 'text', teacherId: 1 });

      expect(mockResourcesRepository.createQueryBuilder).toHaveBeenCalledWith('resource');
      expect(mockResourcesRepository.leftJoinAndSelect).toHaveBeenCalledWith('resource.teacher', 'teacher');
      expect(mockResourcesRepository.leftJoinAndSelect).toHaveBeenCalledWith('resource.tags', 'tag_entity');
      expect(mockResourcesRepository.andWhere).toHaveBeenCalledWith('resource.type = :type', { type: 'text' });
      expect(mockResourcesRepository.andWhere).toHaveBeenCalledWith('resource.teacherId = :teacherId', { teacherId: 1 });
      expect(mockResourcesRepository.andWhere).toHaveBeenCalledWith('tag_entity.name = :tagName', { tagName: 'test' });
      expect(mockResourcesRepository.orderBy).toHaveBeenCalledWith('resource.createdAt', 'DESC');
      expect(mockResourcesRepository.getMany).toHaveBeenCalled();
      expect(result).toEqual(expectedResources);
    });
  });

  describe('findResourceById', () => {
    it('should return a resource if found', async () => {
      const resourceId = 'uuid-1';
      const expectedResource = { id: resourceId, title: 'Test Resource' } as Resource;
      mockResourcesRepository.findOne.mockResolvedValue(expectedResource);
      const result = await service.findResourceById(resourceId);
      expect(mockResourcesRepository.findOne).toHaveBeenCalledWith({ where: { id: resourceId }, relations: ['teacher', 'tags'] });
      expect(result).toEqual(expectedResource);
    });

    it('should throw NotFoundException if resource not found', async () => {
      mockResourcesRepository.findOne.mockResolvedValue(null);
      await expect(service.findResourceById('uuid-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findResourcesByTeacher', () => {
    it('should return resources for a teacher', async () => {
        const teacherId = 1;
        const expectedResources = [{id: '1', title: 'Resource 1', teacherId}] as Resource[];
        mockResourcesRepository.find.mockResolvedValue(expectedResources);
        const result = await service.findResourcesByTeacher(teacherId);
        expect(mockResourcesRepository.find).toHaveBeenCalledWith({
            where: { teacherId },
            relations: ['tags'],
            order: { createdAt: 'DESC' },
        });
        expect(result).toEqual(expectedResources);
    });
  });

  describe('updateResource', () => {
    const teacher = mockUser(1);
    const resourceId = 'uuid-1';
    const updateDto: UpdateResourceDto = { title: 'Updated Title', newTags: ['updatedTag'] };
    const existingResource = { id: resourceId, title: 'Old Title', teacherId: teacher.id, teacher: teacher } as Resource;
    const updatedTags = [{id: 3, name: 'updatedtag'}] as Tag[];

    it('should update resource if teacher owns it', async () => {
      mockResourcesRepository.findOne.mockResolvedValue(existingResource);
      mockTagsService.findOrCreateTags.mockResolvedValue(updatedTags);
      mockResourcesRepository.save.mockImplementation(res => Promise.resolve(res)); // Save returns the passed entity

      const result = await service.updateResource(resourceId, updateDto, teacher);

      expect(mockResourcesRepository.findOne).toHaveBeenCalledWith({ where: {id: resourceId}, relations: ['teacher']});
      expect(tagsService.findOrCreateTags).toHaveBeenCalledWith(updateDto.newTags);
      expect(mockResourcesRepository.save).toHaveBeenCalledWith(expect.objectContaining({ title: 'Updated Title', tags: updatedTags }));
      expect(result.title).toEqual('Updated Title');
      expect(result.tags).toEqual(updatedTags);
    });

    it('should throw NotFoundException if resource to update not found', async () => {
        mockResourcesRepository.findOne.mockResolvedValue(null);
        await expect(service.updateResource(resourceId, updateDto, teacher)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if teacher does not own resource', async () => {
        const otherTeacher = mockUser(2);
        mockResourcesRepository.findOne.mockResolvedValue(existingResource); // Resource owned by teacher 1
        await expect(service.updateResource(resourceId, updateDto, otherTeacher)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeResource', () => {
    const teacher = mockUser(1);
    const resourceId = 'uuid-1';
    const existingResource = { id: resourceId, title: 'Test Resource', teacherId: teacher.id, teacher: teacher } as Resource;

    it('should remove resource if teacher owns it', async () => {
      mockResourcesRepository.findOne.mockResolvedValue(existingResource);
      mockResourcesRepository.remove.mockResolvedValue(undefined); // remove returns void

      await service.removeResource(resourceId, teacher);
      expect(mockResourcesRepository.findOne).toHaveBeenCalledWith({ where: {id: resourceId}, relations: ['teacher']});
      expect(mockResourcesRepository.remove).toHaveBeenCalledWith(existingResource);
    });

    it('should throw ForbiddenException if teacher does not own resource for deletion', async () => {
        const otherTeacher = mockUser(2);
        mockResourcesRepository.findOne.mockResolvedValue(existingResource); // Resource owned by teacher 1
        await expect(service.removeResource(resourceId, otherTeacher)).rejects.toThrow(ForbiddenException);
    });
  });
});
