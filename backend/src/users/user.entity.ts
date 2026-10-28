import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  // Demo only: plaintext. A real app would store a bcrypt/argon2 hash.
  @Column()
  password: string;

  @Column()
  displayName: string;
}
