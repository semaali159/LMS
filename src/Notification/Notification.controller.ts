import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { Role } from "src/common/enums/roles.enum";
import { NotificationService } from "./Notification.service";
import { GetUser } from "src/common/decorators/get-user.decorator";
import type { JwtPayload } from "src/common/types/payload.interface";

@ApiTags('Notification')
@Controller('Notification')
export class NotificationController{
    constructor(private readonly notificationService: NotificationService){

    }

    @Get('all')
    @ApiBearerAuth('access-token')
    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles(Role.STUDENT)
    @ApiOperation({summary:'Get all user notifications'})
    @ApiResponse({ status: 200, description: 'List of all user notifications' })
    @ApiResponse({ status: 404, description: 'There is no notification available' }) 
    get(@GetUser() user: JwtPayload){
        return this.notificationService.getAll(user.userId)
    }

    @Get(':id')
    @ApiBearerAuth('acess-token')
    @ApiParam({name: 'id', type: Number})
    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles(Role.STUDENT)
    @ApiOperation({summary:'Get notification by id'})
    @ApiResponse({ status: 200, description: 'The notification details' })
    @ApiResponse({status:404,description:'Notificaiton not found'})
    getById(
        @Param('id') id:number,
        @GetUser() user: JwtPayload
    ){
        return this.notificationService.getNotificationById(id,user.userId)
    }
}