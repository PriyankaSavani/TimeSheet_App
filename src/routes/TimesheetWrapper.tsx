import React from 'react';
import { useSelector } from 'react-redux';
import { selectAuthState } from '../redux/auth/selectors';
import AdminTimesheet from '../pages/Admin/Timesheet';
import UserTimesheet from '../pages/User/Timesheet';

const TimesheetWrapper: React.FC = () => {
     const { user } = useSelector( selectAuthState );

     if ( user?.role === 'admin' ) {
          return <AdminTimesheet />;
     } else if ( user?.role === 'user' ) {
          return <UserTimesheet />;
     }

     // Default fallback
     return <AdminTimesheet />;
};

export default TimesheetWrapper;
