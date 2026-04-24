import { IsIn, IsOptional, IsString } from 'class-validator';

export class SubscribeDto {
  @IsIn(['MONTHLY', 'ANNUAL'])
  plan!: 'MONTHLY' | 'ANNUAL';

  @IsOptional()
  @IsIn(['MERCADOPAGO', 'PAYPAL'])
  provider?: 'MERCADOPAGO' | 'PAYPAL';

  @IsOptional()
  @IsString()
  couponCode?: string;
}

export class CheckoutDto {
  @IsOptional()
  @IsIn(['MERCADOPAGO', 'PAYPAL'])
  provider?: 'MERCADOPAGO' | 'PAYPAL';

  @IsOptional()
  @IsString()
  couponCode?: string;
}
