import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { distinctUntilChanged } from 'rxjs/operators';
import { NavItem } from '../interfaces/nav-item';
import { MenuService } from '../services/menu.service';
import { MenuComponent } from '../menu/menu.component';
import { MatListModule } from '@angular/material/list';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterLink } from '@angular/router';

enum VisibilityState {
  Visible = 'visible',
  Hidden = 'hidden',
}

@Component({
  selector: 'ng-uui-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [MenuComponent, MatListModule, RouterLink, BrowserAnimationsModule],
  standalone: true,
  animations: [
    trigger('sidebarAnimation', [
      state(
        VisibilityState.Hidden,
        style({ transform: 'scaleX(0.5) translate(-200%)' })
      ),
      state(
        VisibilityState.Visible,
        style({ transform: 'scaleX(1) translate(-0.1%)' })
      ),
      transition('* => *', animate('400ms ease-in')),
    ]),
  ],
})
export class SidebarComponent implements OnInit {
  sidebarAnimation: VisibilityState = VisibilityState.Hidden;
  @Input() navItems: NavItem[] = [];
  @Input() appMenu: string = '';

  constructor(public menuService: MenuService) {}
  ngOnInit(): void {
    this.menuService.menu$
      .pipe(
        distinctUntilChanged(
          (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
        )
      )
      .subscribe((data: any) => {
        if (JSON.stringify(data) !== '{}') {
          if (!this.navItems) {
            this.navItems = data;
          }
        }
      });
    this.menuService.sidebar$.subscribe(
      (opened) =>
        (this.sidebarAnimation = opened
          ? VisibilityState.Visible
          : VisibilityState.Hidden)
    );
  }

  ngOnChanges(changes: any): void {
    if (changes.appMenu !== undefined) {
      if (changes.appMenu.currentValue !== undefined) {
        if (!changes.appMenu.nextValue) {
          if (!this.navItems) {
            this.menuService.getMenu(this.appMenu);
          }
        }
      }
    }
  }
}
