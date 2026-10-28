import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from '../users/users.service';
import { Task, TaskPriority, TaskStatus } from './task.entity';
import { TasksService } from './tasks.service';

// No database needed: the TypeORM repository is replaced with a mock through DI.
describe('TasksService', () => {
  let service: TasksService;
  const repository = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    existsBy: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn(async (data) => data),
    delete: jest.fn(),
  };
  const usersService = { findByUsername: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: repository },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();
    service = moduleRef.get(TasksService);
  });

  it('creates a task owned by the user', async () => {
    const task = await service.create(1, { title: 'Write tests', priority: TaskPriority.HIGH });

    expect(repository.save).toHaveBeenCalledWith({ title: 'Write tests', priority: TaskPriority.HIGH, ownerId: 1 });
    expect(task.ownerId).toBe(1);
  });

  it('scopes queries to the owner and applies filters', async () => {
    repository.find.mockResolvedValue([]);

    await service.findAll(1, { status: TaskStatus.DONE });

    expect(repository.find).toHaveBeenCalledWith({
      where: { ownerId: 1, status: TaskStatus.DONE },
      order: { id: 'ASC' },
    });
  });

  it("throws NotFound when the task doesn't belong to the user", async () => {
    repository.findOneBy.mockResolvedValue(null);

    await expect(service.findOne(2, 5)).rejects.toThrow(NotFoundException);
    expect(repository.findOneBy).toHaveBeenCalledWith({ id: 5, ownerId: 2 });
  });

  it('applies partial updates', async () => {
    repository.findOneBy.mockResolvedValue({ id: 5, title: 'Old', status: TaskStatus.TODO, ownerId: 1 });

    const task = await service.update(1, 5, { status: TaskStatus.DONE });

    expect(task).toMatchObject({ id: 5, title: 'Old', status: TaskStatus.DONE });
  });

  it('throws NotFound when deleting a missing task', async () => {
    repository.delete.mockResolvedValue({ affected: 0 });

    await expect(service.remove(1, 99)).rejects.toThrow(NotFoundException);
  });

  it('seeds demo tasks only when the demo user has none', async () => {
    usersService.findByUsername.mockResolvedValue({ id: 1 });
    repository.existsBy.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    await service.onApplicationBootstrap();
    await service.onApplicationBootstrap();

    expect(repository.save).toHaveBeenCalledTimes(1);
  });
});
