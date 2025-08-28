import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { specialties } from '../data/specialties';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';
import { getAutocompleteSuggestions } from '../services/geminiService';
import Spinner from '../components/Spinner';
import HeartIcon from '../components/icons/HeartIcon';
import LungsIcon from '../components/icons/LungsIcon';
import VirusIcon from '../components/icons/VirusIcon';
import StethoscopeIcon from '../components/icons/StethoscopeIcon';
import UserCircleIcon from '../components/icons/UserCircleIcon';
import BoltIcon from '../components/icons/BoltIcon';
import BookOpenIcon from '../components/icons/BookOpenIcon';
import FolderIcon from '../components/icons/FolderIcon';
import SearchIcon from '../components/icons/SearchIcon';
import DocumentTextIcon from '../components/icons/DocumentTextIcon';
import ClockIcon from '../components/icons/ClockIcon';
import { getSavedPrescriptions } from '../services/storageService';
import type { SavedPrescription } from '../types';

const specialtyIcons: { [key: string]: React.FC<{className?: string}> } = {
    "Cardiologia": HeartIcon,
    "Pneumologia": LungsIcon,
    "Infectologia": VirusIcon,
    "Psiquiatria": UserCircleIcon,
    "Urgência e Emergência": BoltIcon,
    "Clínica Médica": BookOpenIcon,
};

const DashboardScreen: React.FC = () => {
    const [query, setQuery] = useState('');
    const [showSpecialties, setShowSpecialties] = useState(true);
    const navigate = useNavigate();

    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    
    const [recentPrescriptions, setRecentPrescriptions] = useState<SavedPrescription[]>([]);
    const [loadingRecents, setLoadingRecents] = useState(true);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setShowSuggestions(false);
            navigate(`/search-results/${encodeURIComponent(query.trim())}`);
        }
    };
    
    const handleExampleClick = (diagnosis: string) => {
        navigate(`/search-results/${encodeURIComponent(diagnosis)}`);
    }

    const handleSuggestionClick = (diagnosis: string) => {
        setQuery(diagnosis);
        setShowSuggestions(false);
        navigate(`/search-results/${encodeURIComponent(diagnosis)}`);
    }
    
    const handleLoadPrescription = (prescription: SavedPrescription) => {
        navigate(`/prescription/${encodeURIComponent(prescription.diagnosis)}`, {
            state: { savedData: prescription }
        });
    };

    useEffect(() => {
        const fetchRecents = async () => {
            setLoadingRecents(true);
            try {
                const allPrescriptions = await getSavedPrescriptions();
                setRecentPrescriptions(allPrescriptions.slice(0, 3));
            } catch (error) {
                console.error("Falha ao carregar prescrições recentes:", error);
            } finally {
                setLoadingRecents(false);
            }
        };

        fetchRecents();
    }, []);
    
    useEffect(() => {
        if (query.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const fetchSuggestions = async () => {
            setLoadingSuggestions(true);
            const results = await getAutocompleteSuggestions(query);
            setSuggestions(results);
            setLoadingSuggestions(false);
            setShowSuggestions(true);
        };

        const debounceTimer = setTimeout(() => {
            fetchSuggestions();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [query]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [searchContainerRef]);

    return (
        <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
            <div className="text-center my-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white">Pesquisa Clínica e Modelos</h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Obtenha resumos e referências sobre condições clínicas.</p>
            </div>

            <div ref={searchContainerRef} className="relative mb-12">
                <form onSubmit={handleSearch}>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => query.length >= 3 && setShowSuggestions(true)}
                        placeholder="Pesquisar condição ou diagnóstico (ex: Sepse, IAM)..."
                        className="w-full p-4 pl-12 text-lg bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:border-sky-500 transition-shadow"
                        autoComplete="off"
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <SearchIcon className="h-6 w-6" />
                    </div>
                </form>

                {showSuggestions && (
                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {loadingSuggestions ? (
                            <div className="p-4"><Spinner /></div>
                        ) : suggestions.length > 0 ? (
                            <ul>
                                {suggestions.map((suggestion, index) => (
                                    <li key={index}>
                                        <button
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            className="w-full text-left px-4 py-3 hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors"
                                            aria-label={`Selecionar ${suggestion}`}
                                        >
                                            {suggestion}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <div className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                Nenhuma sugestão encontrada.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 text-center border-t-4 border-sky-500">
                    <FolderIcon className="w-12 h-12 mx-auto text-sky-500"/>
                    <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300 mt-4">
                        Minhas Prescrições
                    </h2>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                        Acesse seus modelos de prescrição salvos.
                    </p>
                    <Link 
                        to="/my-prescriptions"
                        className="mt-6 inline-block px-6 py-3 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 transition-all transform hover:scale-105"
                    >
                        Acessar meus modelos
                    </Link>
                </div>
                 <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 text-center border-t-4 border-emerald-500">
                    <DocumentTextIcon className="w-12 h-12 mx-auto text-emerald-500"/>
                    <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300 mt-4">
                        Criar do Zero
                    </h2>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                        Comece uma nova prescrição sem um modelo.
                    </p>
                    <Link 
                        to="/prescription/new"
                        className="mt-6 inline-block px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all transform hover:scale-105"
                    >
                        Criar Prescrição em Branco
                    </Link>
                </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
                <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300 mb-6 flex items-center gap-3">
                    <ClockIcon className="w-7 h-7 text-sky-500" />
                    Acesso Rápido
                </h2>
                {loadingRecents ? (
                    <Spinner />
                ) : recentPrescriptions.length > 0 ? (
                    <div className="space-y-3">
                        {recentPrescriptions.map(p => (
                            <button
                                key={p.id}
                                onClick={() => handleLoadPrescription(p)}
                                className="w-full text-left bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 hover:shadow-lg hover:ring-2 hover:ring-sky-500 transition-all flex justify-between items-center"
                            >
                                <div>
                                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">{p.customName}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Diagnóstico: {p.diagnosis}
                                    </p>
                                </div>
                                <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 ml-4">
                                    Salvo em: {new Date(p.savedAt).toLocaleDateString('pt-BR')}
                                </span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 px-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700">
                        <p className="text-slate-600 dark:text-slate-400">
                           Nenhum modelo salvo recentemente.
                        </p>
                    </div>
                )}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-8 mt-12">
                <button
                    onClick={() => setShowSpecialties(prev => !prev)}
                    className="w-full flex justify-between items-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    aria-expanded={showSpecialties}
                    aria-controls="specialties-list"
                >
                    <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300">
                        Exemplos por Especialidade
                    </h2>
                    <ChevronDownIcon className={`w-6 h-6 text-slate-500 transition-transform transform ${showSpecialties ? 'rotate-180' : ''}`} />
                </button>
                {showSpecialties && (
                    <div id="specialties-list" className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {specialties.map((specialty) => {
                            const Icon = specialtyIcons[specialty.name] || StethoscopeIcon;
                            return (
                                <div key={specialty.name} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5">
                                    <div className="flex items-center mb-4">
                                        <Icon className="w-8 h-8 text-sky-500" />
                                        <h3 className="ml-3 text-xl font-bold text-slate-800 dark:text-slate-200">
                                            {specialty.name}
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        {specialty.diagnoses.map((diag) => (
                                            <button
                                                key={diag}
                                                onClick={() => handleExampleClick(diag)}
                                                className="w-full text-left p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md hover:bg-sky-100 dark:hover:bg-slate-700 transition-colors duration-200"
                                            >
                                                <h4 className="font-medium text-slate-700 dark:text-slate-300">{diag}</h4>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardScreen;