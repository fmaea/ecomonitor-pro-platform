import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  OneToMany, // Added OneToMany
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Tag } from './tag.entity';
import { ChapterContentUnit } from '../../courses/entities/chapter-content-unit.entity'; // Import ChapterContentUnit

export enum ResourceType {
  TEXT = 'text',
  IMAGE_URL = 'image_url',
  VIDEO_URL = 'video_url',
  MARKDOWN = 'markdown',
  QUIZ_REF = 'quiz_ref', // Reference to a quiz, perhaps by ID
  MODEL_3D_URL = '3d_model_url',
  // Add other types as needed
}

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn('uuid') // Using UUID for ID
  id: string;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: ResourceType,
    default: ResourceType.TEXT,
  })
  type: ResourceType;

  @Column({ type: 'jsonb', nullable: true }) // jsonb for flexible content, text as fallback
  content_data: any; // Can be string, object, array depending on 'type'

  @Column()
  teacherId: number; // Foreign key for the User entity

  @ManyToOne(() => User, (user) => user.authoredResources, { onDelete: 'SET NULL' }) // Or 'CASCADE' if resource should be deleted with user
  @JoinColumn({ name: 'teacherId' })
  teacher: User;

  @ManyToMany(() => Tag, (tag) => tag.resources, { cascade: true }) // Cascade for easier tag management with resources
  @JoinTable({
    name: 'resource_tags', // Name of the join table
    joinColumn: { name: 'resourceId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @CreateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => ChapterContentUnit, (contentUnit) => contentUnit.resource)
  chapterUsages: ChapterContentUnit[];
}
