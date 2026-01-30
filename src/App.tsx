import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Room } from './pages/Room'
import { RoomLobby } from './pages/RoomLobby'
import { Diary } from './pages/Diary'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Match } from './pages/Match'
import { History } from './pages/History'
import { Toaster } from './components/ui'
import Settings from './pages/Settings'
import FootprintMap from './pages/FootprintMap'

import { Plaza } from './pages/Plaza'

const router = createBrowserRouter([
  {
    element: <Layout><Outlet /></Layout>,
    children: [
      { path: '/', element: <Home /> },
      { path: '/room', element: <RoomLobby /> },
      { path: '/room/history', element: <History /> },
      { path: '/room/:code', element: <Room /> },
      { path: '/diary', element: <Diary /> },
      { path: '/plaza', element: <Plaza /> },
      { path: '/match', element: <Match /> },
      { path: '/settings', element: <Settings /> },
      { path: '/footprints', element: <FootprintMap /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
    ]
  }
])

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
    </>
  )
}

export default App
