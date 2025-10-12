import React from 'react'

interface TwoColumnLayoutProps {
     children?: React.ReactNode;
}

const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ( { children } ) => {
     return (
          <div>{ children }</div>
     )
}

export default TwoColumnLayout
