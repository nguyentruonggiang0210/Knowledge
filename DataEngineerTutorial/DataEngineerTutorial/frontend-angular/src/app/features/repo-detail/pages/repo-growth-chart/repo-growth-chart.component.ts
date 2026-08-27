import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { ApiService } from '../../../../core/services/api.service';

interface GrowthPoint {
  recorded_at: string;
  stars: number;
}

@Component({
  selector: 'app-repo-growth-chart',
  template: `
    <h2>Repo growth</h2>
    <ngx-charts-line-chart
      *ngIf="series.length"
      [results]="[{ name: 'stars', series: series }]"
      [xAxis]="true"
      [yAxis]="true"
    ></ngx-charts-line-chart>
  `,
})
export class RepoGrowthChartComponent implements OnInit {
  series: { name: string; value: number }[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: ApiService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.api
      .get<GrowthPoint[]>(`repos/${id}/growth`)
      .pipe(map((points) => points.map((p) => ({ name: p.recorded_at, value: p.stars }))))
      .subscribe((series) => (this.series = series));
  }
}
