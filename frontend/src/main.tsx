import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { AppLayout } from '@/components/AppLayout'
import { PlaceholderPage } from '@/components/PlaceholderPage'
import { GuestOnly, RequireAuth } from '@/features/auth/guards'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { InvitePage } from '@/features/trips/InvitePage'
import { TripDetailPage } from '@/features/trips/TripDetailPage'
import { EditTripPage, NewTripPage } from '@/features/trips/TripFormPages'
import { TripsPage } from '@/features/trips/TripsPage'
import { ItineraryPage } from '@/features/itinerary/ItineraryPage'
import { ExpensesPage } from '@/features/expenses/ExpensesPage'
import { ChecklistPage } from '@/features/checklist/ChecklistPage'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: true, staleTime: 30_000 },
  },
})

const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/cadastro', element: <RegisterPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      { path: '/convite/:token', element: <InvitePage /> },
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <TripsPage /> },
          { path: '/viagens/nova', element: <NewTripPage /> },
          { path: '/viagens/:id', element: <TripDetailPage /> },
          { path: '/viagens/:id/editar', element: <EditTripPage /> },
          { path: '/viagens/:id/roteiro', element: <ItineraryPage /> },
          { path: '/viagens/:id/orcamento', element: <ExpensesPage /> },
          { path: '/viagens/:id/checklist', element: <ChecklistPage /> },
          { path: '/explorar', element: <PlaceholderPage title="Explorar" /> },
          { path: '/perfil', element: <PlaceholderPage title="Perfil" /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
