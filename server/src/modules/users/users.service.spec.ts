import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

// Mock TypeORM repository
const mockUserRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useFactory: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a user without password', async () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.STUDENT,
      };
      const expectedUser = {
        id: 1,
        ...createUserDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        // hashPassword method is part of entity, so we don't mock it here
        // validatePassword method is part of entity
      };
      // delete expectedUser.password; // Password should be deleted by service

      jest.spyOn(repository, 'create').mockReturnValue(expectedUser as any); // Type assertion
      jest.spyOn(repository, 'save').mockResolvedValue(expectedUser as any); // Type assertion

      const result = await service.create(createUserDto);

      expect(repository.create).toHaveBeenCalledWith(createUserDto);
      expect(repository.save).toHaveBeenCalledWith(expectedUser);
      expect(result.password).toBeUndefined();
      expect(result.username).toEqual(createUserDto.username);
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user if found by email', async () => {
      const email = 'test@example.com';
      const expectedUser = { id: 1, email, username: 'test' } as User;
      jest.spyOn(repository, 'findOne').mockResolvedValue(expectedUser);

      const result = await service.findOneByEmail(email);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { email } });
      expect(result).toEqual(expectedUser);
    });

    it('should return undefined if user not found by email', async () => {
      const email = 'notfound@example.com';
      jest.spyOn(repository, 'findOne').mockResolvedValue(undefined);

      const result = await service.findOneByEmail(email);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { email } });
      expect(result).toBeUndefined();
    });
  });

  describe('findOneById', () => {
    it('should return a user if found by id', async () => {
      const id = 1;
      const expectedUser = { id: 1, email: 'test@example.com', username: 'test' } as User;
      jest.spyOn(repository, 'findOne').mockResolvedValue(expectedUser);

      const result = await service.findOneById(id);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(expectedUser);
    });
  });

  describe('findOneByUsername', () => {
    it('should return a user if found by username', async () => {
      const username = 'testuser';
      const expectedUser = { id: 1, email: 'test@example.com', username: 'testuser' } as User;
      jest.spyOn(repository, 'findOne').mockResolvedValue(expectedUser);

      const result = await service.findOneByUsername(username);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { username } });
      expect(result).toEqual(expectedUser);
    });
  });
});
