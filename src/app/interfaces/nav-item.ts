export interface NavItem {
    Id?: string;
    disabled?: boolean;
    Nombre: string;
    Icono?: string;
    Url?: string;
    expanded?: boolean;
    TipoOpcion?: string;
    Opciones?: NavItem[];
}
