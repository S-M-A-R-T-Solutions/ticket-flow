import { useDispatch, useSelector } from "react-redux";
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import * as sessionActions from "./store/session";

import './components/Splash/Splash.css'
import './index.scss'

import { useEffect } from "react";

import LoginSignup from "./components/LoginSignup/LoginSignup";
import SideBar from "./components/Layout/SideBar";
import TopBar from "./components/Layout/TopBar/TopBar";
import Dashboard from "./components/Dashboard/Dashboard";
import Footer from "./components/Splash/Footer";
import Tickets from "./components/Tickets";
import MyWork from "./components/MyWork";
import TicketDetails from "./components/TicketDetails";
import Clients from "./components/Clients/Clients";
import TrackingPage from "./components/TrackingPage/TrackingPage";
import Inventory from "./components/Inventory";

function Layout() {
  const dispatch = useDispatch();
  // const [isLoaded, setIsLoaded] = useState(false);

  const sessionUser = useSelector(state => state.session.user);
  const myTickets = useSelector(state => state.tickets.myTickets);
  const status = useSelector(state => state.status.allStatus);

  useEffect(() => {
    dispatch(sessionActions.restoreUser())
    // .then(() => setIsLoaded(true));
  }, [dispatch]);

  return (
    <div className="app-div-container">
      {
        sessionUser ? (
          <>
            <SideBar />

            <div className="main-panel">
              <header className="main-header">
                <TopBar />
              </header>

              <main className='main-zone'>
                <div className="section-container">
                  <Outlet />
                </div>

                <div className="my-work-panel">
                  <MyWork myTickets={myTickets} status={status} />
                </div>
              </main>

              <Footer />
            </div>
          </>
        ) : (
          <main className='main-zone-login'>
            <Outlet />
          </main>
        )
      }
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <LoginSignup />
      },
      // {
      //   path: '/',
      //   element: <Splash />
      // },
      // {
      //   path: '/login',
      //   element: <LoginSignup />
      // },
      {
        path: '/dashboard',
        element: <Dashboard />
      },
      {
        path: '/tickets',
        element: <Tickets />
      },
      {
        path: '/tickets/:ticketId',
        element: <TicketDetails />
      },
      {
        path: '/clients',
        element: <Clients />
      },
      {
        path: '/track/:ticketHashedId',
        element: <TrackingPage />
      },
      {
        path: '/inventory',
        element: <Inventory />
      }
    ]
  }
])

function App() {

  return <RouterProvider router={router} />
}

export default App;