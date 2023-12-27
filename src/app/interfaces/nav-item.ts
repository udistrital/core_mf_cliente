export interface NavItem {
    Id?: string;
    disabled?: boolean;
    Nombre: string;
    Icono?: string;
    Url?: string;
    TipoOpcion?: string;
    Opciones?: NavItem[];
}
