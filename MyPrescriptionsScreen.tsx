import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSavedPrescriptions, deletePrescription, getWorkplaces, addWorkplace, deleteWorkplace } from '../services/storageService';
import type { SavedPrescription, Workplace } from '../types';
import Spinner from '../components/Spinner';
import TrashIcon from '../components/icons/TrashIcon';
import FolderIcon from '../components/icons/FolderIcon';
import PlusIcon from '../components/icons/PlusIcon';

const MyPrescriptionsScreen: React.FC = () => {
    const [prescriptions, setPrescriptions] = useState<SavedPrescription[]>([]);
    const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
    const [loading, setLoading] = useState(true);
    const [newWorkplaceName, setNewWorkplaceName] = useState('');
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [prescriptionsData, workplacesData] = await Promise.all([
            getSavedPrescriptions(),
            getWorkplaces()
        ]);
        setPrescriptions(prescriptionsData);
        setWorkplaces(workplacesData);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddWorkplace = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newWorkplaceName.trim()) {
            try {
                await addWorkplace(newWorkplaceName.trim());
                setNewWorkplaceName('');
                fetchData(); // Refetch all data
            } catch (error) {
                alert(error instanceof Error ? error.message : 'Ocorreu um erro.');
            }
        }
    };

    const handleDeleteWorkplace = async (id: string, name: string) => {
        if (window.confirm(`Tem certeza que deseja apagar o local "${name}"? As prescrições associadas a ele ficarão sem categoria.`)) {
            await deleteWorkplace(id);
            fetchData();
        }
    };
    
    const handleDeletePrescription = async (id: string, name: string) => {
        if (window.confirm(`Tem certeza que deseja apagar o modelo "${name}"?`)) {
            await deletePrescription(id);
            fetchData();
        }
    };

    const handleLoadPrescription = (prescription: SavedPrescription) => {
        navigate(`/prescription/${encodeURIComponent(prescription.diagnosis)}`, {
            state: { savedData: prescription }
        });
    };

    const groupedPrescriptions = useMemo(() => {
        const grouped: { [key: string]: SavedPrescription[] } = { 'geral': [] };
        
        workplaces.forEach(wp => {
            grouped[wp.id] = [];
        });

        prescriptions.forEach(p => {
            if (p.workplaceId && grouped[p.workplaceId]) {
                grouped[p.workplaceId].push(p);
            } else {
                grouped['geral'].push(p);
            }
        });

        return grouped;
    }, [prescriptions, workplaces]);

    if (loading) {
        return <div className="p-8"><Spinner size="lg" /></div>;
    }

    return (
        <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 animate-fadeIn">
            <div className="text-center mb-12">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white flex items-center justify-center gap-3">
                    <FolderIcon className="w-10 h-10 text-sky-500"/>
                    Minhas Prescrições
                </h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Gerencie seus modelos e locais de trabalho.</p>
            </div>

            {/* Workplace Management */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Meus Locais de Trabalho</h2>
                <form onSubmit={handleAddWorkplace} className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newWorkplaceName}
                        onChange={(e) => setNewWorkplaceName(e.target.value)}
                        placeholder="Nome do Hospital ou Clínica"
                        className="flex-grow p-2 bg-slate-100 dark:bg-slate-700 rounded-md border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    />
                    <button type="submit" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 transition-colors">
                        <PlusIcon className="w-5 h-5"/> Adicionar
                    </button>
                </form>
                <div className="flex flex-wrap gap-2">
                    {workplaces.length > 0 ? workplaces.map(wp => (
                        <span key={wp.id} className="flex items-center gap-2 bg-slate-200 dark:bg-slate-700 text-sm font-medium px-3 py-1 rounded-full">
                            {wp.name}
                            <button onClick={() => handleDeleteWorkplace(wp.id, wp.name)} className="text-slate-500 hover:text-red-500 dark:hover:text-red-400">
                                <TrashIcon className="w-4 h-4"/>
                            </button>
                        </span>
                    )) : <p className="text-sm text-slate-500">Nenhum local cadastrado.</p>}
                </div>
            </div>

            {/* Prescriptions List */}
            <div className="space-y-8">
                {workplaces.map(wp => (
                    groupedPrescriptions[wp.id]?.length > 0 && (
                        <section key={wp.id}>
                            <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300 mb-4 pb-2 border-b-2 border-sky-500">{wp.name}</h2>
                            <div className="space-y-3">
                                {groupedPrescriptions[wp.id].map(p => (
                                    <PrescriptionCard key={p.id} prescription={p} onLoad={handleLoadPrescription} onDelete={handleDeletePrescription} />
                                ))}
                            </div>
                        </section>
                    )
                ))}

                {groupedPrescriptions['geral']?.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300 mb-4 pb-2 border-b-2 border-slate-400">Geral</h2>
                         <div className="space-y-3">
                            {groupedPrescriptions['geral'].map(p => (
                                <PrescriptionCard key={p.id} prescription={p} onLoad={handleLoadPrescription} onDelete={handleDeletePrescription} />
                            ))}
                        </div>
                    </section>
                )}

                {prescriptions.length === 0 && (
                     <div className="text-center py-10 px-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700">
                        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Nenhum modelo salvo ainda.</h3>
                        <p className="mt-1 text-slate-500 dark:text-slate-400">
                           Use a busca para criar e salvar seu primeiro modelo de prescrição.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

interface PrescriptionCardProps {
    prescription: SavedPrescription;
    onLoad: (p: SavedPrescription) => void;
    onDelete: (id: string, name: string) => void;
}

const PrescriptionCard: React.FC<PrescriptionCardProps> = ({ prescription, onLoad, onDelete }) => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 flex justify-between items-center">
        <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">{prescription.customName}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
                {prescription.diagnosis} - Salvo em: {new Date(prescription.savedAt).toLocaleDateString('pt-BR')}
            </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
            <button
                onClick={() => onLoad(prescription)}
                className="px-3 py-2 text-sm font-medium text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200 dark:bg-sky-900/50 dark:text-sky-300 dark:hover:bg-sky-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 transition-colors"
            >
                Carregar
            </button>
            <button
                onClick={() => onDelete(prescription.id, prescription.customName)}
                className="p-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-100 dark:text-red-400 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 transition-colors"
                aria-label={`Deletar prescrição ${prescription.customName}`}
            >
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
    </div>
);


export default MyPrescriptionsScreen;
