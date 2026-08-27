import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `<div class="spinner" role="status" aria-label="Loading">Loading...</div>`,
  styles: [`.spinner { padding: 1rem; color: #666; }`],
})
export class LoadingSpinnerComponent {}
