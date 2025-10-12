export interface MenuItemTypes {
    key: string;
    label: string;
    isTitle?: boolean;
    icon?: string;
    url?: string;
    badge?: {
        variant: string;
        text: string;
    };
    parentKey?: string;
    target?: string;
    children?: MenuItemTypes[];
}

const MENU_ITEMS: MenuItemTypes[] = [
    { key: 'navigation', label: 'Navigation', isTitle: true },
    {
        key: 'dashboards',
        label: 'Dashboards',
        isTitle: false,
        icon: 'airplay',
    },
    { key: 'app', label: 'App', isTitle: true },
    {
        key: 'projects',
        label: 'Projects',
        isTitle: false,
        icon: '',
    },
];

const HORIZONTAL_MENU_ITEMS: MenuItemTypes[] = [

];

const TWO_COl_MENU_ITEMS: MenuItemTypes[] = [

];

export { MENU_ITEMS, TWO_COl_MENU_ITEMS, HORIZONTAL_MENU_ITEMS };
