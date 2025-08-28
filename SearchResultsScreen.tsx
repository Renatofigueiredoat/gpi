
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { performGroundedSearch } from '../services/geminiService';
import type { GroundingSource } from '../types';
import Spinner from '../components/Spinner';
import LinkIcon from '../components/icons/LinkIcon';

const SearchResultsScreen: React.FC = () => {
    const { query } = useParams<{ query: string }>();
    const navigate = useNavigate();
    
    const [summary, setSummary] = useState('');
    const [sources, setSources] = useState<GroundingSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const decodedQuery = query ? decodeURIComponent(query) : '';

    useEffect(() => {
        if (!decodedQuery) {
            setError("Nenhum termo de pesquisa fornecido.");
            setLoading(false);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            setError(null);
            try {
                const results = await performGroundedSearch(decodedQuery);
                setSummary(results.summary);
                setSources(results.sources);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [decodedQuery]);

    return (
        <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 animate-fadeIn">
            <button onClick={() => navigate('/dashboard')} className="mb-6 text-sm text-sky-600 hover:underline dark:text-sky-400">&larr; Voltar para a busca</button>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">Pesquisa: {decodedQuery}</h1>
            </div>

            {loading && (
                <div className="text-center p-8 my-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <Spinner />
                    <p className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">Buscando informações e referências...</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Isso pode levar alguns segundos.</p>
                </div>
            )}

            {error && (
                <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <h2 className="text-xl font-bold text-red-700 dark:text-red-300">Erro na Pesquisa</h2>
                    <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-6 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">
                        Tentar Novamente
                    </button>
                </div>
            )}

            {!loading && !error && (
                <>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Resumo Clínico</h2>
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{summary || "Nenhum resumo pôde ser gerado."}</p>
                    </div>

                    {sources.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Fontes e Referências</h2>
                            <ul className="space-y-3">
                                {sources.map((source, index) => (
                                    <li key={index}>
                                        <a 
                                            href={source.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-start gap-3 text-sky-600 dark:text-sky-400 hover:underline"
                                        >
                                            <LinkIcon className="w-5 h-5 mt-1 flex-shrink-0" />
                                            <span className="truncate">{source.title || new URL(source.uri).hostname}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    <div className="mt-8 flex justify-center">
                        <Link 
                            to={`/prescription/${encodeURIComponent(decodedQuery)}`}
                            className="w-full sm:w-auto flex justify-center items-center py-3 px-6 border border-transparent text-lg font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-slate-800 transition-transform transform hover:scale-105"
                        >
                            Continuar para Gerador de Prescrição
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
};

export default SearchResultsScreen;
