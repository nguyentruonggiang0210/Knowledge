import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';

export interface TrendingRepo {
  repo_id: number;
  name: string;
  category: string | null;
  stars: number;
  rank: number;
}

@Injectable({ providedIn: 'root' })
export class TrendingService {
  constructor(private readonly api: ApiService) {}

  getTrending(category?: string, limit = 25): Observable<TrendingRepo[]> {
    const params: Record<string, string | number> = { limit };
    if (category) {
      params['category'] = category;
    }
    return this.api.get<TrendingRepo[]>('repos/trending', params);
  }
}
