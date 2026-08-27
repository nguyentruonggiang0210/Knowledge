import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { RepoGrowthChartComponent } from './pages/repo-growth-chart/repo-growth-chart.component';

const routes: Routes = [{ path: ':id', component: RepoGrowthChartComponent }];

@NgModule({
  declarations: [RepoGrowthChartComponent],
  imports: [CommonModule, NgxChartsModule, RouterModule.forChild(routes)],
})
export class RepoDetailModule {}
