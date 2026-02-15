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
import { Timeline } from './pages/Timeline'
import { Community } from './pages/Community'
import { Emotion } from './pages/Emotion'
import { Toaster } from './components/ui'
import Settings from './pages/Settings'
import FootprintMap from './pages/FootprintMap'

import { Plaza } from './pages/Plaza'
import { AdminLayout } from './components/admin/AdminLayout'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { UserManagement } from './pages/admin/UserManagement'
import { ScenarioAudit } from './pages/admin/ScenarioAudit'
import { AdminGuard } from './components/admin/AdminGuard'
import { PromptManagement } from './pages/admin/PromptManagement'

const router = createBrowserRouter([
  {
    element: <Layout><Outlet /></Layout>,
    children: [
      { path: '/', element: <Home /> },
      { path: '/room', element: <RoomLobby /> },
      { path: '/room/history', element: <History /> },
      { path: '/room/:code', element: <Room /> },
      { path: '/diary', element: <Diary /> },
      { path: '/timeline', element: <Timeline /> },
      { path: '/community', element: <Community /> },
      { path: '/emotion', element: <Emotion /> },
      { path: '/plaza', element: <Plaza /> },
      { path: '/match', element: <Match /> },
      { path: '/settings', element: <Settings /> },
      { path: '/footprints', element: <FootprintMap /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
    ]
  },
  {
    path: '/admin',
    element: <AdminGuard><AdminLayout /></AdminGuard>,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'users', element: <UserManagement /> },
      { path: 'scenarios', element: <ScenarioAudit /> },
      { path: 'prompts', element: <PromptManagement /> }
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
