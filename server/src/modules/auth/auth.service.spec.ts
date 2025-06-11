import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { User, UserRole } from '../users/entities/user.entity';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

// Mocks
const mockUsersService = {
  create: jest.fn(),
  findOneByEmail: jest.fn(),
  findOneByUsername: jest.fn(),
  findOneById: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterAuthDto = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      role: UserRole.STUDENT,
    };
    const createdUser = { id: 1, ...registerDto } as User;
    // delete createdUser.password; // Service should handle this

    it('should register a new user successfully', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);
      mockUsersService.findOneByUsername.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);
      expect(usersService.findOneByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(usersService.findOneByUsername).toHaveBeenCalledWith(registerDto.username);
      expect(usersService.create).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(createdUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(createdUser); // Email exists
      mockUsersService.findOneByUsername.mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if username already exists', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);
      mockUsersService.findOneByUsername.mockResolvedValue(createdUser); // Username exists

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto: LoginAuthDto = { email: 'test@example.com', password: 'password123' };
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      password: 'hashedpassword', // This would be the hashed password
      role: UserRole.STUDENT,
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date(),
      updatedAt: new Date(),
      validatePassword: jest.fn(), // Mock this method from User entity
      hashPassword: jest.fn(), // Mock this method from User entity
    } as unknown as User; // Use unknown to allow mocking methods

    const { password, ...userWithoutPassword } = mockUser;
    const accessToken = 'testAccessToken';

    it('should login a user and return access token and user info', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      (mockUser.validatePassword as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(accessToken);

      const result = await service.login(loginDto);

      expect(usersService.findOneByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockUser.validatePassword).toHaveBeenCalledWith(loginDto.password);
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        role: mockUser.role,
      });
      expect(result.accessToken).toEqual(accessToken);
      expect(result.user).toEqual(userWithoutPassword);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      (mockUser.validatePassword as jest.Mock).mockResolvedValue(false); // Password invalid
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUserById', () => {
    it('should return user if found', async () => {
      const userId = 1;
      const mockUser = { id: userId, email: 'test@example.com' } as User;
      mockUsersService.findOneById.mockResolvedValue(mockUser);

      const result = await service.validateUserById(userId);
      expect(usersService.findOneById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should return undefined if user not found', async () => {
      const userId = 1;
      mockUsersService.findOneById.mockResolvedValue(undefined);

      const result = await service.validateUserById(userId);
      expect(usersService.findOneById).toHaveBeenCalledWith(userId);
      expect(result).toBeUndefined();
    });
  });
});
