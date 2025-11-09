import React from 'react'
import { Button } from 'react-bootstrap'

interface User {
     id: string;
     fullname: string;
     email: string;
     role: string;
}

interface UsersEditActionProps {
     updateUser: ( id: string, user: { fullname: string; email: string; role: string } ) => void;
     user: User;
}

const UsersEditAction: React.FC<UsersEditActionProps> = ( { updateUser, user } ) => {
     const handleToggleRole = () => {
          updateUser( user.id, { ...user, role: user.role === 'admin' ? 'user' : 'admin' } );
     };

     return (
          <React.Fragment>
               <Button
                    variant="success"
                    size="sm"
                    className="me-1"
                    onClick={ handleToggleRole }
               >
                    Toggle Role
               </Button>
          </React.Fragment>
     )
}

export default UsersEditAction
