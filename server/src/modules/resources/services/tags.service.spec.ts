import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TagsService } from './tags.service';
import { Tag } from '../entities/tag.entity';
import { InternalServerErrorException } from '@nestjs/common';

describe('TagsService', () => {
  let service: TagsService;
  let tagsRepository: Repository<Tag>;

  const mockTagsRepository = {
    findBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        {
          provide: getRepositoryToken(Tag),
          useValue: mockTagsRepository,
        },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
    tagsRepository = module.get<Repository<Tag>>(getRepositoryToken(Tag));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOrCreateTags', () => {
    it('should return empty array if no tag names provided', async () => {
      expect(await service.findOrCreateTags([])).toEqual([]);
      expect(await service.findOrCreateTags(null)).toEqual([]);
    });

    it('should return existing tags and create new ones', async () => {
      const tagNames = ['TagA', 'tagB', 'TagC ']; // Mixed case, with space
      const normalizedNames = ['taga', 'tagb', 'tagc'];
      const existingDbTags = [{ id: 1, name: 'taga' }] as Tag[];
      const newTagObjects = [{ name: 'tagb' }, { name: 'tagc' }] as Tag[]; // Before save
      const createdDbTags = [{ id: 2, name: 'tagb' }, { id: 3, name: 'tagc' }] as Tag[]; // After save

      mockTagsRepository.findBy.mockResolvedValue(existingDbTags);
      // Mock create for each new tag name
      mockTagsRepository.create.mockImplementation((tagObj: {name: string}) => ({name: tagObj.name } as Tag));
      mockTagsRepository.save.mockResolvedValue(createdDbTags); // Assuming save returns all newly created tags

      const result = await service.findOrCreateTags(tagNames);

      expect(mockTagsRepository.findBy).toHaveBeenCalledWith({ name: In(normalizedNames) });
      expect(mockTagsRepository.create).toHaveBeenCalledTimes(2); // tagb, tagc
      expect(mockTagsRepository.create).toHaveBeenCalledWith({ name: 'tagb' });
      expect(mockTagsRepository.create).toHaveBeenCalledWith({ name: 'tagc' });
      expect(mockTagsRepository.save).toHaveBeenCalledWith(newTagObjects); // Assuming save is called once with an array

      expect(result).toHaveLength(3);
      expect(result).toContainEqual(existingDbTags[0]);
      createdDbTags.forEach(tag => expect(result).toContainEqual(tag));
    });

    it('should return only existing tags if all tags exist', async () => {
      const tagNames = ['TagA', 'tagB'];
      const normalizedNames = ['taga', 'tagb'];
      const existingDbTags = [{ id: 1, name: 'taga' }, { id: 2, name: 'tagb' }] as Tag[];

      mockTagsRepository.findBy.mockResolvedValue(existingDbTags);

      const result = await service.findOrCreateTags(tagNames);

      expect(mockTagsRepository.findBy).toHaveBeenCalledWith({ name: In(normalizedNames) });
      expect(mockTagsRepository.create).not.toHaveBeenCalled();
      expect(mockTagsRepository.save).not.toHaveBeenCalled();
      expect(result).toEqual(existingDbTags);
    });

    it('should throw InternalServerErrorException on findBy failure', async () => {
        mockTagsRepository.findBy.mockRejectedValue(new Error('DB error'));
        await expect(service.findOrCreateTags(['test'])).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException on save failure', async () => {
        mockTagsRepository.findBy.mockResolvedValue([]); // No existing tags
        mockTagsRepository.create.mockReturnValue({ name: 'test' } as Tag);
        mockTagsRepository.save.mockRejectedValue(new Error('DB error'));
        await expect(service.findOrCreateTags(['test'])).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getAllTags', () => {
    it('should return an array of tags ordered by name', async () => {
      const expectedTags = [{ id: 1, name: 'Alpha' }, { id: 2, name: 'Beta' }] as Tag[];
      mockTagsRepository.find.mockResolvedValue(expectedTags);
      const result = await service.getAllTags();
      expect(mockTagsRepository.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
      expect(result).toEqual(expectedTags);
    });

    it('should throw InternalServerErrorException on find failure', async () => {
        mockTagsRepository.find.mockRejectedValue(new Error('DB error'));
        await expect(service.getAllTags()).rejects.toThrow(InternalServerErrorException);
    });
  });
});
