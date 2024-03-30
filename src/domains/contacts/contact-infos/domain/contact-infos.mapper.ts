import { Injectable } from '@nestjs/common';
import { Mapper } from '@src/libs/ddd';
import { None, Some } from 'oxide.ts';
import {
  AddressModel,
  ContactInfosModel,
} from '../infrastructure/persistence/contact-infos.model';
import { ContactInfos } from './contact-infos.entity';
import { ContactInfosError } from './contact-infos.errors';
import { Address } from './value-objects/address';
import { Email } from './value-objects/email';
import { Website } from './value-objects/website';

@Injectable()
export class ContactInfosMapper
  implements Mapper<ContactInfos, ContactInfosModel>
{
  toDomain(record: ContactInfosModel): ContactInfos {
    const result = ContactInfos.create(
      {
        emails:
          record.emails?.map((email) => Email.create(email.value).unwrap()) ??
          [],
        phones: record.phones?.map((phone) => phone.value) ?? [],
        website: record.website
          ? Some(Website.create(record.website).unwrap())
          : None,
        address: record.address
          ? Some(
              Address.create({
                street: record.address.street
                  ? Some(record.address.street)
                  : None,
                city: record.address.city,
                zipCode: record.address.zipCode,
                country: record.address.country
                  ? Some(record.address.country)
                  : None,
              }).unwrap(),
            )
          : None,
      },
      record.id,
    );

    if (result.isErr()) {
      throw new ContactInfosError(
        'An error occured during ContactInfos mapping',
        result.unwrapErr(),
      );
    }

    return result.unwrap();
  }

  toPersistence(entity: ContactInfos): ContactInfosModel {
    let address: AddressModel | undefined = undefined;
    if (entity.address.isSome()) {
      const addressValue = entity.address.unwrap();
      address = {
        street: addressValue.street.isSome()
          ? addressValue.street.unwrap()
          : undefined,
        city: addressValue.city,
        zipCode: addressValue.zipCode,
        country: addressValue.country.isSome()
          ? addressValue.country.unwrap()
          : undefined,
      };
    }

    return {
      id: entity.id,
      emails: entity.emails.map((email) => ({ value: email.value })),
      phones: entity.phones.map((phone) => ({ value: phone })),
      website: entity.website.isSome()
        ? entity.website.unwrap().link
        : undefined,
      address,
    };
  }
}
