import Layout from './components/common/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Etablissements from './pages/Etablissements'
import StockEtablissement from './pages/StockEtablissement'
import StockCentral from './pages/StockCentral'
import Utilisateurs from './pages/Utilisateurs'
import DemandesReparation from './pages/DemandesReparation'
import Rapports from './pages/Rapports'
import Historique from './pages/Historique'
import Profile from './pages/Profile'
import Distribution from './pages/Distribution'
import Transfert from './pages/Transfert'
import Reparation from './pages/Reparation'
import AjoutMateriel from './pages/AjoutMateriel'
import SuppressionMateriel from './pages/SuppressionMateriel'
import Visites from './pages/Visites'
import GestionPannes from './pages/GestionPannes'
import GestionAcces from './pages/GestionAcces'

const routes = [
  { path: '/login', element: Login, protected: false },
  { path: '/', element: Dashboard, layout: Layout, protected: true },
  { path: '/dashboard', element: Dashboard, layout: Layout, protected: true },
  { path: '/etablissements', element: Etablissements, layout: Layout, protected: true },
  { path: '/stock-central', element: StockCentral, layout: Layout, protected: true },
  { path: '/stock-etablissement/:id', element: StockEtablissement, layout: Layout, protected: true },
  { path: '/utilisateurs', element: Utilisateurs, layout: Layout, protected: true },
  { path: '/demandes', element: DemandesReparation, layout: Layout, protected: true },
  { path: '/rapports', element: Rapports, layout: Layout, protected: true },
  { path: '/historique', element: Historique, layout: Layout, protected: true },
  { path: '/profile', element: Profile, layout: Layout, protected: true },
  { path: '/distribution', element: Distribution, layout: Layout, protected: true },
  { path: '/transfert', element: Transfert, layout: Layout, protected: true },
  { path: '/reparation', element: Reparation, layout: Layout, protected: true },
  { path: '/ajout-materiel', element: AjoutMateriel, layout: Layout, protected: true },
  { path: '/suppression-materiel', element: SuppressionMateriel, layout: Layout, protected: true },
  { path: '/gestion-pannes', element:GestionPannes, layout: Layout, protected: true},
  { path: '/gestion-acces', element: GestionAcces, layout: Layout, protected: true },

  { path: '/visites', element: Visites, layout: Layout, protected: true }
]

export default routes