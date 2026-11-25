import { createBrowserRouter } from 'react-router'
import { Layout } from './components/Layout'
import { Ajustes } from './pages/Ajustes'
import { Comparar } from './pages/Comparar'
import { Dashboard } from './pages/Dashboard'
import { NotFound } from './pages/NotFound'
import { PedidoDetail } from './pages/PedidoDetail'
import { Pedidos } from './pages/Pedidos'
import { ProveedorDetail } from './pages/ProveedorDetail'
import { Proveedores } from './pages/Proveedores'

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'proveedores', element: <Proveedores /> },
      { path: 'proveedores/:id', element: <ProveedorDetail /> },
      { path: 'pedidos', element: <Pedidos /> },
      { path: 'pedidos/:id', element: <PedidoDetail /> },
      { path: 'comparar', element: <Comparar /> },
      { path: 'ajustes', element: <Ajustes /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
