import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { Layout } from './components/Layout'
import './index.css'
import { Experience } from './pages/Experience'
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'
import { Projects } from './pages/Projects'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/experience', element: <Experience /> },
      { path: '/projects', element: <Projects /> },
      { path: '/projects/:slug', lazy: async () => ({ Component: (await import('./pages/ProjectDetail')).ProjectDetail }) },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: '/admin/*',
    lazy: async () => ({ Component: (await import('./admin/AdminApp')).AdminApp }),
  },
])

if (import.meta.hot) {
  import.meta.hot.on('portfolio:content-changed', () => {
    if (!location.pathname.startsWith('/admin')) location.reload()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
