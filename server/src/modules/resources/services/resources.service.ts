import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Resource } from '../entities/resource.entity';
import { Tag } from '../entities/tag.entity';
import { User } from '../../users/entities/user.entity';
import { CreateResourceDto } from '../dto/create-resource.dto';
import { UpdateResourceDto } from '../dto/update-resource.dto';
import { TagsService } from './tags.service';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private resourcesRepository: Repository<Resource>,
    @InjectRepository(Tag) // May not be strictly needed if TagsService handles all Tag interactions
    private tagsRepository: Repository<Tag>,
    private tagsService: TagsService,
  ) {}

  async createResource(createResourceDto: CreateResourceDto, teacher: User): Promise<Resource> {
    const { title, type, content_data, tagIds, newTags } = createResourceDto;

    let resolvedTags: Tag[] = [];
    if (newTags && newTags.length > 0) {
      const createdOrFoundNewTags = await this.tagsService.findOrCreateTags(newTags);
      resolvedTags.push(...createdOrFoundNewTags);
    }
    if (tagIds && tagIds.length > 0) {
      const existingTags = await this.tagsRepository.findBy({ id: In(tagIds) });
      resolvedTags.push(...existingTags);
    }
    // Remove duplicates if newTags and tagIds might overlap conceptually
    resolvedTags = Array.from(new Set(resolvedTags.map(tag => tag.id))).map(id => resolvedTags.find(tag => tag.id === id));


    const resource = this.resourcesRepository.create({
      title,
      type,
      content_data,
      teacherId: teacher.id,
      teacher: teacher,
      tags: resolvedTags,
    });

    try {
      return await this.resourcesRepository.save(resource);
    } catch (error) {
      console.error("Error creating resource:", error);
      throw new InternalServerErrorException("Failed to create resource.");
    }
  }

  async findAllResources(queryParams: { tag?: string; type?: string; teacherId?: number }): Promise<Resource[]> {
    const queryBuilder = this.resourcesRepository.createQueryBuilder('resource')
      .leftJoinAndSelect('resource.teacher', 'teacher')
      .leftJoinAndSelect('resource.tags', 'tag_entity'); // Changed alias to avoid conflict with queryParams.tag

    if (queryParams.type) {
      queryBuilder.andWhere('resource.type = :type', { type: queryParams.type });
    }
    if (queryParams.teacherId) {
      queryBuilder.andWhere('resource.teacherId = :teacherId', { teacherId: queryParams.teacherId });
    }
    if (queryParams.tag) {
      // Find resources that have a tag with the given name
      queryBuilder.andWhere('tag_entity.name = :tagName', { tagName: queryParams.tag });
    }

    queryBuilder.orderBy('resource.createdAt', 'DESC');

    try {
      return await queryBuilder.getMany();
    } catch (error) {
        console.error("Error finding all resources:", error);
        throw new InternalServerErrorException("Failed to retrieve resources.");
    }
  }

  async findResourceById(id: string): Promise<Resource | null> {
    const resource = await this.resourcesRepository.findOne({
      where: { id },
      relations: ['teacher', 'tags'],
    });
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }
    return resource;
  }

  async findResourcesByTeacher(teacherId: number): Promise<Resource[]> {
    return this.resourcesRepository.find({
      where: { teacherId },
      relations: ['tags'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateResource(id: string, updateResourceDto: UpdateResourceDto, teacher: User): Promise<Resource> {
    const resource = await this.resourcesRepository.findOne({ where: {id}, relations: ['teacher']});
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found.`);
    }
    if (resource.teacherId !== teacher.id && resource.teacher?.id !== teacher.id) { // Check both teacherId and populated teacher.id
      throw new ForbiddenException('You are not authorized to update this resource.');
    }

    const { title, type, content_data, tagIds, newTags } = updateResourceDto;

    if (title !== undefined) resource.title = title;
    if (type !== undefined) resource.type = type;
    if (content_data !== undefined) resource.content_data = content_data;

    // Handle tag updates: replace existing tags with new set
    if (tagIds !== undefined || newTags !== undefined) {
        let resolvedTags: Tag[] = [];
        if (newTags && newTags.length > 0) {
            const createdOrFoundNewTags = await this.tagsService.findOrCreateTags(newTags);
            resolvedTags.push(...createdOrFoundNewTags);
        }
        if (tagIds && tagIds.length > 0) {
            const existingTags = await this.tagsRepository.findBy({ id: In(tagIds) });
            resolvedTags.push(...existingTags);
        }
        // Remove duplicates
        resource.tags = Array.from(new Set(resolvedTags.map(tag => tag.id))).map(id => resolvedTags.find(tag => tag.id === id));
    }

    try {
      return await this.resourcesRepository.save(resource);
    } catch (error) {
        console.error(`Error updating resource ID ${id}:`, error);
        throw new InternalServerErrorException("Failed to update resource.");
    }
  }

  async removeResource(id: string, teacher: User): Promise<void> {
    const resource = await this.resourcesRepository.findOne({ where: {id}, relations: ['teacher'] });
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found.`);
    }
    if (resource.teacherId !== teacher.id && resource.teacher?.id !== teacher.id) {
      throw new ForbiddenException('You are not authorized to delete this resource.');
    }

    try {
      await this.resourcesRepository.remove(resource);
    } catch (error) {
      console.error(`Error removing resource ID ${id}:`, error);
      throw new InternalServerErrorException("Failed to remove resource.");
    }
  }
}
