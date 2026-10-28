import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Defaults match docker-compose.yml, so `npm run db:up` is all that's needed locally.
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get('DB_PORT', 5432)),
        username: config.get<string>('DB_USER', 'tasks'),
        password: config.get<string>('DB_PASSWORD', 'tasks'),
        database: config.get<string>('DB_NAME', 'tasks'),
        // Entities registered via TypeOrmModule.forFeature() are picked up automatically.
        autoLoadEntities: true,
        // Demo convenience: creates/updates tables from the entities on startup.
        // Use migrations instead in real environments.
        synchronize: true,
        dropSchema: config.get('DB_DROP_SCHEMA') === 'true',
      }),
    }),
    UsersModule,
    AuthModule,
    TasksModule,
    HealthModule,
  ],
})
export class AppModule {}
