import { Test } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

// Dependency injection makes it trivial to swap the real service for a mock.
describe('TasksController', () => {
  let controller: TasksController;
  const tasksService = {
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockImplementation(async (ownerId, dto) => ({ id: 42, ownerId, ...dto })),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: tasksService }],
    }).compile();
    controller = moduleRef.get(TasksController);
  });

  it('passes the current user and filters to the service', async () => {
    await controller.findAll({ id: 7, username: 'demo' }, { status: undefined });

    expect(tasksService.findAll).toHaveBeenCalledWith(7, { status: undefined });
  });

  it('creates a task for the current user', async () => {
    const result = await controller.create({ id: 7, username: 'demo' }, { title: 'Mocked' });

    expect(result).toEqual({ id: 42, ownerId: 7, title: 'Mocked' });
  });
});
