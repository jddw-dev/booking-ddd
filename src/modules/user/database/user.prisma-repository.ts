import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/infrastructure/prisma/prisma.service';
import { Paginated, PaginatedQueryParams } from '@src/libs/ddd';
import { None, Option, Some } from 'oxide.ts';
import { z } from 'zod';
import { UserEntity } from '../domain/user.entity';
import { UserMapper } from '../domain/user.mapper';
import { UserRepositoryPort } from './user.repository.port';

export const userSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.preprocess((val: any) => new Date(val), z.date()),
  updatedAt: z.preprocess((val: any) => new Date(val), z.date()),
  email: z.string().email(),
  hashedPassword: z.string(),
});

export type UserModel = z.infer<typeof userSchema>;

@Injectable()
export class UserPrismaRepository implements UserRepositoryPort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: UserMapper,
  ) {}

  async save(entity: UserEntity | UserEntity[]): Promise<void> {
    const entities = Array.isArray(entity) ? entity : [entity];
    const records = entities.map((entity) => this.mapper.toPersistence(entity));
    try {
      await this.prisma.user.createMany({ data: records });
    } catch (error: any) {}
  }

  async findOneById(id: string): Promise<Option<UserEntity>> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? Some(this.mapper.toDomain(user)) : None;
  }

  async findOneByEmail(email: string): Promise<Option<UserEntity>> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? Some(this.mapper.toDomain(user)) : None;
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany();
    return users.map((user) => this.mapper.toDomain(user));
  }

  async findAllPaginated(
    params: PaginatedQueryParams,
  ): Promise<Paginated<UserEntity>> {
    const { limit, page, offset, orderBy } = params;
    const [count, data] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        take: limit,
        skip: offset,
        orderBy: {
          [orderBy.field === true ? 'id' : orderBy.field]: orderBy.param,
        },
      }),
    ]);

    return new Paginated({
      count,
      limit,
      page,
      data: data.map((user) => this.mapper.toDomain(user)),
    });
  }

  async delete(entity: UserEntity): Promise<boolean> {
    const user = await this.prisma.user.delete({ where: { id: entity.id } });
    return !!user;
  }
}
