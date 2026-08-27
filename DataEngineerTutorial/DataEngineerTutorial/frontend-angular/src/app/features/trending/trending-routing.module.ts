import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TrendingListComponent } from './pages/trending-list/trending-list.component';

const routes: Routes = [{ path: '', component: TrendingListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TrendingRoutingModule {}
