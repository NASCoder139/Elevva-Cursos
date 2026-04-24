import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.favoritesService.list(userId);
  }

  @Post(':courseId')
  add(@CurrentUser('id') userId: string, @Param('courseId') courseId: string) {
    return this.favoritesService.add(userId, courseId);
  }

  @Delete(':courseId')
  remove(@CurrentUser('id') userId: string, @Param('courseId') courseId: string) {
    return this.favoritesService.remove(userId, courseId);
  }
}
