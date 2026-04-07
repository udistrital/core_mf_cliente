import {
  Component,
  Input,
  NO_ERRORS_SCHEMA,
  OnInit,
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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
export class MenuComponent implements OnInit {
  select: boolean = false;

  @Input() item!: NavItem;
  @Input() depth: number = 0;
  @Input() navItems: NavItem[] = [];

  constructor(
    public navService: MenuService,
    private translateService: TranslateService
  ) {
    if (this.depth === undefined) {
      this.depth = 0;
    }
  }

  ngOnInit(): void {
    if (this.item?.expanded) {
      this.select = true;
    }
  }

  private setSelectedMenuId(menuId: string): void {
    localStorage.setItem('select', btoa(menuId));
  }

  getMenuChildren(item: NavItem): NavItem[] {
    return (item.Opciones || []).filter(
      (child: NavItem) => child.TipoOpcion === 'Menú'
    );
  }

  hasMenuChildren(item: NavItem): boolean {
    return this.getMenuChildren(item).length > 0;
  }

  onItemSelected(item: NavItem): void {
    if (item.TipoOpcion !== 'Menú') {
      return;
    }

    const menuChildren = this.getMenuChildren(item);

    if (menuChildren.length === 0) {
      if (!item.Id || item.Nombre === 'Inicio') {
        localStorage.removeItem('select');
        this.navService.collapseAllMenus();
      } else {
        this.setSelectedMenuId(item.Id);
      }

      this.navService.updateOption(item);
      this.navService.closeNav();
      this.navService.goTo(item.Url?.replace('/pages', '') || '');
      return;
    }

    this.navService.collapseAllMenusExcept(item.Id || '');
    this.select = true;
    item.expanded = !item.expanded;
  }
}