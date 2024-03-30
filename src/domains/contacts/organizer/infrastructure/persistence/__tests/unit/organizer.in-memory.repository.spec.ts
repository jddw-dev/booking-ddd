import { Test, TestingModule } from '@nestjs/testing';
import { ContactInfos } from '@src/domains/contacts/contact-infos/domain/contact-infos.entity';
import { Email } from '@src/domains/contacts/contact-infos/domain/value-objects/email';
import {
  Organizer,
  OrganizerProps,
  OrganizerType,
} from '@src/domains/contacts/organizer/domain/organizer.entity';
import { EntityID } from '@src/libs/ddd';
import { randomUUID } from 'crypto';
import { None } from 'oxide.ts';
import { OrganizerInMemoryRepository } from '../../organizer.in-memory.repository';

describe('OrganizerInMemoryRepository', () => {
  let repository: OrganizerInMemoryRepository;

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
      providers: [OrganizerInMemoryRepository],
    }).compile();

    repository = module.get<OrganizerInMemoryRepository>(
      OrganizerInMemoryRepository,
    );
  });

  describe('Insert or update a Organizer', () => {
    afterEach(() => {
      repository.organizers = [];
    });

    it('should insert a new Organizer', async () => {
      // Arrange
      const organizer = Organizer.create(organizerProps).unwrap();
      const organizersCount = repository.organizers.length;

      // Act
      await repository.save(organizer);

      // Assert
      expect(repository.organizers.length).toBe(organizersCount + 1);
    });

    it('should update an existing organizer', async () => {
      // Arrange
      const organizer = Organizer.create(organizerProps).unwrap();
      await repository.save(organizer);
      const organizersCount = repository.organizers.length;

      // Act
      organizer.changeName('Jérémy Dutheil');
      await repository.save(organizer);

      // Assert
      expect(repository.organizers.length).toBe(organizersCount);
    });
  });

  describe('Find a Organizer by ID', () => {
    let knownOrganizerId: EntityID;

    beforeAll(async () => {
      const organizer = Organizer.create(organizerProps).unwrap();
      const organizer2 = Organizer.create({
        ...organizerProps,
        name: 'Jane Doe',
      }).unwrap();
      await repository.save(organizer);
      await repository.save(organizer2);

      knownOrganizerId = organizer.id;
    });

    afterAll(() => {
      repository.organizers = [];
    });

    it('given an existing ID, should return the organizer', async () => {
      // Act
      const result = await repository.findOneById(knownOrganizerId);

      // Assert
      expect(result.isSome()).toBe(true);
      const organizer = result.unwrap();
      expect(organizer).toBeInstanceOf(Organizer);
      expect(organizer.id).toEqual(knownOrganizerId);
    });

    it('given an unknown ID, should return None', async () => {
      // Act
      const result = await repository.findOneById(randomUUID());

      // Assert
      expect(result.isNone()).toBe(true);
    });
  });

  describe('Find all organizers for a booker', () => {
    let knownBookerId: EntityID;

    beforeAll(async () => {
      const organizer = Organizer.create(organizerProps).unwrap();
      await repository.save(organizer);

      knownBookerId = organizer.bookerId;
    });

    afterAll(() => {
      repository.organizers = [];
    });

    it('given an existing booker ID, should return the organizers', async () => {
      // Act
      const result = await repository.findAllForBooker(knownBookerId);

      // Assert
      expect(result.length).toBeGreaterThan(0);
      result.forEach((organizer) => {
        expect(organizer.bookerId).toEqual(knownBookerId);
      });
    });

    it('given an unknown booker ID, should return an empty array', async () => {
      // Act
      const result = await repository.findAllForBooker(randomUUID());

      // Assert
      expect(result.length).toBe(0);
    });
  });
});
