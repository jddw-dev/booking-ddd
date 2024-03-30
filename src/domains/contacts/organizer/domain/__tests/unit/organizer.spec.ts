import { ContactInfos } from '@src/domains/contacts/contact-infos/domain/contact-infos.entity';
import { Email } from '@src/domains/contacts/contact-infos/domain/value-objects/email';
import { randomUUID } from 'crypto';
import { None } from 'oxide.ts';
import { OrganizerCreatedEvent } from '../../events/organizer-created.event';
import {
  Organizer,
  OrganizerProps,
  OrganizerType,
} from '../../organizer.entity';

describe('Organizer Entity', () => {
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

  it('should create a new Organizer', async () => {
    // Act
    const result = Organizer.create(organizerProps);

    // Assert
    expect(result.isOk()).toBe(true);

    const organizer = result.unwrap();
    expect(organizer).toBeInstanceOf(Organizer);
    expect(organizer.id).not.toBeNull();

    const createdEventExists = organizer.domainEvents.some(
      (event) => event instanceof OrganizerCreatedEvent,
    );
    expect(createdEventExists).toBe(true);
  });

  it('should create an Organizer entity, but not raise an OrganizerCreated event', async () => {
    // Arrange
    const existingId = randomUUID();

    // Act
    const result = Organizer.create(organizerProps, existingId);

    // Assert
    expect(result.isOk()).toBe(true);
    const organizer = result.unwrap();
    expect(organizer.id).toBe(existingId);

    const createdEventExists = organizer.domainEvents.some(
      (event) => event instanceof OrganizerCreatedEvent,
    );
    expect(createdEventExists).toBe(false);
  });

  it('should throw if name is empty', async () => {
    // Arrange
    const props: OrganizerProps = {
      bookerId: randomUUID(),
      name: '',
      type: OrganizerType.OTHER,
      contactInfos,
      contactIds: [],
    };

    // Act
    const result = Organizer.create(props);

    // Assert
    expect(result.isErr()).toBe(true);
  });

  it('should throw if name is too long', async () => {
    // Arrange
    const props: OrganizerProps = {
      bookerId: randomUUID(),
      name: 'a'.repeat(256),
      type: OrganizerType.OTHER,
      contactInfos,
      contactIds: [],
    };

    // Act
    const result = Organizer.create(props);

    // Assert
    expect(result.isErr()).toBe(true);
  });
});
