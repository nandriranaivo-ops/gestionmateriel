import React, { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import useMaterielStore from '../store/materielStore';
import useEtablissementStore from '../store/etablissementStore';
import { TYPES_MATERIEL } from '../utils/constants';
import toast from 'react-hot-toast';
import { Search, Wifi, WifiOff, Globe } from 'lucide-react';

const GestionAcces = () => {
  const { user } = useAuthStore();
  const { materiels, stockEtablissements, accessibilites, loadAllData, updateAccessibilite } = useMaterielStore();
  const { etablissements, loadEtablissements } = useEtablissementStore();

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterAccessible, setFilterAccessible] = useState('');
  const [selectedEtablissement, setSelectedEtablissement] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [connecter, setConnecter] = useState(true);
  const [commentaire, setCommentaire] = useState('');
  const [nombre, setNombre] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.role === 'admin_educmad';
  const isResponsable = user?.role === 'responsable_etab';
  const responsableEtabId = user?.id_etab;

  const getTypeIcon = (libelle) => {
    const icons = {
      'ordinateur_portable': '💻',
      'ordinateur_bureau': '🖥️',
      'smartphone': '📱',
      'tablette': '📟'
    };
    return icons[libelle] || '📦';
  };

  useEffect(() => {
    const init = async () => {
      await loadAllData();
      await loadEtablissements();
      setLoading(false);
    };
    init();
  }, []);

  const getStockItems = () => {
    let filtered = [...stockEtablissements];
    if (isResponsable) filtered = filtered.filter(s => s.id_etab === responsableEtabId);
    else if (selectedEtablissement) filtered = filtered.filter(s => s.id_etab === parseInt(selectedEtablissement));
    return filtered;
  };

  const getDerniereAccessibilite = (id_materiel, id_etab) => {
    const acces = accessibilites
      .filter(a => a.id_materiel === id_materiel && a.id_etab === id_etab)
      .sort((a, b) => new Date(b.date_changement) - new Date(a.date_changement));
    return acces[0];
  };

  const typesConnectables = ['ordinateur_portable', 'ordinateur_bureau', 'smartphone', 'tablette'];

  const accesList = getStockItems()
    .filter(item => {
      const materiel = materiels.find(m => m.id_materiel === item.id_materiel);
      const type = TYPES_MATERIEL.find(t => t.id === materiel?.id_type);
      return type && typesConnectables.includes(type.libelle);
    })
    .map(item => {
      const materiel = materiels.find(m => m.id_materiel === item.id_materiel);
      const type = TYPES_MATERIEL.find(t => t.id === materiel?.id_type);
      const etablissement = etablissements.find(e => e.id_etab === item.id_etab);
      const derniereAcces = getDerniereAccessibilite(item.id_materiel, item.id_etab);

      const connecte = derniereAcces?.connecte ?? 0;
      const nonConnecte = derniereAcces?.non_connecte ?? 0;
      const quantiteTotale = connecte + nonConnecte;

      return {
        id: item.id_stock_etab,
        id_materiel: item.id_materiel,
        id_etab: item.id_etab,
        reference: materiel?.reference || 'N/A',
        type: type?.displayName || 'Inconnu',
        typeIcon: getTypeIcon(type?.libelle),
        quantite: quantiteTotale,
        connecte: connecte,
        nonConnecte: nonConnecte,
        date_dernier_changement: derniereAcces?.date_changement,
        commentaire: derniereAcces?.commentaire,
        etablissement: etablissement?.nom || 'Inconnu'
      };
    });

  const accesListFiltered = accesList.filter(item => {
    const matchSearch = item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = !filterType || item.type === filterType;
    const matchAccessible = filterAccessible === '' ||
      (filterAccessible === 'accessible' && item.connecte > 0) ||
      (filterAccessible === 'non_accessible' && item.nonConnecte > 0);
    return matchSearch && matchType && matchAccessible;
  });

  const handleUpdateAccessibilite = async () => {
    if (!selectedItem) return;

    // Vérifier que tous les champs sont présents
    if (!selectedItem.id_materiel || !selectedItem.id_etab) {
      toast.error('Données du matériel incomplètes');
      return;
    }

    // Vérifier la quantité
    if (nombre < 1 || nombre > selectedItem.quantite) {
      toast.error(`La quantité doit être comprise entre 1 et ${selectedItem.quantite}`);
      return;
    }

    // Vérifier la disponibilité
    if (connecter === true && selectedItem.nonConnecte < nombre) {
      toast.error(`Pas assez d'unités non connectées (disponible: ${selectedItem.nonConnecte})`);
      return;
    }
    if (connecter === false && selectedItem.connecte < nombre) {
      toast.error(`Pas assez d'unités connectées (disponible: ${selectedItem.connecte})`);
      return;
    }

    setIsSubmitting(true);
    try {
      // ✅ CORRIGÉ : Appel avec les bons paramètres
      await updateAccessibilite(
        selectedItem.id_materiel,
        selectedItem.id_etab,
        {
          connecter: connecter,  // true = connecter, false = déconnecter
          quantite: nombre,
          commentaire: commentaire || null
        }
      );

      toast.success(`${nombre} unité(s) mise(s) à jour : ${connecter ? '✅ Connecté' : '❌ Non connecté'}`);
      setShowModal(false);
      setSelectedItem(null);
      setConnecter(true);
      setCommentaire('');
      setNombre(1);

      // Recharger les données
      await loadAllData();
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  const statsAcces = {
    total: accesList.reduce((sum, item) => sum + item.quantite, 0),
    accessible: accesList.reduce((sum, item) => sum + item.connecte, 0),
    nonAccessible: accesList.reduce((sum, item) => sum + item.nonConnecte, 0),
    tauxAccessibilite: accesList.reduce((sum, item) => sum + item.quantite, 0) > 0
      ? (accesList.reduce((sum, item) => sum + item.connecte, 0) / accesList.reduce((sum, item) => sum + item.quantite, 0)) * 100
      : 0
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Gestion AccesMad</h1>
        <p className="text-gray-500">Gestion de l'accessibilité internet du matériel connectable</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{statsAcces.total}</p>
          <p className="text-sm text-gray-500">Unités connectables</p>
        </div>
        <div className="bg-green-50 rounded-xl shadow-md p-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <Wifi size={20} className="text-green-600" />
            <p className="text-2xl font-bold text-green-600">{statsAcces.accessible}</p>
          </div>
          <p className="text-sm text-green-600">Connectés</p>
        </div>
        <div className="bg-red-50 rounded-xl shadow-md p-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <WifiOff size={20} className="text-red-600" />
            <p className="text-2xl font-bold text-red-600">{statsAcces.nonAccessible}</p>
          </div>
          <p className="text-sm text-red-600">Non connectés</p>
        </div>
        <div className="bg-blue-50 rounded-xl shadow-md p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{statsAcces.tauxAccessibilite.toFixed(1)}%</p>
          <p className="text-sm text-blue-600">Taux d'accessibilité</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par référence ou type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tous les types</option>
            {[...new Set(accesList.map(item => item.type))].map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            value={filterAccessible}
            onChange={(e) => setFilterAccessible(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tous</option>
            <option value="accessible">Connectés</option>
            <option value="non_accessible">Non connectés</option>
          </select>
          {isAdmin && (
            <select
              value={selectedEtablissement}
              onChange={(e) => setSelectedEtablissement(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tous les établissements</option>
              {etablissements.filter(e => e.actif).map(etab => (
                <option key={etab.id_etab} value={etab.id_etab}>{etab.nom}</option>
              ))}
            </select>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Établissement</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-green-600 uppercase">Connectés</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-red-600 uppercase">Non connectés</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernier changement</th>
                {isResponsable && <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accesListFiltered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.reference}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="flex items-center gap-1">{item.typeIcon} {item.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.etablissement}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600 font-semibold">{item.connecte}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-red-600 font-semibold">{item.nonConnecte}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.date_dernier_changement ? new Date(item.date_dernier_changement).toLocaleDateString() : '-'}
                  </td>
                  {isResponsable && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setConnecter(true);
                          setCommentaire('');
                          setNombre(1);
                          setShowModal(true);
                        }}
                        className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-1 rounded-lg transition flex items-center gap-1 mx-auto"
                      >
                        <Globe size={16} /> Modifier
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {accesListFiltered.length === 0 && (
                <tr>
                  <td colSpan={isResponsable ? 7 : 6} className="px-6 py-8 text-center text-gray-500">
                    Aucun matériel connectable trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal modification accessibilité */}
      // frontend/src/pages/GestionAcces.js - Modal

      {showModal && selectedItem && isResponsable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Modifier l'accessibilité AccesMad</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p><strong>Matériel :</strong> {selectedItem.reference}</p>
                <p><strong>Type :</strong> {selectedItem.type}</p>
                <p><strong>Établissement :</strong> {selectedItem.etablissement}</p>
                <p className="mt-2"><strong>Répartition actuelle :</strong></p>
                <p>✅ Connectés : {selectedItem.connecte}</p>
                <p>❌ Non connectés : {selectedItem.nonConnecte}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={connecter === true}
                      onChange={() => setConnecter(true)}
                    />
                    <span><Wifi size={16} className="text-green-600" /> Connecter</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={connecter === false}
                      onChange={() => setConnecter(false)}
                    />
                    <span><WifiOff size={16} className="text-red-600" /> Déconnecter</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre d'unités *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedItem.quantite}
                  value={nombre}
                  onChange={(e) => setNombre(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum disponible : {connecter ? selectedItem.nonConnecte : selectedItem.connecte}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Optionnel : raison du changement..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdateAccessibilite}
                  disabled={isSubmitting}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedItem(null);
                    setConnecter(true);
                    setCommentaire('');
                    setNombre(1);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionAcces;