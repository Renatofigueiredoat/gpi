import React, { useState, useEffect, useRef } from 'react';
import type { Workplace } from '../types';
import { getWorkplaces } from '../services/storageService';
import Spinner from './Spinner';

interface SavePrescriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, workplace?: { id: string, name: string }) => void;
    currentName?: string;
    diagnosis: string;
}

const SavePrescriptionModal: React.FC<SavePrescriptionModalProps> = ({
    isOpen,
    onClose,
    onSave,
    currentName,
    diagnosis,
}) => {
    const [name, setName] = useState('');
    const [selectedWorkplaceId, setSelectedWorkplaceId] = useState('');
    const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
    const [loading, setLoading] = useState(true);
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (isOpen) {
            dialog?.showModal();
        } else {
            dialog?.close();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            // Pre-fill name when modal opens
            setName(currentName || diagnosis);
            
            // Fetch workplaces
            const fetchWorkplaces = async () => {
                setLoading(true);
                const wpData = await getWorkplaces();
                setWorkplaces(wpData);
                setLoading(false);
            };
            fetchWorkplaces();
        }
    }, [isOpen, currentName, diagnosis]);

    const handleSaveClick = () => {
        if (name.trim()) {
            const selectedWp = workplaces.find(wp => wp.id === selectedWorkplaceId);
            onSave(name.trim(), selectedWp);
        } else {
            alert('Por favor, insira um nome para o modelo.');
        }
    };

    return (
        <dialog ref={dialogRef} onClose={onClose} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md backdrop:bg-black/50">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Salvar Modelo de Prescrição</h2>
            
            <div className="space-y-4">
                <div>
                    <label htmlFor="modelName" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Nome do Modelo
                    </label>
                    <input
                        type="text"
                        id="modelName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded-md border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label htmlFor="workplace" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Local de Trabalho (Opcional)
                    </label>
                    {loading ? <Spinner size="sm"/> : (
                        <select
                            id="workplace"
                            value={selectedWorkplaceId}
                            onChange={(e) => setSelectedWorkplaceId(e.target.value)}
                             className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded-md border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                        >
                            <option value="">Nenhum / Geral</option>
                            {workplaces.map(wp => (
                                <option key={wp.id} value={wp.id}>{wp.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSaveClick}
                    className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700"
                >
                    Salvar
                </button>
            </div>
        </dialog>
    );
};

export default SavePrescriptionModal;
