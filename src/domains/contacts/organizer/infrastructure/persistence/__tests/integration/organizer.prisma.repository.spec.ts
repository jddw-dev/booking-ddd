import { Test, TestingModule } from '@nestjs/testing';
import { ContactInfos } from '@src/domains/contacts/contact-infos/domain/contact-infos.entity';
import { ContactInfosMapper } from '@src/domains/contacts/contact-infos/domain/contact-infos.mapper';
import { Email } from '@src/domains/contacts/contact-infos/domain/value-objects/email';
import {
  Organizer,
  OrganizerProps,
  OrganizerType,
} from '@src/domains/contacts/organizer/domain/organizer.entity';
import { OrganizerMapper } from '@src/domains/contacts/organizer/domain/organizer.mapper';
import { PrismaModule } from '@src/infrastructure/prisma/prisma.module';
import { PrismaService } from '@src/infrastructure/prisma/prisma.service';
import { EntityID } from '@src/libs/ddd';
import { randomUUID } from 'crypto';
import { None } from 'oxide.ts';
import { OrganizerPrismaRepository } from '../../organizer.prisma.repository';

describe('OrganizerPrismaRepository Integration Test', () => {
  let organizerPrismaRepository: OrganizerPrismaRepository;
  let prismaService: PrismaService;
  let existingBookerId: EntityID;
  let existingContactIds: EntityID[] = [];

  const contactInfos: ContactInfos = ContactInfos.create({
    emails: [Email.create('john.doe@mail.com').unwrap()],
    phones: [],
    website: None,
    address: None,
  }).unwrap();

  const organizerProps: OrganizerProps = {
    bookerId: randomUUID(),
    name: 'John Doe',
    type: OrganizerType.OTHER,
    contactInfos: contactInfos,
    contactIds: [],
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        OrganizerMapper,
        OrganizerPrismaRepository,
        ContactInfosMapper,
      ],
    }).compile();

    organizerPrismaRepository = module.get<OrganizerPrismaRepository>(
      OrganizerPrismaRepository,
    );
    prismaService = module.get<PrismaService>(PrismaService);

    // Create dummy datas
    const booker = await prismaService.booker.create({
      data: { email: 'john.doe@mail.com' },
    });
    existingBookerId = booker.id;

    await prismaService.contact.create({
      data: {
        firstName: 'Jérémy',
        lastName: 'Dutheil',
        contactInfos: {
          create: {
            emails: {
              create: [
                {
                  value: 'dutheil.jeremy@gmail.com',
                },
              ],
            },
          },
        },
        booker: {
          connect: {
            id: existingBookerId,
          },
        },
      },
    });

    await prismaService.contact.create({
      data: {
        firstName: 'Aurélie',
        lastName: 'Cabarrot',
        contactInfos: {
          create: {
            emails: {
              create: [
                {
                  value: 'aurelie@booking-app.com',
                },
              ],
            },
          },
        },
        booker: {
          connect: {
            id: existingBookerId,
          },
        },
      },
    });

    const contacts = await prismaService.contact.findMany();
    existingContactIds = contacts.map((contact) => contact.id);
  });

  afterAll(async () => {
    const deleteBooker = prismaService.booker.deleteMany();
    const deleteContact = prismaService.contact.deleteMany();
    const deleteOrganizer = prismaService.organizer.deleteMany();
    const deleteContactInfos = prismaService.contactInfos.deleteMany();

    await prismaService.$transaction([
      deleteBooker,
      deleteContact,
      deleteOrganizer,
      deleteContactInfos,
    ]);
    await prismaService.$disconnect();
  });

  afterEach(async () => {
    const deleteOrganizer = prismaService.organizer.deleteMany();
    await prismaService.$transaction([deleteOrganizer]);
  });

  describe('Save', () => {
    it('should insert a new organizer', async () => {
      // Arrange
      const organizerResult = Organizer.create({
        ...organizerProps,
        bookerId: existingBookerId,
      });
      const organizer = organizerResult.unwrap();

      const organizersCount = await prismaService.organizer.count();

      // Act
      await organizerPrismaRepository.save(organizer);

      // Assert
      const newOrganizersCount = await prismaService.organizer.count();
      expect(newOrganizersCount).toBe(organizersCount + 1);
      const newOrganizer = await prismaService.organizer.findUnique({
        where: { id: organizer.id },
      });
      expect(newOrganizer).toBeDefined();
      expect(newOrganizer?.id).toBe(organizer.id);
      expect(newOrganizer?.name).toBe(organizerProps.name);
    });

    it('should insert a new organizer and link contacts', async () => {
      // Arrange
      const organizerResult = Organizer.create({
        ...organizerProps,
        bookerId: existingBookerId,
        contactIds: existingContactIds,
      });
      const organizer = organizerResult.unwrap();

      const organizersCount = await prismaService.organizer.count();

      // Act
      await organizerPrismaRepository.save(organizer);

      // Assert
      const newOrganizersCount = await prismaService.organizer.count();
      expect(newOrganizersCount).toBe(organizersCount + 1);
      const newOrganizer = await prismaService.organizer.findUnique({
        where: { id: organizer.id },
        include: { contacts: true },
      });
      expect(newOrganizer).toBeDefined();
      expect(newOrganizer?.id).toBe(organizer.id);
      expect(newOrganizer?.name).toBe(organizerProps.name);
      expect(newOrganizer?.contacts).toHaveLength(2);
    });

    it('should update an existing organizer', async () => {
      // Arrange
      const organizer = Organizer.create({
        ...organizerProps,
        bookerId: existingBookerId,
      }).unwrap();
      await organizerPrismaRepository.save(organizer);

      const organizersCount = await prismaService.organizer.count();

      // Act
      organizer.changeName('Updated Organizer Test');
      await organizerPrismaRepository.save(organizer);

      // Assert
      const newOrganizersCount = await prismaService.organizer.count();
      expect(newOrganizersCount).toBe(organizersCount);
      const updatedOrganizer = await prismaService.organizer.findUnique({
        where: { id: organizer.id },
      });
      expect(updatedOrganizer).toBeDefined();
      expect(updatedOrganizer?.id).toBe(organizer.id);
      expect(updatedOrganizer?.name).toBe('Updated Organizer Test');
    });
  });

  describe('idExists', () => {
    it('should return true if organizer exists', async () => {
      // Arrange
      const organizer = Organizer.create({
        ...organizerProps,
        bookerId: existingBookerId,
      }).unwrap();
      await organizerPrismaRepository.save(organizer);

      // Act
      const exists = await organizerPrismaRepository.idExists(organizer.id);

      // Assert
      expect(exists).toBe(true);
    });

    it('should return false if organizer does not exist', async () => {
      // Act
      const exists = await organizerPrismaRepository.idExists(randomUUID());

      // Assert
      expect(exists).toBe(false);
    });
  });

  describe('findOneById', () => {
    it('should return an organizer if it exists', async () => {
      // Arrange
      const organizer = Organizer.create({
        ...organizerProps,
        bookerId: existingBookerId,
      }).unwrap();
      await organizerPrismaRepository.save(organizer);

      // Act
      const foundOrganizer = await organizerPrismaRepository.findOneById(
        organizer.id,
      );

      // Assert
      expect(foundOrganizer.isSome()).toBe(true);
      expect(foundOrganizer.unwrap().id).toBe(organizer.id);
    });

    it('should return none if organizer does not exist', async () => {
      // Act
      const foundOrganizer =
        await organizerPrismaRepository.findOneById(randomUUID());

      // Assert
      expect(foundOrganizer.isNone()).toBe(true);
    });
  });

  describe('findAllForBooker', () => {
    it('should return all organizers for a booker', async () => {
      // Arrange
      const organizer1 = Organizer.create({
        ...organizerProps,
        bookerId: existingBookerId,
      }).unwrap();
      await organizerPrismaRepository.save(organizer1);

      const organizer2 = Organizer.create({
        ...organizerProps,
        name: 'Jane Doe',
        bookerId: existingBookerId,
        contactInfos: ContactInfos.create({
          emails: [Email.create('jane.doe@mail.com').unwrap()],
          phones: [],
          website: None,
          address: None,
        }).unwrap(),
      }).unwrap();
      await organizerPrismaRepository.save(organizer2);

      const otherBooker = await prismaService.booker.create({
        data: { email: 'other.booker@mail.com' },
      });
      const otherOrganizer = Organizer.create({
        ...organizerProps,
        bookerId: otherBooker.id,
        contactInfos: ContactInfos.create({
          emails: [Email.create('john.doe@mail.com').unwrap()],
          phones: [],
          website: None,
          address: None,
        }).unwrap(),
      }).unwrap();
      await organizerPrismaRepository.save(otherOrganizer);

      // Act
      const organizers =
        await organizerPrismaRepository.findAllForBooker(existingBookerId);

      // Assert
      expect(organizers).toHaveLength(2);
      organizers.forEach((organizer) => {
        const exists =
          organizer.id === organizer1.id || organizer.id === organizer2.id;
        expect(exists).toBe(true);
      });
    });

    it('should return an empty array if no organizer exists for a booker', async () => {
      // Act
      const organizers =
        await organizerPrismaRepository.findAllForBooker(randomUUID());

      // Assert
      expect(organizers).toHaveLength(0);
    });
  });
});
