import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resource } from './entities/resource.entity';
import { Tag } from './entities/tag.entity';
import { User } from '../users/entities/user.entity'; // Import User entity for relations
import { ResourcesService } from './services/resources.service';
import { TagsService } from './services/tags.service';
import { ResourcesController } from './controllers/resources.controller';
import { TagsController } from './controllers/tags.controller';
import { AuthModule } from '../auth/auth.module'; // For guards and user context

@Module({
  imports: [
    TypeOrmModule.forFeature([Resource, Tag, User]), // Include User for relations
    AuthModule, // To make JwtAuthGuard, RolesGuard, and user context available
  ],
  controllers: [ResourcesController, TagsController],
  providers: [ResourcesService, TagsService],
  exports: [ResourcesService, TagsService], // Export services if they are used by other modules
})
export class ResourcesModule {}
