import { Test, TestingModule } from '@nestjs/testing';
import { TagsController } from './tags.controller';
import { TagsService } from '../services/tags.service';
import { Tag } from '../entities/tag.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

describe('TagsController', () => {
  let controller: TagsController;
  let service: TagsService;

  const mockTagsService = {
    getAllTags: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagsController],
      providers: [{ provide: TagsService, useValue: mockTagsService }],
    })
    // If getAllTags is protected, mock JwtAuthGuard here
    // .overrideGuard(JwtAuthGuard).useValue({ canActivate: jest.fn(() => true) })
    .compile();

    controller = module.get<TagsController>(TagsController);
    service = module.get<TagsService>(TagsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllTags', () => {
    it('should call service to get all tags', async () => {
      const expectedResult = [{ id: 1, name: 'Tag1' }] as Tag[];
      mockTagsService.getAllTags.mockResolvedValue(expectedResult);

      const result = await controller.getAllTags();
      expect(service.getAllTags).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });
});
