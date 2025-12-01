// Custom icon static resources

import { IconDefinition } from '@ant-design/icons-angular';
import {
  BulbOutline,
  ExceptionOutline,
  InfoOutline,
  LinkOutline,
  PlusCircleOutline,
  ProfileOutline
} from '@ant-design/icons-angular/icons';

const PlusCircleAlias: IconDefinition = { ...PlusCircleOutline, name: 'plus-circle-o' as any };

export const ICONS = [InfoOutline, BulbOutline, ProfileOutline, ExceptionOutline, LinkOutline, PlusCircleOutline, PlusCircleAlias];
