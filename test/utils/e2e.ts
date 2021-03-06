import { ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

function createTestingApp(module: TestingModule) {
  const app = module.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  return app;
}

async function testRequests<T>(
  httpServer: any,
  datas: T[],
  assertFunction: (
    supertest: request.SuperTest<request.Test>,
    value: T,
  ) => void | Promise<void>,
): Promise<void>;
async function testRequests(
  httpServer: any,
  badRequests: string[],
  code: number,
): Promise<void>;
async function testRequests<T>(
  httpServer: any,
  p1: string[] | T[],
  p2:
    | ((
        supertest: request.SuperTest<request.Test>,
        value: T,
      ) => void | Promise<void>)
    | number,
): Promise<void> {
  const supertest = request(httpServer);

  if (typeof p2 === 'number') {
    p1 = p1 as string[];

    for (const url of p1) {
      await supertest.get(url).expect(p2);
    }

    return;
  }

  if (typeof p2 === 'function') {
    p1 = p1 as T[];

    for (const value of p1) {
      await p2(supertest, value);
    }

    return;
  }
}

export { createTestingApp, testRequests };
