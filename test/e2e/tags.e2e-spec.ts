import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { random } from 'faker';
import { curry } from 'lodash';
import * as request from 'supertest';
import { TagsModule } from '../../src/api/tags/tags.module';
import { TagsService } from '../../src/api/tags/tags.service';
import { CATEGORIES } from '../../src/shared/enum/tag-categories.enum';
import { TagDocument } from '../../src/shared/schemas/tag.schema';
import { createTestingApp, testRequests } from '../helpers/e2e';
import { mockTags, tagsService } from '../mocks/tags.service.mock';

describe('TagsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TagsModule],
    })
      .overrideProvider(TagsService)
      .useValue(tagsService)
      .overrideProvider(getModelToken(TagDocument.name))
      .useValue({})
      .compile();

    app = createTestingApp(moduleRef);
    await app.init();
  });

  describe('/tags/list/:category (GET)', () => {
    it('sort by popularity', () => {
      const result = tagsService.getTagsByPopularity(CATEGORIES.artists, 1);

      return request(app.getHttpServer())
        .get('/tags/list/artists?popular=true&page=1')
        .expect(200)
        .expect({
          data: result,
          pagination: {
            page: 1,
            total: tagsService.getPageCount(CATEGORIES.artists),
          },
        });
    });

    it('sort by name', () => {
      const result = tagsService.getTags(CATEGORIES.artists, 1);

      return request(app.getHttpServer())
        .get('/tags/list/artists?popular=false&page=1')
        .expect(200)
        .expect({
          data: result,
          pagination: {
            page: 1,
            total: tagsService.getPageCount(CATEGORIES.artists),
          },
        });
    });

    it('throws 404 error when requested page does not exist', async () => {
      const numberOfPages = tagsService.getPageCount(CATEGORIES.artists);

      return request(app.getHttpServer())
        .get(`/tags/list/artists?popular=false&page=${numberOfPages + 1}`)
        .expect(404);
    });

    it('throws 400 error on wrong parameters values', async () => {
      const httpServer = app.getHttpServer();
      const badRequests: string[] = [
        '/tags/list/notacategory?popular=false&page=1',
        '/tags/list/artists?popular=false&page=0',
        '/tags/list/artists?popular=false&page=1.50',
        '/tags/list/artists?popular=false&page=notanumber',
        '/tags/list/artists?popular=false&page=-1',
      ];

      await testRequests(httpServer, badRequests, 400);
    });

    it('converts parameters types', async () => {
      const httpServer = app.getHttpServer();
      const byPopularity = curry(tagsService.getTagsByPopularity)(
        CATEGORIES.artists,
      );
      const byName = curry(tagsService.getTags)(CATEGORIES.artists);

      const shouldOrderByPopularity: string[] = [
        '/tags/list/artists?popular=true&page=1',
        '/tags/list/artists?popular=1&page=1',
        '/tags/list/artists?popular=anything&page=1',
      ];
      const shouldOrderByName: string[] = [
        '/tags/list/artists?popular=false&page=1',
        '/tags/list/artists?page=1',
      ];
      const shouldWorks: string[] = [
        '/tags/list/artists',
        '/tags/list/artists?page=1',
      ];

      for (const req of shouldOrderByPopularity) {
        await request(httpServer)
          .get(req)
          .expect(200)
          .then(res => {
            expect(res.body.data).toStrictEqual(byPopularity(1));
          });
      }

      for (const req of shouldOrderByName) {
        await request(httpServer)
          .get(req)
          .expect(200)
          .then(res => {
            expect(res.body.data).toStrictEqual(byName(1));
          });
      }

      for (const req of shouldWorks) {
        await request(httpServer)
          .get(req)
          .expect(200);
      }
    });
  });

  describe('/tags/list/:category/:letter (GET)', () => {
    it('returns all tags starting with specified letter, sorted by name', async () => {
      const result = tagsService.getTagsByLetter(CATEGORIES.artists, 'A');

      return request(app.getHttpServer())
        .get('/tags/list/artists/a')
        .expect(200)
        .expect(result);
    });

    it('is case insensitive', async () => {
      const result = tagsService.getTagsByLetter(CATEGORIES.artists, 'A');

      await request(app.getHttpServer())
        .get('/tags/list/artists/a')
        .expect(200)
        .expect(result);

      await request(app.getHttpServer())
        .get('/tags/list/artists/A')
        .expect(200)
        .expect(result);
    });

    it('throws 400 error on wrong parameters values', async () => {
      const httpServer = app.getHttpServer();
      const badRequests: string[] = [
        '/tags/list/notacategory/a',
        '/tags/list/artists/notaletter',
      ];

      await testRequests(httpServer, badRequests, 400);
    });
  });

  describe('/tags/details/:id (GET)', () => {
    it('returns requested tag', async () => {
      const result = tagsService.getTagById(random.arrayElement(mockTags).id);

      await request(app.getHttpServer())
        .get(`/tags/details/${result.id}`)
        .expect(200)
        .expect(result);
    });

    it('returns 404 error when tag does not exist', async () => {
      await request(app.getHttpServer())
        .get('/tags/details/999999')
        .expect(404);
    });

    it('validate and convert parameters', async () => {
      const httpServer = app.getHttpServer();
      const badRequests = [
        '/tags/details/0',
        '/tags/details/bite',
        '/tags/details/NaN',
      ];
      const goodRequests = [
        `/tags/details/${random.arrayElement(mockTags).id}`,
      ];

      await testRequests(httpServer, badRequests, 400);
      await testRequests(httpServer, goodRequests, 200);
    });
  });

  describe('/tags/search', () => {
    it.todo('returns tags including search query');

    it.todo('returns tags including search query and category');

    it.todo('returns empty array if nothing found');

    it.todo('validate and convert parameters');
  });

  afterAll(async () => {
    await app.close();
  });
});
