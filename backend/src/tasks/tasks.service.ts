import { Injectable, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, TaskPriority, TaskStatus } from './task.entity';

@Injectable()
export class TasksService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Task) private readonly tasksRepository: Repository<Task>,
    private readonly usersService: UsersService,
  ) {}

  // Seed sample tasks for the "demo" user on first run. Runs after every module's
  // onModuleInit, so the demo users already exist.
  async onApplicationBootstrap() {
    const demo = await this.usersService.findByUsername('demo');
    if (!demo || (await this.tasksRepository.existsBy({ ownerId: demo.id }))) return;

    await this.tasksRepository.save([
      { title: 'Explore the Swagger docs', priority: TaskPriority.HIGH, ownerId: demo.id },
      { title: 'Read the AuthModule guard', description: 'See how @Public() works', ownerId: demo.id },
      { title: 'Run the app', priority: TaskPriority.LOW, status: TaskStatus.DONE, ownerId: demo.id },
    ]);
  }

  findAll(ownerId: number, query: TaskQueryDto = {}): Promise<Task[]> {
    const where: FindOptionsWhere<Task> = { ownerId };
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    return this.tasksRepository.find({ where, order: { id: 'ASC' } });
  }

  async findOne(ownerId: number, id: number): Promise<Task> {
    const task = await this.tasksRepository.findOneBy({ id, ownerId });
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return task;
  }

  create(ownerId: number, dto: CreateTaskDto): Promise<Task> {
    return this.tasksRepository.save(this.tasksRepository.create({ ...dto, ownerId }));
  }

  async update(ownerId: number, id: number, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(ownerId, id);
    return this.tasksRepository.save(Object.assign(task, dto));
  }

  async remove(ownerId: number, id: number): Promise<void> {
    const { affected } = await this.tasksRepository.delete({ id, ownerId });
    if (!affected) {
      throw new NotFoundException(`Task ${id} not found`);
    }
  }
}
