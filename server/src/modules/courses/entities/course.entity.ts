import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Chapter } from './chapter.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column()
  teacherId: number; // Foreign key for the User entity

  @ManyToOne(() => User, (user) => user.courses, { onDelete: 'CASCADE' }) // Assuming User entity will have a 'courses' OneToMany relation
  @JoinColumn({ name: 'teacherId' }) // Specifies the foreign key column
  teacher: User;

  @OneToMany(() => Chapter, (chapter) => chapter.course, { cascade: true }) // cascade true for operations like delete
  chapters: Chapter[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
