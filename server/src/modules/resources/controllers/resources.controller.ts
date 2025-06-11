import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe, // For validating UUIDs if 'id' is UUID
} from '@nestjs/common';
import { ResourcesService } from '../services/resources.service';
import { CreateResourceDto } from '../dto/create-resource.dto';
import { UpdateResourceDto } from '../dto/update-resource.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole, User } from '../../users/entities/user.entity';
import { GetCurrentUser } from '../../auth/decorators/get-current-user.decorator';

@Controller('resources') // Global prefix /api/resources
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  createResource(
    @Body() createResourceDto: CreateResourceDto,
    @GetCurrentUser() teacher: User,
  ) {
    return this.resourcesService.createResource(createResourceDto, teacher);
  }

  @Get()
  findAllResources(
    @Query('tag') tag?: string,
    @Query('type') type?: string,
    @Query('teacherId') teacherId?: string, // Keep as string, service will parse if needed
  ) {
    const queryParams: { tag?: string; type?: string; teacherId?: number } = {};
    if (tag) queryParams.tag = tag;
    if (type) queryParams.type = type;
    if (teacherId) queryParams.teacherId = parseInt(teacherId, 10);

    return this.resourcesService.findAllResources(queryParams);
  }

  @Get('teacher/my-resources')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  findMyTeachingResources(@GetCurrentUser() teacher: User) {
    return this.resourcesService.findResourcesByTeacher(teacher.id);
  }

  @Get(':id')
  findResourceById(@Param('id', ParseUUIDPipe) id: string) { // Use ParseUUIDPipe if ID is UUID
    return this.resourcesService.findResourceById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  updateResource(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateResourceDto: UpdateResourceDto,
    @GetCurrentUser() teacher: User,
  ) {
    return this.resourcesService.updateResource(id, updateResourceDto, teacher);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeResource(
    @Param('id', ParseUUIDPipe) id: string,
    @GetCurrentUser() teacher: User,
  ) {
    return this.resourcesService.removeResource(id, teacher);
  }
}
