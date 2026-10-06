import { useRoutes } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import App from './App'
import HomePage from './HomePage'
import ActiveWalkPage from '../features/tracking/ActiveWalkPage'
import HistoryPage from '../features/history/HistoryPage'
import WalkDetailPage from '../features/history/WalkDetailPage'
import SettingsPage from '../features/settings/SettingsPage'

const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'walk', element: <ActiveWalkPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'walk/:walkId', element: <WalkDetailPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]

export default function AppRouter() {
  return useRoutes(routes)
}
