import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { LanguageComparisonComponent } from './pages/language-comparison/language-comparison.component';

const routes: Routes = [{ path: '', component: LanguageComparisonComponent }];

@NgModule({
  declarations: [LanguageComparisonComponent],
  imports: [CommonModule, NgxChartsModule, RouterModule.forChild(routes)],
})
export class LanguageStatsModule {}
