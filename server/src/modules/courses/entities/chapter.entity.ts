import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany, // Added OneToMany
} from 'typeorm';
import { Course } from './course.entity';
import { ChapterContentUnit } from './chapter-content-unit.entity'; // Import ChapterContentUnit

@Entity('chapters')
export class Chapter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  content: string;

  @Column('int') // Using 'int' for integer type, can also be 'integer'
  order: number; // For chapter sequence

  @Column()
  courseId: number; // Foreign key for the Course entity

  @ManyToOne(() => Course, (course) => course.chapters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' }) // Specifies the foreign key column
  course: Course;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ChapterContentUnit, (contentUnit) => contentUnit.chapter, { cascade: true })
  contentUnits: ChapterContentUnit[];
}
