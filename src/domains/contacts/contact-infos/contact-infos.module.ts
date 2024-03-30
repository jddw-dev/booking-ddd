import { Module, Provider } from '@nestjs/common';
import { ContactInfosMapper } from './domain/contact-infos.mapper';

const mappers: Provider[] = [ContactInfosMapper];

@Module({
  imports: [],
  providers: mappers,
  exports: mappers,
})
export class ContactInfosModule {}
