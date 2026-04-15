import React, { Suspense } from "react"
import { Container } from "react-bootstrap";

// code splitting and lazy loading
const Topbar = React.lazy( () => import( './Topbar' ) );
const LeftSidebar = React.lazy( () => import( './LeftSidebar' ) );
const Footer = React.lazy( () => import( './Footer' ) );

const loading = () => <div className=""></div>;

interface VerticalLayoutProps {
     children: React.ReactNode;
}

const VerticalLayout: React.FC<VerticalLayoutProps> = ( { children } ) => {

     const [ isLeftMenuOpen, setIsLeftMenuOpen ] = React.useState( false );

     const openLeftMenu = () => {
          setIsLeftMenuOpen( !isLeftMenuOpen );

          if ( document.body ) {
               if ( isLeftMenuOpen ) {
                    document.body.classList.remove( 'sidebar-enable' );
               } else {
                    document.body.classList.add( 'sidebar-enable' );
               }
          }
     }

     return (
          <>
               <div id="wrapper">
                    <Suspense fallback={ loading() }>
                         <Topbar openLeftMenuCallBack={ openLeftMenu } hideLogo={ false } />
                    </Suspense>
                    <Suspense fallback={ loading() }>
                         <LeftSidebar isCondensed={ false } />
                    </Suspense>
                    <div className="content-page">
                         <div className="content mt-2">
                              <Container fluid>
                                   <Suspense fallback={ loading() }>{ children }</Suspense>
                              </Container>
                         </div>

                         <Suspense fallback={ loading() }>
                              <Footer />
                         </Suspense>
                    </div>
               </div>
          </>
     )
}

export default VerticalLayout