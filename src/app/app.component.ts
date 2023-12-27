import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { MenuService } from './services/menu.service';
import { OasComponent } from './oas/oas.component';

@Component({
  selector: 'core-mf',
  standalone: true,
  imports: [CommonModule, RouterOutlet, OasComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'core-mf';

  opened: boolean = false;
  userData = {user: null, userService: null}
  environment = environment;
  constructor(private menuService: MenuService) {
    this.menuService.sidebar$.subscribe((opened) => (this.opened = opened))
    window.addEventListener("single-spa:before-routing-event", (event: any) => {
      const detail = event.detail;
  
      console.log("detalle",detail)
    });
  }

  

  userEvent(event:any) {
    const {user, userService} = event;
    if(userService && user && !this.userData.user && !this.userData.userService){
      this.userData.user = user;
      this.userData.userService = userService;
    }
  }

  optionEvent(event:any) {
    const {Url} = event;
    if(Url) {
    }
  }
}
