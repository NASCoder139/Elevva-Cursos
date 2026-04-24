import { Controller, Get, Patch, Put, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateInterestsDto } from './dto/update-interests.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('me/password')
  changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }

  @Put('me/interests')
  updateInterests(@CurrentUser('id') userId: string, @Body() dto: UpdateInterestsDto) {
    return this.usersService.updateInterests(userId, dto.interestIds);
  }

  @Get('me/access')
  getAccess(@CurrentUser('id') userId: string) {
    return this.usersService.getAccess(userId);
  }

  @Get('interests')
  @Public()
  getAllInterests() {
    return this.usersService.getInterests();
  }
}
