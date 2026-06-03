import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // Validation utilisateur (classique)
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.passwordHash) {
      const isMatch = await bcrypt.compare(pass, user.passwordHash);
      if (isMatch) {
        const { passwordHash, ...result } = user.toObject();
        return result;
      }
    }
    return null;
  }

  // Connexion (classique et google) qui retourne le JWT
  async login(user: any) {
    const userId = user._id?.toString?.() ?? user._id;
    const payload = { email: user.email, sub: userId, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isHost: user.isHost
      }
    };
  }

  // Inscription (classique)
  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const newUser = await this.usersService.create({
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email: registerDto.email,
      passwordHash,
      role: 'user',
      isHost: registerDto.isHost || false,
    });

    const { passwordHash: _, ...result } = newUser.toObject();
    return result;
  }

  // Connexion Google
  async googleLogin(req: any) {
    if (!req.user) {
      throw new UnauthorizedException('Aucun utilisateur provenant de Google');
    }
    return this.login(req.user);
  }
}
