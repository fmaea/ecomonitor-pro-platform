import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Chapter } from './chapter.entity';
import { Resource } from '../../resources/entities/resource.entity';

@Entity('chapter_content_units')
@Unique(['chapter', 'resource']) // Ensures a resource can only be added once to a specific chapter
// If you want to allow a resource multiple times with different orders, remove this and make (chapterId, order) unique.
// @Unique(['chapter', 'order']) // Alternative: ensure order is unique within a chapter
export class ChapterContentUnit {
  @PrimaryGeneratedColumn('uuid') // Using UUID for the join record ID itself
  id: string;

  @Column()
  chapterId: number;

  @Column('uuid') // Matches Resource ID type
  resourceId: string;

  @Column('int')
  order: number; // Defines the sequence of the resource within the chapter

  @ManyToOne(() => Chapter, (chapter) => chapter.contentUnits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chapterId' })
  chapter: Chapter;

  @ManyToOne(() => Resource, (resource) => resource.chapterUsages, { onDelete: 'CASCADE' }) // Cascade delete if resource is deleted
  @JoinColumn({ name: 'resourceId' })
  resource: Resource;

  @CreateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
