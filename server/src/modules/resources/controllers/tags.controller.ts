import { Controller, Get, UseGuards } from '@nestjs/common';
import { TagsService } from '../services/tags.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'; // Optional: if listing tags should be protected

@Controller('tags') // Global prefix /api/tags
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  // @UseGuards(JwtAuthGuard) // Uncomment if you want to protect this endpoint
  getAllTags() {
    return this.tagsService.getAllTags();
  }
}
