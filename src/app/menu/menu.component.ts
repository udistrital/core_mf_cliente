import {
  Component,
  HostBinding,
  Input,
  NO_ERRORS_SCHEMA,
} from '@angular/core';
import { NavItem } from './../interfaces/nav-item';
import { MenuService } from '../services/menu.service';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'ng-uui-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [MatIconModule, TranslateModule],
  schemas: [NO_ERRORS_SCHEMA],
  animations: [
    trigger('indicatorRotate', [
      state('collapsed', style({ transform: 'rotate(90deg)' })),
      state('expanded', style({ transform: 'rotate(0deg)' })),
      transition(
        'expanded <=> collapsed',
        animate('125ms cubic-bezier(0.4,0.0,0.2,1)')
      ),
    ]),
    trigger('slideDown', [
      state('void', style({ transform: 'translateY(-10%)', opacity: 0 })),
      state('*', style({ transform: 'translateY(0)', opacity: 1 })),
      transition('void => *', animate('400ms ease-in-out')),
    ]),
  ],
})
export class MenuComponent {
  select: any= false;
  @Input() item!: NavItem;
  @Input() depth: number = 0;
  @Input() navItems: NavItem[] = [];

  constructor(public navService: MenuService) {
    if (this.depth === undefined) {
      this.depth = 0;
    }
  }

  onItemSelected(item: NavItem) {


    this.navService.collapseAllMenus();

    if (!item.Opciones || item.Opciones.length === 0) {
      this.navService.updateOption(item);
      this.navService.closeNav();
      this.navService.goTo(item.Url?.replace('/pages', '') || '');
    }
    

    if (item.Opciones && item.Opciones.length > 0) {
      //console.log(item.Id);
      localStorage.setItem('select', JSON.stringify(item.Id));
      if (item.Id == localStorage.getItem('select')) {
        this.select=true
        item.expanded = !item.expanded;
      } 
    }
  }
}