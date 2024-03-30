import { z } from 'zod';

const emailSchema = z.object({
  value: z.string().email(),
});

const phoneSchema = z.object({
  value: z.string(),
});

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string(),
  zipCode: z.string(),
  country: z.string().optional(),
});
export type AddressModel = z.infer<typeof addressSchema>;

export const contactInfosSchema = z.object({
  id: z.string().uuid(),
  emails: z.array(emailSchema),
  phones: z.array(phoneSchema),
  website: z.string().optional(),
  address: addressSchema.optional(),
});

export type ContactInfosModel = z.infer<typeof contactInfosSchema>;
