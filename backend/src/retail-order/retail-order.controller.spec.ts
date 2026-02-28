import { Test, TestingModule } from '@nestjs/testing';
import { RetailOrderController } from './retail-order.controller';

describe('RetailOrderController', () => {
  let controller: RetailOrderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RetailOrderController],
    }).compile();

    controller = module.get<RetailOrderController>(RetailOrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
