import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { MenuService } from './services/menu.service';
import { OasComponent } from './oas/oas.component';
import { mount } from '../main.single-spa';
import { singleSpaPropsSubject } from '../single-spa/single-spa-props';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@Component({
  selector: 'core-mf',
  standalone: true,
  imports: [CommonModule, RouterOutlet, OasComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  opened: boolean = false;
  userData = { user: null, userService: null };
  environment = environment;

  constructor(private menuService: MenuService) {
    singleSpaPropsSubject.subscribe((props) => {
      this.environment = Object.assign(environment, props.environment);
    });
    this.menuService.sidebar$.subscribe((opened) => (this.opened = opened));
    window.addEventListener('single-spa:before-routing-event', (event: any) => {
      const detail = event.detail;
    });
  }

  userEvent(event: any) {
    const { user, userService } = event;
    if (
      userService &&
      user &&
      !this.userData.user &&
      !this.userData.userService
    ) {
      this.userData.user = user;
      this.userData.userService = userService;
    }
  }

  optionEvent(event: any) {
    const { Url } = event;
    if (Url) {
    }
  }
}
