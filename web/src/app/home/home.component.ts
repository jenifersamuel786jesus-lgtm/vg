import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
  <section class="front-hero">
    <div class="front-copy">
      <p class="front-eyebrow">Volunteer & Grow</p>
      <h1>Make every hour count.</h1>
      <p class="front-sub">
        Discover meaningful events, build skills, and earn recognition that lasts.
      </p>
      <div class="front-actions">
        <a class="front-btn" routerLink="/volunteer">I am a Volunteer</a>
        <a class="front-btn ghost" routerLink="/organization">I represent an Organization</a>
      </div>
    </div>
    <div class="front-media">
      <img src="image.png" alt="Volunteers collaborating" />
      <div class="front-badge">Together we grow</div>
    </div>
  </section>
  `
})
export class HomeComponent {}
