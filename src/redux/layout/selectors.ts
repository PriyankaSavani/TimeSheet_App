import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectLayoutState = createSelector(
     ( state: RootState ) => state.Layout,
     ( layout ) => ( {
          layout: layout,
          bsTheme: layout.bsTheme,
     } )
);

export const selectBsTheme = createSelector(
     ( state: RootState ) => state.Layout.bsTheme,
     ( bsTheme ) => bsTheme
);
