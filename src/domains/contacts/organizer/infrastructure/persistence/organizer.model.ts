import { contactInfosSchema } from '@src/domains/contacts/contact-infos/infrastructure/persistence/contact-infos.model';
import { z } from 'zod';
import { OrganizerType } from '../../domain/organizer.entity';

export const organizerSchema = z.object({
  id: z.string().uuid(),
  bookerId: z.string().uuid(),
  createdAt: z.preprocess((val: any) => new Date(val), z.date()).optional(),
  updatedAt: z.preprocess((val: any) => new Date(val), z.date()).optional(),
  name: z.string(),
  type: z.nativeEnum(OrganizerType),
  contactInfos: contactInfosSchema,
  contactIds: z.array(z.string().uuid()),
});

export type OrganizerModel = z.infer<typeof organizerSchema>;
