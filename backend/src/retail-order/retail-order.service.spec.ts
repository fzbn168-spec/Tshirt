import { Test, TestingModule } from '@nestjs/testing';
import { RetailOrderService } from './retail-order.service';

describe('RetailOrderService', () => {
  let service: RetailOrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RetailOrderService],
    }).compile();

    service = module.get<RetailOrderService>(RetailOrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
