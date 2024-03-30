import { Injectable } from '@nestjs/common';
import { Mapper } from '@src/libs/ddd';
import { ContactInfosMapper } from '../../contact-infos/domain/contact-infos.mapper';
import {
  OrganizerModel,
  organizerSchema,
} from '../infrastructure/persistence/organizer.model';
import { Organizer } from './organizer.entity';
import { OrganizerError } from './organizer.errors';

@Injectable()
export class OrganizerMapper implements Mapper<Organizer, OrganizerModel> {
  constructor(private contactInfosMapper: ContactInfosMapper) {}

  toDomain(record: OrganizerModel): Organizer {
    const result = Organizer.create(
      {
        bookerId: record.bookerId,
        name: record.name,
        type: record.type,
        contactInfos: this.contactInfosMapper.toDomain(record.contactInfos),
        contactIds: record.contactIds,
      },
      record.id,
    );

    if (result.isErr()) {
      throw new OrganizerError(
        'An error occured during Organizer mapping',
        result.unwrapErr(),
      );
    }

    return result.unwrap();
  }

  // TODO : should contacts be connected here?
  toPersistence(entity: Organizer): OrganizerModel {
    const record: OrganizerModel = {
      id: entity.id,
      bookerId: entity.bookerId,
      name: entity.name,
      type: entity.type,
      contactInfos: this.contactInfosMapper.toPersistence(entity.contactInfos),
      contactIds: entity.contactIds,
    };

    return organizerSchema.parse(record);
  }
}
