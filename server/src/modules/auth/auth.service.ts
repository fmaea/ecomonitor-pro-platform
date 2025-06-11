import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterAuthDto): Promise<User> {
    // Check if user already exists by email or username
    const existingUserByEmail = await this.usersService.findOneByEmail(registerDto.email);
    if (existingUserByEmail) {
      throw new ConflictException('User with this email already exists');
    }
    const existingUserByUsername = await this.usersService.findOneByUsername(registerDto.username);
    if (existingUserByUsername) {
      throw new ConflictException('User with this username already exists');
    }

    const user = await this.usersService.create(registerDto);
    // Password is already removed by the usersService.create method
    return user;
  }

  async login(loginDto: LoginAuthDto): Promise<{ accessToken: string; user: Omit<User, 'password'> }> {
    const user = await this.usersService.findOneByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials - user not found');
    }

    const isValidPassword = await user.validatePassword(loginDto.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials - password mismatch');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user; // Exclude password from the returned user object

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: result,
    };
  }

  async validateUserById(id: number): Promise<User | undefined> {
    return this.usersService.findOneById(id);
  }
}
