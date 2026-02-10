import {
  Component,
  HostBinding,
  Input,
  NO_ERRORS_SCHEMA,
  OnInit,
  ChangeDetectorRef,
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
  select: any = false;
  @Input() item!: NavItem;
  @Input() depth: number = 0;
  @Input() navItems: NavItem[] = [];

  constructor(
    public navService: MenuService,
    private translateService: TranslateService,
    private cdr: ChangeDetectorRef
  ) {
    if (this.depth === undefined) {
      this.depth = 0;
    }
  }

  ngOnInit(): void {
    this.restoreMenuState();
  }

  private restoreMenuState(): void {
    const selectedMenuId = this.getSelectedMenuId();
    if (!selectedMenuId || !this.item) return;

    if (String(this.item.Id) === String(selectedMenuId)) {

      if (this.item.Opciones && this.item.Opciones.length > 0) {
        localStorage.removeItem('select');
        return;
      }

      this.select = true;
      this.item.expanded = true;
      this.cdr.detectChanges();
      return;
    }

    if (this.item.expanded) {
      this.select = true;
      this.cdr.detectChanges();
    }
  }

  private getSelectedMenuId(): string | null {
    const selectedMenuEncoded = localStorage.getItem('select');
    if (!selectedMenuEncoded) return null;
    try {
      return atob(selectedMenuEncoded);
    } catch (e) {
      try {
        return JSON.parse(selectedMenuEncoded);
      } catch {
        return selectedMenuEncoded;
      }
    }
  }

  private setSelectedMenuId(menuId: string): void {
    localStorage.setItem('select', btoa(menuId));
  }

  onItemSelected(item: NavItem) {
    if (!item.Opciones || item.Opciones.length === 0) {
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
    if (item.Opciones && item.Opciones.length > 0) {

      this.navService.collapseAllMenusExcept(item.Id || '');

      this.select = true;
      item.expanded = !item.expanded;
    }
  }
}