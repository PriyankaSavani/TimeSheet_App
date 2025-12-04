import React from 'react';
import { useSelector } from 'react-redux';
import { selectAuthState } from '../redux/auth/selectors';
import AdminReports from '../pages/Admin/Reports';
import UserReports from '../pages/User/Reports';

const ReportsWrapper: React.FC = () => {
     const { user } = useSelector( selectAuthState );

     if ( user?.role === 'admin' ) {
          return <AdminReports />;
     } else if ( user?.role === 'user' ) {
          return <UserReports />;
     }

     // Default fallback
     return <AdminReports />;
};

export default ReportsWrapper;
