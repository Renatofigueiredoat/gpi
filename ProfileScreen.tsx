import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import Spinner from '../components/Spinner';
import type { DoctorInfo } from '../types';

const ProfileScreen: React.FC = () => {
    const { currentUser, setCurrentUser, loading: authLoading } = useAuth();
    const [doctorInfo, setDoctorInfo] = useState<Partial<DoctorInfo>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (currentUser) {
            setDoctorInfo(currentUser.doctorInfo);
        }
    }, [currentUser]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDoctorInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !setCurrentUser) {
            setError("Usuário não autenticado.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Simula uma pequena espera, como se estivesse salvando em um servidor
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Atualiza o estado do usuário no AuthContext
            setCurrentUser(prevUser => {
                if (!prevUser) return null;
                return {
                    ...prevUser,
                    doctorInfo: {
                        ...prevUser.doctorInfo,
                        ...doctorInfo
                    }
                };
            });
            
            setSuccess("Perfil atualizado com sucesso!");
        } catch (err) {
            setError("Falha ao atualizar o perfil. Tente novamente.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return <div className="p-8"><Spinner size="lg" /></div>;
    }

    if (!currentUser) {
        return <div className="p-8 text-center">Não foi possível carregar os dados do usuário.</div>;
    }

    return (
        <div className="container mx-auto max-w-2xl p-4 sm:p-6 lg:p-8 animate-fadeIn">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white text-center mb-8">
                Meu Perfil Profissional
            </h1>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            E-mail (não pode ser alterado)
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={currentUser.email}
                            readOnly
                            className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 rounded-md shadow-sm cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Nome Completo
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={doctorInfo.name || ''}
                            onChange={handleInputChange}
                            placeholder="Ex: Dr. João da Silva"
                            required
                            className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="crm" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            CRM
                        </label>
                        <input
                            id="crm"
                            name="crm"
                            type="text"
                            value={doctorInfo.crm || ''}
                            onChange={handleInputChange}
                            placeholder="Ex: CRM/SP 123456"
                            required
                            className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                        />
                    </div>

                    {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}
                    {success && <p className="text-sm text-green-600 dark:text-green-400 text-center">{success}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-slate-800 disabled:bg-slate-400"
                        >
                            {loading ? <Spinner size="sm" color="border-white" containerClassName="p-0" /> : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileScreen;