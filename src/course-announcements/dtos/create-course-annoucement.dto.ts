import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

export class CreateCourseAnnouncementDTO{
    @ApiProperty({example: 'Sunday session details'})
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title: string

    @ApiProperty({example: 'We will cover the topic of the week'})
    @IsString()
    @IsNotEmpty()
    @MaxLength(10000)
    body: string


    @ApiPropertyOptional({example: 'https://www.google.com'})
    @IsString()
    @IsOptional()
    @IsUrl({ require_tld: false })
    sessionUrl?: string

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @IsBoolean()
    pinned?: boolean;
}