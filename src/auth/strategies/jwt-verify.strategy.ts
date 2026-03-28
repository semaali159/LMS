import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from 'passport-jwt';
@Injectable()
export class VerifyJWTStrategy extends PassportStrategy(Strategy, 'verify-jwt') {
    constructor(private configService: ConfigService){
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.get<string>('jwt.verifyTokenSecret'),
            ignoreExpiration: false,
        })
    }
    async validate(payload:any){

         console.log(payload);
        if(payload.type !== 'verify'){
            throw new UnauthorizedException("weee");
        }
        return{email:payload.email}
    }
}
