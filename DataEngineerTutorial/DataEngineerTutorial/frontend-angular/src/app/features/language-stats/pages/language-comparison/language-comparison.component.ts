import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs';

import { ApiService } from '../../../../core/services/api.service';

interface LanguageStat {
  language: string;
  total_stars: number;
}

@Component({
  selector: 'app-language-comparison',
  template: `
    <h2>Language comparison</h2>
    <ngx-charts-bar-vertical
      *ngIf="data.length"
      [results]="data"
      [xAxis]="true"
      [yAxis]="true"
    ></ngx-charts-bar-vertical>
  `,
})
export class LanguageComparisonComponent implements OnInit {
  data: { name: string; value: number }[] = [];

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.api
      .get<LanguageStat[]>('languages/stats')
      .pipe(map((stats) => stats.map((s) => ({ name: s.language, value: s.total_stars }))))
      .subscribe((data) => (this.data = data));
  }
}
