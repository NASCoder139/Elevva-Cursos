import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { CreateModuleDto, UpdateModuleDto } from './dto/module.dto';
import { CreateLessonDto, UpdateLessonDto } from './dto/lesson.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { UpdateUserDto } from './dto/user.dto';
import { PlansService } from '../payments/plans.service';
import type { UpdatePlanDto } from '../payments/plans.service';
import { CouponsService } from '../coupons/coupons.service';
import type { CreateCouponDto, UpdateCouponDto } from '../coupons/coupons.service';
import { SiteSettingsService } from '../site-settings/site-settings.service';
import type { UpdatePromoRibbonDto, UpdatePlansPromoDto } from '../site-settings/site-settings.service';

@Controller('admin')
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private admin: AdminService,
    private plans: PlansService,
    private coupons: CouponsService,
    private siteSettings: SiteSettingsService,
  ) {}

  @Get('stats')
  stats(@Query('days') days?: string) {
    const d = days ? parseInt(days, 10) : 30;
    return this.admin.getStats(isNaN(d) || d < 1 ? 30 : Math.min(d, 365));
  }

  // Courses
  @Get('courses')
  listCourses(@Query('q') q?: string) {
    return this.admin.listCourses(q);
  }

  @Get('courses/:id')
  getCourse(@Param('id') id: string) {
    return this.admin.getCourse(id);
  }

  @Post('courses')
  createCourse(@Body() dto: CreateCourseDto) {
    return this.admin.createCourse(dto);
  }

  @Patch('courses/:id')
  updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.admin.updateCourse(id, dto);
  }

  @Delete('courses/:id')
  deleteCourse(@Param('id') id: string) {
    return this.admin.deleteCourse(id);
  }

  // Modules
  @Post('modules')
  createModule(@Body() dto: CreateModuleDto) {
    return this.admin.createModule(dto);
  }

  @Patch('modules/:id')
  updateModule(@Param('id') id: string, @Body() dto: UpdateModuleDto) {
    return this.admin.updateModule(id, dto);
  }

  @Delete('modules/:id')
  deleteModule(@Param('id') id: string) {
    return this.admin.deleteModule(id);
  }

  // Lessons
  @Post('lessons')
  createLesson(@Body() dto: CreateLessonDto) {
    return this.admin.createLesson(dto);
  }

  @Patch('lessons/:id')
  updateLesson(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.admin.updateLesson(id, dto);
  }

  @Delete('lessons/:id')
  deleteLesson(@Param('id') id: string) {
    return this.admin.deleteLesson(id);
  }

  // Categories
  @Get('categories')
  listCategories() {
    return this.admin.listCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.admin.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.admin.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.admin.deleteCategory(id);
  }

  // Users
  @Get('users')
  listUsers(@Query('q') q?: string) {
    return this.admin.listUsers(q);
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.admin.getUserDetail(id);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.admin.updateUser(id, dto);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.admin.deleteUser(id);
  }

  // Payments
  @Get('payments')
  listPayments(@Query('status') status?: string) {
    return this.admin.listPayments(status);
  }

  // Interests & Tags
  @Get('interests')
  listInterests() {
    return this.admin.listInterests();
  }

  @Post('interests')
  createInterest(@Body() body: { name: string; slug: string; icon?: string }) {
    return this.admin.createInterest(body.name, body.slug, body.icon);
  }

  @Delete('interests/:id')
  deleteInterest(@Param('id') id: string) {
    return this.admin.deleteInterest(id);
  }

  @Get('tags')
  listTags() {
    return this.admin.listTags();
  }

  @Post('tags')
  createTag(@Body() body: { name: string; slug: string }) {
    return this.admin.createTag(body.name, body.slug);
  }

  @Delete('tags/:id')
  deleteTag(@Param('id') id: string) {
    return this.admin.deleteTag(id);
  }

  // Plans
  @Get('plans')
  listPlans() {
    return this.plans.list();
  }

  @Post('plans/seed-defaults')
  seedDefaultPlans() {
    return this.plans.seedDefaults();
  }

  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.plans.update(id, dto);
  }

  // Coupons
  @Get('coupons')
  listCoupons() {
    return this.coupons.list();
  }

  @Post('coupons')
  createCoupon(@Body() dto: CreateCouponDto) {
    return this.coupons.create(dto);
  }

  @Patch('coupons/:id')
  updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.coupons.update(id, dto);
  }

  @Delete('coupons/:id')
  deleteCoupon(@Param('id') id: string) {
    return this.coupons.remove(id);
  }

  // Site settings (promo ribbon + modo oferta global)
  @Get('site-settings')
  getSiteSettings() {
    return this.siteSettings.get();
  }

  @Patch('promo-ribbon')
  updatePromoRibbon(@Body() dto: UpdatePromoRibbonDto) {
    return this.siteSettings.updatePromoRibbon(dto);
  }

  @Patch('plans-promo')
  updatePlansPromo(@Body() dto: UpdatePlansPromoDto) {
    return this.siteSettings.updatePlansPromo(dto);
  }
}
