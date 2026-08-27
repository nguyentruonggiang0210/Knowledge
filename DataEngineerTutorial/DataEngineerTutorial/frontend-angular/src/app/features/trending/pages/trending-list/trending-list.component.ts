import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, debounceTime, startWith, switchMap } from 'rxjs';

import { TrendingRepo, TrendingService } from '../../services/trending.service';

@Component({
  selector: 'app-trending-list',
  template: `
    <h2>Top Trending Repos</h2>
    <input [formControl]="categoryFilter" placeholder="Filter by category" />
    <ul>
      <li *ngFor="let repo of repos$ | async">
        #{{ repo.rank }} — {{ repo.name }} ({{ repo.stars }} ⭐)
      </li>
    </ul>
  `,
})
export class TrendingListComponent implements OnInit {
  categoryFilter = new FormControl('');
  repos$!: Observable<TrendingRepo[]>;

  constructor(private readonly trending: TrendingService) {}

  ngOnInit(): void {
    this.repos$ = this.categoryFilter.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap((category) => this.trending.getTrending(category ?? undefined)),
    );
  }
}
