// frontend/src/pages/GestionPannes.js

import React, { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import useMaterielStore from '../store/materielStore';
import useEtablissementStore from '../store/etablissementStore';
import { TYPES_MATERIEL } from '../utils/constants';
import toast from 'react-hot-toast';
import { Search, Wrench } from 'lucide-react';

const GestionPannes = () => {
  const { user } = useAuthStore();
  const { materiels, stockEtablissements, etatsMateriel, loadAllData, updateEtatMateriel } = useMaterielStore();
  const { etablissements, loadEtablissements } = useEtablissementStore();

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedEtablissement, setSelectedEtablissement] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [action, setAction] = useState('');
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
      'tablette': '📟',
      'routeur': '🌐',
      'switch': '🔌',
      'serveur': '🖧',
      'projecteur': '📽️'
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

  const getDernierEtat = (id_materiel, id_etab) => {
    const etats = etatsMateriel
      .filter(e => e.id_materiel === id_materiel && e.id_etab === id_etab)
      .sort((a, b) => new Date(b.date_changement) - new Date(a.date_changement));
    return etats[0];
  };

  const pannesList = getStockItems().map(item => {
    const materiel = materiels.find(m => m.id_materiel === item.id_materiel);
    const type = TYPES_MATERIEL.find(t => t.id === materiel?.id_type);
    const etablissement = etablissements.find(e => e.id_etab === item.id_etab);
    const dernierEtat = getDernierEtat(item.id_materiel, item.id_etab);

    const enMarche = dernierEtat?.en_marche ?? 0;
    const enPanne = dernierEtat?.en_panne ?? 0;
    const enReparation = dernierEtat?.en_reparation ?? 0;
    const quantiteTotale = enMarche + enPanne + enReparation;

    return {
      id: item.id_stock_etab,
      id_materiel: item.id_materiel,
      id_etab: item.id_etab,
      reference: materiel?.reference || 'N/A',
      type: type?.displayName || 'Inconnu',
      typeIcon: getTypeIcon(type?.libelle),
      quantite: quantiteTotale,
      enMarche: enMarche,
      enPanne: enPanne,
      enReparation: enReparation,
      date_dernier_changement: dernierEtat?.date_changement,
      commentaire: dernierEtat?.commentaire,
      etablissement: etablissement?.nom || 'Inconnu'
    };
  });

  const pannesListFiltered = pannesList.filter(item => {
    const matchSearch = item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = !filterType || item.type === filterType;
    return matchSearch && matchType;
  });

  // ✅ CORRIGÉ : handleUpdateEtat
  const handleUpdateEtat = async () => {
    if (!selectedItem) return;

    // Vérifier que tous les champs sont présents
    if (!selectedItem.id_materiel || !selectedItem.id_etab) {
      toast.error('Données du matériel incomplètes');
      return;
    }

    if (!action) {
      toast.error('Veuillez sélectionner une action');
      return;
    }

    if (nombre < 1) {
      toast.error('La quantité doit être au moins 1');
      return;
    }

    // Vérifier la disponibilité selon l'action
    let maxDispo = 0;
    switch (action) {
      case 'reparer':
        maxDispo = selectedItem.enPanne;
        break;
      case 'mettre_en_panne':
        maxDispo = selectedItem.enMarche;
        break;
      case 'mettre_en_reparation':
        maxDispo = selectedItem.enPanne;
        break;
      case 'terminer_reparation':
        maxDispo = selectedItem.enReparation;
        break;
      default:
        toast.error('Action non reconnue');
        return;
    }

    if (nombre > maxDispo) {
      toast.error(`Pas assez d'unités disponibles (maximum: ${maxDispo})`);
      return;
    }

    setIsSubmitting(true);
    try {
      // ✅ CORRIGÉ : Appel avec les bons paramètres
      await updateEtatMateriel(
        selectedItem.id_materiel,
        selectedItem.id_etab,
        {
          action: action,
          quantite: nombre,
          commentaire: commentaire || null
        }
      );

      toast.success(`${nombre} unité(s) mise(s) à jour : ${getActionLabel(action)}`);
      setShowModal(false);
      setSelectedItem(null);
      setAction('');
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

  const getActionLabel = (action) => {
    switch (action) {
      case 'reparer': return 'Réparer (panne → marche)';
      case 'mettre_en_panne': return 'Mettre en panne (marche → panne)';
      case 'mettre_en_reparation': return 'Mettre en réparation (panne → réparation)';
      case 'terminer_reparation': return 'Terminer réparation (réparation → marche)';
      default: return action;
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

  const statsPannes = {
    total: pannesList.reduce((sum, item) => sum + item.quantite, 0),
    enMarche: pannesList.reduce((sum, item) => sum + item.enMarche, 0),
    enPanne: pannesList.reduce((sum, item) => sum + item.enPanne, 0),
    enReparation: pannesList.reduce((sum, item) => sum + item.enReparation, 0)
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Gestion des pannes</h1>
        <p className="text-gray-500">Suivi et mise à jour de l'état du matériel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{statsPannes.total}</p>
          <p className="text-sm text-gray-500">Total unités</p>
        </div>
        <div className="bg-green-50 rounded-xl shadow-md p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{statsPannes.enMarche}</p>
          <p className="text-sm text-green-600">En marche</p>
        </div>
        <div className="bg-red-50 rounded-xl shadow-md p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{statsPannes.enPanne}</p>
          <p className="text-sm text-red-600">En panne</p>
        </div>
        <div className="bg-yellow-50 rounded-xl shadow-md p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{statsPannes.enReparation}</p>
          <p className="text-sm text-yellow-600">En réparation</p>
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
            {[...new Set(pannesList.map(item => item.type))].map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
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
                <th className="px-6 py-3 text-center text-xs font-medium text-green-600 uppercase">En marche</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-red-600 uppercase">En panne</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-yellow-600 uppercase">En réparation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernier changement</th>
                {isResponsable && <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pannesListFiltered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.reference}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="flex items-center gap-1">{item.typeIcon} {item.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.etablissement}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-green-600">{item.enMarche}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-red-600">{item.enPanne}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-yellow-600">{item.enReparation}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.date_dernier_changement ? new Date(item.date_dernier_changement).toLocaleDateString() : '-'}
                  </td>
                  {isResponsable && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setAction('');
                          setCommentaire('');
                          setNombre(1);
                          setShowModal(true);
                        }}
                        className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-1 rounded-lg transition flex items-center gap-1 mx-auto"
                      >
                        <Wrench size={16} /> Modifier
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {pannesListFiltered.length === 0 && (
                <tr>
                  <td colSpan={isResponsable ? 8 : 7} className="px-6 py-8 text-center text-gray-500">
                    Aucun matériel trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal modification état */}
      {showModal && selectedItem && isResponsable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Modifier l'état du matériel</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p><strong>Matériel :</strong> {selectedItem.reference}</p>
                <p><strong>Type :</strong> {selectedItem.type}</p>
                <p><strong>Établissement :</strong> {selectedItem.etablissement}</p>
                <p className="mt-2"><strong>Répartition actuelle :</strong></p>
                <p>🟢 En marche : {selectedItem.enMarche}</p>
                <p>🔴 En panne : {selectedItem.enPanne}</p>
                <p>🟡 En réparation : {selectedItem.enReparation}</p>
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
                  Maximum disponible : {
                    action === 'reparer' ? selectedItem.enPanne :
                    action === 'mettre_en_panne' ? selectedItem.enMarche :
                    action === 'mettre_en_reparation' ? selectedItem.enPanne :
                    action === 'terminer_reparation' ? selectedItem.enReparation : 0
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action *</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Sélectionner une action</option>
                  <option value="reparer">🟢 Réparer (panne → marche)</option>
                  <option value="mettre_en_panne">🔴 Mettre en panne (marche → panne)</option>
                  <option value="mettre_en_reparation">🟡 Mettre en réparation (panne → réparation)</option>
                  <option value="terminer_reparation">🟢 Terminer réparation (réparation → marche)</option>
                </select>
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
                  onClick={handleUpdateEtat}
                  disabled={isSubmitting || !action}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedItem(null);
                    setAction('');
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

export default GestionPannes;