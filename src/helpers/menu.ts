import { MENU_ITEMS, HORIZONTAL_MENU_ITEMS, TWO_COl_MENU_ITEMS, MenuItemTypes } from '../constants/menu';
import { store } from '../redux/store';

const getMenuItems = () => {
     // NOTE - You can fetch from server and return here as well
     const state = store.getState();
     const user = state.Auth.user;
     if ( user && user.role === 'user' ) {
          // For 'user' role, show only allowed menus (currently timesheet, but can be extended)
          const allowedKeys = [ 'timesheet-management', 'timesheet' ]; // Add more keys here for user permissions
          const filteredItems = MENU_ITEMS.filter( item => item.isTitle || allowedKeys.includes( item.key ) );
          // Remove titles that have no items under them
          return filteredItems.filter( ( item, index, arr ) => {
               if ( item.isTitle ) {
                    // Check if next item exists and is not a title (i.e., has content under this title)
                    const nextItem = arr[ index + 1 ];
                    return nextItem && !nextItem.isTitle;
               }
               return true;
          } );
     }
     // For 'admin' or others, show all menus
     return MENU_ITEMS;
};

const getHorizontalMenuItems = () => {
     // NOTE - You can fetch from server and return here as well
     return HORIZONTAL_MENU_ITEMS;
};

const getTwoColumnMenuItems = () => {
     // NOTE - You can fetch from server and return here as well
     return TWO_COl_MENU_ITEMS;
};

const findAllParent = ( menuItems: MenuItemTypes[], menuItem: MenuItemTypes ): string[] => {
     let parents: string[] = [];
     const parent = findMenuItem( menuItems, menuItem[ 'parentKey' ] );

     if ( parent ) {
          parents.push( parent[ 'key' ] );
          if ( parent[ 'parentKey' ] ) parents = [ ...parents, ...findAllParent( menuItems, parent ) ];
     }

     return parents;
};

const findMenuItem = (
     menuItems: MenuItemTypes[] | undefined,
     menuItemKey: MenuItemTypes[ 'key' ] | undefined
): MenuItemTypes | null => {
     if ( menuItems && menuItemKey ) {
          for ( var i = 0; i < menuItems.length; i++ ) {
               if ( menuItems[ i ].key === menuItemKey ) {
                    return menuItems[ i ];
               }
               var found = findMenuItem( menuItems[ i ].children, menuItemKey );
               if ( found ) return found;
          }
     }
     return null;
};

export { getMenuItems, getHorizontalMenuItems, getTwoColumnMenuItems, findAllParent, findMenuItem };
