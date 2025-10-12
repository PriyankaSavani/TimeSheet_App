import React from 'react'

interface HorizontalLayoutProps {
     children?: React.ReactNode;
}

const HorizontalLayout: React.FC<HorizontalLayoutProps> = ( { children } ) => {
     return (
          <div>{ children }</div>
     )
}

export default HorizontalLayout
