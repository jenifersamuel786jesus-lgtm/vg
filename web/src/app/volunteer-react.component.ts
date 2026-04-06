import { AfterViewInit, Component } from '@angular/core';

@Component({
  selector: 'app-volunteer-react',
  standalone: true,
  template: `<div id="volunteer-root"></div>`
})
export class VolunteerReactComponent implements AfterViewInit {
  ngAfterViewInit() {
    const render = (window as any).renderVolunteerApp;
    if (typeof render === 'function') {
      render('volunteer-root');
    }
  }
}
