import { Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn, Column,
ManyToMany } from 'typeorm';
import { User } from '../../User/user.entity';
// import { Course } from '../courses/course.entity';
@Entity()
export class StudentProfile {
@PrimaryGeneratedColumn()
id: number;
@OneToOne(() => User)
@JoinColumn()
user: User;
@Column({ nullable: true })
gradeLevel: string;
// @ManyToMany(() => Course, (course) => course.students, { nullable: true })
// courses?: Course[];
}