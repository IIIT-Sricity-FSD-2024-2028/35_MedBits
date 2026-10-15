import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateLabTechnicianDto {
  @ApiProperty({ example: 'Anita Rao' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'anita.rao@apollo.example' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'secure-password' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ description: 'Hospital branch UUID. Ignored for branch admin requests.' })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Female' })
  @IsString()
  @IsOptional()
  gender?: string;
}
