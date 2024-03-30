import { Guard } from '@src/libs/core/guard';
import { AggregateRoot, EntityID } from '@src/libs/ddd';
import { Err, Ok, Result } from 'oxide.ts';
import { ContactInfos } from '../../contact-infos/domain/contact-infos.entity';
import { OrganizerCreatedEvent } from './events/organizer-created.event';
import { OrganizerError } from './organizer.errors';

export type OrganizerName = string;
export type ContactIds = EntityID[];

export enum OrganizerType {
  CITY_HALL = 'CITY_HALL',
  TOURIST_OFFICE = 'TOURIST_OFFICE',
  ASSOCIATION = 'ASSOCIATION',
  OTHER = 'OTHER',
}

export interface OrganizerProps {
  bookerId: EntityID;
  name: OrganizerName;
  type: OrganizerType;
  contactInfos: ContactInfos;
  contactIds: ContactIds;
}

export class Organizer extends AggregateRoot<OrganizerProps> {
  get bookerId(): EntityID {
    return this.props.bookerId;
  }

  get name(): OrganizerName {
    return this.props.name;
  }

  public changeName(name: OrganizerName): void {
    this.props.name = name;
  }

  get type(): OrganizerType {
    return this.props.type;
  }

  get contactInfos(): ContactInfos {
    return this.props.contactInfos;
  }

  get contactIds(): ContactIds {
    return this.props.contactIds;
  }

  private constructor(props: OrganizerProps, id?: EntityID) {
    super(props, id);
  }

  static create(
    props: OrganizerProps,
    id?: EntityID,
  ): Result<Organizer, OrganizerError> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.bookerId, argumentName: 'bookerId' },
      { argument: props.name, argumentName: 'name' },
      { argument: props.type, argumentName: 'type' },
    ]);
    if (guardResult.isErr()) {
      return guardResult.mapErr((error) => new OrganizerError(error));
    }

    if (this.nameIsEmpty(props.name)) {
      return Err(new OrganizerError('Name cannot be empty'));
    }
    if (this.nameIsTooLong(props.name)) {
      return Err(
        new OrganizerError('Name cannot be longer than 255 characters'),
      );
    }

    const isNew = !id;
    const organizer = new Organizer(
      {
        ...props,
        contactIds: props.contactIds ? props.contactIds : [],
      },
      id,
    );

    if (isNew) {
      organizer.addDomainEvent(new OrganizerCreatedEvent(organizer));
    }

    return Ok(organizer);
  }

  private static nameIsEmpty(name: OrganizerName): boolean {
    return name.trim() === '';
  }

  private static nameIsTooLong(name: OrganizerName): boolean {
    return name.length > 255;
  }
}
