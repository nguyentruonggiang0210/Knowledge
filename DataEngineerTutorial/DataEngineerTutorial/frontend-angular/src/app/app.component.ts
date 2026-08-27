import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <nav>
      <a routerLink="/trending">Trending</a>
      <a routerLink="/languages">Languages</a>
    </nav>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {}
