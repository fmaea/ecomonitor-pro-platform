import { PartialType } from '@nestjs/mapped-types';
import { CreateResourceDto } from './create-resource.dto';

export class UpdateResourceDto extends PartialType(CreateResourceDto) {
  // UpdateResourceDto can inherit all properties from CreateResourceDto as optional.
  // If specific fields should not be updatable via PartialType,
  // or need different validation, they can be overridden here.
  // For example, if 'type' should not be updatable, you could omit it or add @IsEmpty() if that's the intent.
  // For tag management on update, `tagIds` and `newTags` being optional is often desired
  // to indicate "overwrite tags with these" or "add these new tags".
  // The service logic will need to interpret how to handle partial updates to tags (e.g., merge, replace).
}
