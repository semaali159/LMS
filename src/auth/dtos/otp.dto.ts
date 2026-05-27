import { IsEmail, IsString } from "class-validator";

export class VerifyOTPDto{
    @IsString()
    otpCode: string
}

export class ResendOTPDto{
    @IsEmail()
    @IsString()
    email: string
}