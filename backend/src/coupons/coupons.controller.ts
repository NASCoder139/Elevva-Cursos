import { Body, Controller, Post } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import type { CouponContext } from './coupons.service';
import { IsIn, IsNumber, IsString, Min } from 'class-validator';

class ValidateCouponDto {
  @IsString()
  code!: string;

  @IsIn(['COURSE', 'CATEGORY', 'PLAN'])
  context!: CouponContext;

  @IsNumber()
  @Min(0)
  baseAmount!: number;
}

@Controller('coupons')
export class CouponsController {
  constructor(private coupons: CouponsService) {}

  @Post('validate')
  validate(@Body() dto: ValidateCouponDto) {
    return this.coupons.validate(dto.code, dto.context, dto.baseAmount);
  }
}
