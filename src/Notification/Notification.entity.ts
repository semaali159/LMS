import { NotificationType } from "src/common/enums/notificationType.enum";
import { User } from "src/User/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Notification{

    @PrimaryGeneratedColumn()
    id:number
    @Column({})
    title:string
    @Column({})
    message:string
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

 @Column()
  sourceType: string; // 'ASSIGNMENT' | 'GRADE' | 'COURSE'
  @Column()
  sourceId: number;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
    
}
