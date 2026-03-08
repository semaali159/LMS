import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Notification } from "./Notification.entity";
import { Repository } from "typeorm";
import { CreateNotificationDto } from "./dtos/notification.dto";
import { User } from "src/User/user.entity";
import { NotificationGateway } from "./Notification.gateway";

@Injectable()
export class NotificationService{
    constructor(
        @InjectRepository(Notification)private readonly NotificationRepository:Repository<Notification>,
        @InjectRepository(User) private readonly UserRepository:Repository<User>,
        private readonly notificationGateway:NotificationGateway
              ){}
async create(dto: CreateNotificationDto){
    const user = await this.UserRepository.findOne({where:{id:dto.userId}})
    if(!user){
        throw new NotFoundException('user not found')
    }
    const notification =  this.NotificationRepository.create({
        user,
        title:dto.title,
        message:dto.message,
        type:dto.type,
        sourceType:dto.sourceType,
        sourceId:dto.sourceId

    })
  const saved=await this.NotificationRepository.save(notification) 
 this.notificationGateway.server
      .to(`user-${user.id}`)
      .emit('notification:new', saved);

    return saved;
}
async getAll(userId:string){
      const user = await this.UserRepository.findOne({where:{id:userId}})
    if(!user){
        throw new NotFoundException('user not found')
    }
    const notifications =  await this.NotificationRepository.find({where:{user:{id:userId}}})
    if(!notifications){
        throw new NotFoundException('there is no notification yet')
    }
}
}