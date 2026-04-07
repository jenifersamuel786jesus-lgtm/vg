import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  showNav = false;

  constructor(private router: Router) {
    this.updateNav(router.url);
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateNav(event.urlAfterRedirects);
      }
    });
  }

  private updateNav(url: string) {
    const path = url.split('?')[0];
    this.showNav = !(path === '/' || path === '' || path === '/home');
  }
}
