import React from 'react'

interface DetachedLayoutProps {
     children?: React.ReactNode;
}

const DetachedLayout: React.FC<DetachedLayoutProps> = ( { children } ) => {
     return (
          <div>{ children }</div>
     )
}

export default DetachedLayout
