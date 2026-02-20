import { Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn, Column,
OneToMany } from 'typeorm';
import { User } from '../../User/user.entity'
// import { Assignment } from '../assignments/assignment.entity';

@Entity()
export class InstructorProfile {
@PrimaryGeneratedColumn()
id: number;
@OneToOne(() => User)
@JoinColumn()
user: User;
@Column({ nullable: true })
specialty: string;
// @OneToMany(() => Assignment, (assignment) => assignment.teacher)
// assignments: Assignment[];
}
