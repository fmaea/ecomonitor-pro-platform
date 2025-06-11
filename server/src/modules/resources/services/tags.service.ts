import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Tag } from '../entities/tag.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagsRepository: Repository<Tag>,
  ) {}

  /**
   * Finds existing tags by name or creates new ones if they don't exist.
   * @param tagNames An array of tag names.
   * @returns A promise that resolves to an array of Tag entities.
   */
  async findOrCreateTags(tagNames: string[]): Promise<Tag[]> {
    if (!tagNames || tagNames.length === 0) {
      return [];
    }

    // Normalize tag names (e.g., lowercase, trim) to prevent duplicates like "Tag" and "tag"
    const normalizedTagNames = tagNames.map(name => name.trim().toLowerCase()).filter(name => name.length > 0);
    if (normalizedTagNames.length === 0) {
        return [];
    }

    try {
      const existingTags = await this.tagsRepository.findBy({
        name: In(normalizedTagNames), // Find all tags whose names are in the provided list
      });

      const existingTagNames = existingTags.map(tag => tag.name);
      const newTagNames = normalizedTagNames.filter(name => !existingTagNames.includes(name));

      const newTags: Tag[] = [];
      if (newTagNames.length > 0) {
        const tagsToCreate = newTagNames.map(name => this.tagsRepository.create({ name }));
        const createdTags = await this.tagsRepository.save(tagsToCreate);
        newTags.push(...createdTags);
      }

      return [...existingTags, ...newTags];
    } catch (error) {
        // Log the error
        console.error("Error in findOrCreateTags:", error);
        throw new InternalServerErrorException("Failed to process tags.");
    }
  }

  /**
   * Retrieves all tags from the database.
   * @returns A promise that resolves to an array of all Tag entities.
   */
  async getAllTags(): Promise<Tag[]> {
    try {
      return await this.tagsRepository.find({ order: { name: 'ASC' } }); // Order by name for consistency
    } catch (error) {
        console.error("Error in getAllTags:", error);
        throw new InternalServerErrorException("Failed to retrieve tags.");
    }
  }
}
