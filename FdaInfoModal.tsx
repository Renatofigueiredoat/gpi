import React, { useState, useEffect, useRef } from 'react';
import { getDrugInfoInPortuguese } from '../services/geminiService';
import type { FdaDrugInfo } from '../types';
import Spinner from './Spinner';

interface FdaInfoModalProps {
    drugName: string;
    isOpen: boolean;
    onClose: () => void;
}

const FdaInfoModal: React.FC<FdaInfoModalProps> = ({ drugName, isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<FdaDrugInfo | null>(null);
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
        if (isOpen && drugName) {
            const fetchInfo = async () => {
                setLoading(true);
                setError(null);
                setData(null);
                try {
                    const info = await getDrugInfoInPortuguese(drugName);
                    setData(info);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
                } finally {
                    setLoading(false);
                }
            };
            fetchInfo();
        }
    }, [isOpen, drugName]);

    const renderContent = () => {
        if (loading) {
            return <Spinner />;
        }
        if (error) {
            return <p className="text-red-500 text-center">{error}</p>;
        }
        if (!data) {
            return <p className="text-slate-500 text-center">Nenhuma informação encontrada para "{drugName}".</p>;
        }

        const renderSection = (title: string, content?: string[]) => {
            if (!content || content.length === 0) return null;
            return (
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">{title}</h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
                        {content.map((item, index) => <p key={index}>{item}</p>)}
                    </div>
                </div>
            );
        };
        
        return (
            <div className="space-y-4">
                {renderSection('Indicações e Uso', data.indications_and_usage)}
                {renderSection('Avisos e Precauções', data.warnings)}
                {renderSection('Dosagem e Administração', data.dosage_and_administration)}
            </div>
        );
    };

    return (
        <dialog ref={dialogRef} onClose={onClose} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-2xl backdrop:bg-black/50">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-sky-600 dark:text-sky-400">
                    Informações Farmacológicas: <span className="text-slate-800 dark:text-white">{data?.generic_name || drugName}</span>
                </h2>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">&times;</button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto pr-2">
                {renderContent()}
            </div>
        </dialog>
    );
};

export default FdaInfoModal;