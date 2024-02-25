import { Module, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '@src/infrastructure/prisma/prisma.module';
import { RegisterBookerService } from './application/commands/register-booker/register-booker.service';
import { CreateBookerHttpController } from './commands/create-booker/create-booker.http.controller';
import { BookerMapper } from './domain/booker.mapper';
import { BookerPrismaRepository } from './infrastructure/persistence/booker.prisma-repository';
import { BOOKER_REPOSITORY } from './infrastructure/persistence/booker.repository.port';

const httpControllers = [CreateBookerHttpController];

const commandHandlers: Provider[] = [RegisterBookerService];
const mappers: Provider[] = [BookerMapper];
const repositories: Provider[] = [
  {
    provide: BOOKER_REPOSITORY,
    useClass: BookerPrismaRepository,
  },
];

@Module({
  imports: [PrismaModule, CqrsModule],
  controllers: [...httpControllers],
  providers: [...mappers, ...repositories, ...commandHandlers],
})
export class BookerModule {}
