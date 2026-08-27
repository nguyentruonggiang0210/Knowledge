import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { TrendingListComponent } from './pages/trending-list/trending-list.component';
import { TrendingRoutingModule } from './trending-routing.module';

@NgModule({
  declarations: [TrendingListComponent],
  imports: [CommonModule, ReactiveFormsModule, TrendingRoutingModule, LoadingSpinnerComponent],
})
export class TrendingModule {}
