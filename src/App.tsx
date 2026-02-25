import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import { Layout } from './components/Layout'
import { lazy, Suspense } from 'react'
import { Toaster } from './components/ui'
import { AdminLayout } from './components/admin/AdminLayout'
import { AdminGuard } from './components/admin/AdminGuard'

const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })))
const Room = lazy(() => import('./pages/Room').then(module => ({ default: module.Room })))
const RoomLobby = lazy(() => import('./pages/RoomLobby').then(module => ({ default: module.RoomLobby })))
const Diary = lazy(() => import('./pages/Diary').then(module => ({ default: module.Diary })))
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })))
const Register = lazy(() => import('./pages/Register').then(module => ({ default: module.Register })))
const Match = lazy(() => import('./pages/Match').then(module => ({ default: module.Match })))
const History = lazy(() => import('./pages/History').then(module => ({ default: module.History })))
const Timeline = lazy(() => import('./pages/Timeline').then(module => ({ default: module.Timeline })))
const Community = lazy(() => import('./pages/Community').then(module => ({ default: module.Community })))
const Emotion = lazy(() => import('./pages/Emotion').then(module => ({ default: module.Emotion })))
const Messages = lazy(() => import('./pages/Messages').then(module => ({ default: module.Messages })))
const Settings = lazy(() => import('./pages/Settings'))
const About = lazy(() => import('./pages/About').then(module => ({ default: module.About })))
const Privacy = lazy(() => import('./pages/Privacy').then(module => ({ default: module.Privacy })))
const Terms = lazy(() => import('./pages/Terms').then(module => ({ default: module.Terms })))
const Contact = lazy(() => import('./pages/Contact').then(module => ({ default: module.Contact })))
const Plaza = lazy(() => import('./pages/Plaza').then(module => ({ default: module.Plaza })))

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })))
const UserManagement = lazy(() => import('./pages/admin/UserManagement').then(module => ({ default: module.UserManagement })))
const ScenarioAudit = lazy(() => import('./pages/admin/ScenarioAudit').then(module => ({ default: module.ScenarioAudit })))
const PromptManagement = lazy(() => import('./pages/admin/PromptManagement').then(module => ({ default: module.PromptManagement })))
const SuggestionManagement = lazy(() => import('./pages/admin/SuggestionManagement').then(module => ({ default: module.SuggestionManagement })))

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
      { path: '/messages', element: <Messages /> },
      { path: '/plaza', element: <Plaza /> },
      { path: '/match', element: <Match /> },
      { path: '/settings', element: <Settings /> },
      { path: '/about', element: <About /> },
      { path: '/privacy', element: <Privacy /> },
      { path: '/terms', element: <Terms /> },
      { path: '/contact', element: <Contact /> },
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
      { path: 'prompts', element: <PromptManagement /> },
      { path: 'suggestions', element: <SuggestionManagement /> }
    ]
  }
])

function App() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
    </Suspense>
  )
}

export default App
