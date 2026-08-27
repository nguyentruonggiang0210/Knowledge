import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'trending', pathMatch: 'full' },
  {
    path: 'trending',
    loadChildren: () =>
      import('./features/trending/trending.module').then((m) => m.TrendingModule),
  },
  {
    path: 'repos',
    loadChildren: () =>
      import('./features/repo-detail/repo-detail.module').then((m) => m.RepoDetailModule),
  },
  {
    path: 'languages',
    loadChildren: () =>
      import('./features/language-stats/language-stats.module').then(
        (m) => m.LanguageStatsModule,
      ),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
