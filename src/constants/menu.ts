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
     roles?: string[];
}

const MENU_ITEMS: MenuItemTypes[] = [
     { key: 'navigation', label: 'Navigation', isTitle: true },
     {
          key: 'dashboards',
          label: 'Dashboards',
          isTitle: false,
          icon: 'home',
          url: '/home',
     },
     { key: 'timesheet-management', label: 'Timesheet Management', isTitle: true },
     {
          key: 'projects',
          label: 'Projects',
          isTitle: false,
          icon: 'book',
          url: '/projects',
     },
     {
          key: 'users',
          label: 'Users',
          isTitle: false,
          icon: 'users',
          url: '/users',
     },
     {
          key: 'timesheet',
          label: 'Timesheet',
          isTitle: false,
          icon: 'clock',
          url: '/timesheet',
          roles: [ 'admin', 'user' ],
     },
];

const HORIZONTAL_MENU_ITEMS: MenuItemTypes[] = [

];

const TWO_COl_MENU_ITEMS: MenuItemTypes[] = [

];

export { MENU_ITEMS, TWO_COl_MENU_ITEMS, HORIZONTAL_MENU_ITEMS };
