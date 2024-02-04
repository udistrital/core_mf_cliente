import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { MenuService } from './services/menu.service';
import { OasComponent } from './oas/oas.component';
import { singleSpaPropsSubject } from '../single-spa/single-spa-props';
import { fromEvent } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { getCookie } from './header/header.component';



@Component({
  selector: 'core-mf',
  standalone: true,
  imports: [CommonModule, RouterOutlet, OasComponent,],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit{
  opened: boolean = false;
  userData = { user: null, userService: null };
  environment = environment;
  whatLang$ = fromEvent(window, 'lang');

  constructor(
    private menuService: MenuService,
    private translate: TranslateService) {
    singleSpaPropsSubject.subscribe((props) => {
      this.environment = Object.assign(environment, props.environment);
    });
    this.menuService.sidebar$.subscribe((opened) => (this.opened = opened));
    window.addEventListener('single-spa:before-routing-event', (event: any) => {
      const detail = event.detail;
    });
  }

  ngOnInit(): void {
    this.validateLang()
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

  validateLang() {
    let lang = getCookie('lang') || 'es';
    this.whatLang$.subscribe((x:any) => {
      lang = x['detail']['answer'];
      this.translate.setDefaultLang(lang)
    });
    this.translate.setDefaultLang(getCookie('lang') || 'es');
  }
}
