import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectLayoutState = createSelector(
     ( state: RootState ) => state.Layout,
     ( layout ) => ( {
          layout: layout,
     } )
);
