import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

const DEMO_USERS: Omit<User, 'id'>[] = [
  { username: 'demo', password: 'demo123', displayName: 'Demo User' },
  { username: 'admin', password: 'admin123', displayName: 'Admin' },
];

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(@InjectRepository(User) private readonly usersRepository: Repository<User>) {}

  // Make sure the demo accounts exist (idempotent, safe on every startup).
  async onModuleInit() {
    await this.usersRepository.upsert(DEMO_USERS, ['username']);
  }

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ username });
  }
}
