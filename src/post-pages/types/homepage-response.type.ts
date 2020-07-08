import { Pagination } from '../../common/types/pagination.type';

export interface HomepageResponse {
  data: HomepagePosts;
  pagination: Pagination;
}

export type HomepagePosts = {
  popular: PostComponent[];
  recent: PostComponent[];
};

type PostComponent = {
  thumbnail: string;
  name: string;
  lang: string;
  id: number;
};