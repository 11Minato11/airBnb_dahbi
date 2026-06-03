import { Controller, Post, Body, UseGuards, Request, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleOauthGuard } from './guards/google-oauth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Route d'inscription classique
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // Route de connexion classique
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: any) {
    // req.user est injecté par LocalStrategy suite à la validation
    return this.authService.login(req.user);
  }

  // Initier l'authentification Google
  @Get('google')
  @UseGuards(GoogleOauthGuard)
  async googleAuth(@Request() req: any) {
    // Redirige vers Google
  }

  // Callback de Google après authentification
  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthRedirect(@Request() req: any, @Res() res: Response) {
    const jwt = await this.authService.googleLogin(req);
    res.redirect(`http://localhost:4200/login?token=${encodeURIComponent(jwt.access_token)}`);
  }

  // Route protégée pour obtenir le profil
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }
}
