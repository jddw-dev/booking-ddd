import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@src/infrastructure/prisma/prisma.service';
import { Option } from 'oxide.ts';
import { Organizer, OrganizerType } from '../../domain/organizer.entity';
import { OrganizerError } from '../../domain/organizer.errors';
import { OrganizerMapper } from '../../domain/organizer.mapper';
import { OrganizerRepository } from './organizer.repository';

@Injectable()
export class OrganizerPrismaRepository implements OrganizerRepository {
  private logger: Logger = new Logger(OrganizerPrismaRepository.name);

  constructor(
    private prisma: PrismaService,
    private mapper: OrganizerMapper,
  ) {}

  async save(organizer: Organizer): Promise<void> {
    try {
      const organizerExists = await this.idExists(organizer.id);
      if (organizerExists) {
        const { bookerId, contactInfos, contactIds, ...record } =
          this.mapper.toPersistence(organizer);
        const { emails, phones, address, ...contactInfosData } = contactInfos;

        // Remove emails / phones to recreate them
        // TODO : find a more optimized way ?
        const removeExistingEmails = this.prisma.email.deleteMany({
          where: { contactInfosId: contactInfos.id },
        });
        const removeExistingPhones = this.prisma.phone.deleteMany({
          where: { contactInfosId: contactInfos.id },
        });

        const update = this.prisma.organizer.update({
          where: { id: organizer.id },
          data: {
            ...record,
            booker: {
              connect: { id: bookerId },
            },
            contactInfos: {
              update: {
                where: {
                  id: contactInfos.id,
                },

                data: {
                  ...contactInfosData,
                  emails: {
                    create: emails.map((email) => ({
                      value: email.value,
                    })),
                  },
                  phones: {
                    create: phones.map((phone) => ({
                      value: phone.value,
                    })),
                  },
                  street: address?.street,
                  city: address?.city,
                  zipCode: address?.zipCode,
                  country: address?.country,
                },
              },
            },
            contacts: {
              connect: contactIds.map((id) => ({ id })),
            },
          },
        });

        await this.prisma.$transaction([
          removeExistingEmails,
          removeExistingPhones,
          update,
        ]);
      } else {
        const { bookerId, contactInfos, contactIds, ...record } =
          this.mapper.toPersistence(organizer);
        const { emails, phones, address, ...contactInfosData } = contactInfos;

        await this.prisma.organizer.create({
          data: {
            ...record,
            booker: {
              connect: { id: bookerId },
            },
            contactInfos: {
              connectOrCreate: {
                where: {
                  id: contactInfos.id,
                },

                create: {
                  ...contactInfosData,
                  emails: {
                    create: emails.map((email) => ({
                      value: email.value,
                    })),
                  },
                  phones: {
                    create: phones.map((phone) => ({
                      value: phone.value,
                    })),
                  },
                  street: address?.street,
                  city: address?.city,
                  zipCode: address?.zipCode,
                  country: address?.country,
                },
              },
            },
            contacts: {
              connect: contactIds.map((id) => ({ id })),
            },
          },
          include: {
            contactInfos: true,
          },
        });
      }
    } catch (error: unknown) {
      this.logger.error('Unkown error saving organizer', error);
      throw new OrganizerError('Error saving organizer', error);
    }
  }

  async idExists(id: string): Promise<boolean> {
    const organizer = await this.prisma.organizer.findUnique({
      where: { id },
    });

    return organizer !== null;
  }

  async findAllForBooker(bookerId: string): Promise<Organizer[]> {
    const organizers = await this.prisma.organizer.findMany({
      where: { bookerId },
      include: {
        contactInfos: {
          include: {
            emails: true,
            phones: true,
          },
        },
        contacts: true,
      },
    });

    return organizers.map((organizer) =>
      this.mapper.toDomain({
        ...organizer,
        type: organizer.type as OrganizerType,
        contactIds: organizer.contacts.map((contact) => contact.id),
      }),
    );
  }

  async findOneById(id: string): Promise<Option<Organizer>> {
    const organizerRecord = await this.prisma.organizer.findUnique({
      where: { id },
      include: {
        contactInfos: {
          include: {
            emails: true,
            phones: true,
          },
        },
        contacts: true,
      },
    });

    return Option.from(organizerRecord).map((record) =>
      this.mapper.toDomain({
        ...record,
        type: record.type as OrganizerType,
        contactIds: record.contacts.map((contact) => contact.id),
      }),
    );
  }
}
