

import React, { useState, useMemo } from 'react';
import { calculateClinicalScore } from '../services/geminiService';
import type { ClinicalCalculationResult } from '../types';
import Spinner from '../components/Spinner';
import CalculatorIcon from '../components/icons/CalculatorIcon';
import HeartIcon from '../components/icons/HeartIcon';
import LungsIcon from '../components/icons/LungsIcon';
import StethoscopeIcon from '../components/icons/StethoscopeIcon';
import UserCircleIcon from '../components/icons/UserCircleIcon';
import BabyIcon from '../components/icons/BabyIcon';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';

const calculators = {
    'Cardiologia': {
        icon: HeartIcon,
        items: {
            'chads-vasc': {
                name: 'Escore CHA₂DS₂-VASc',
                fields: [
                    { id: 'chf', label: 'Insuficiência Cardíaca Congestiva', type: 'checkbox' },
                    { id: 'hypertension', label: 'Hipertensão', type: 'checkbox' },
                    { id: 'age75', label: 'Idade ≥ 75 anos', type: 'checkbox' },
                    { id: 'diabetes', label: 'Diabetes Mellitus', type: 'checkbox' },
                    { id: 'stroke', label: 'AVC/AIT/TE prévio', type: 'checkbox' },
                    { id: 'vascular_disease', label: 'Doença Vascular (IAM prévio, etc.)', type: 'checkbox' },
                    { id: 'age65_74', label: 'Idade 65-74 anos', type: 'checkbox' },
                    { id: 'female', label: 'Sexo Feminino', type: 'checkbox' },
                ]
            },
            'has-bled': {
                name: 'Escore HAS-BLED (Risco de Sangramento)',
                fields: [
                    { id: 'hypertension', label: 'Hipertensão não controlada (PAS > 160 mmHg)', type: 'checkbox' },
                    { id: 'renal_disease', label: 'Função renal anormal (diálise, transplante, Cr > 2.26 mg/dL)', type: 'checkbox' },
                    { id: 'liver_disease', label: 'Função hepática anormal (cirrose, bilirrubina > 2x, etc.)', type: 'checkbox' },
                    { id: 'stroke', label: 'História de AVC', type: 'checkbox' },
                    { id: 'bleeding', label: 'História de sangramento ou predisposição', type: 'checkbox' },
                    { id: 'labile_inr', label: 'INR lábil (tempo em alvo terapêutico < 60%)', type: 'checkbox' },
                    { id: 'age65_plus', label: 'Idade > 65 anos', type: 'checkbox' },
                    { id: 'drugs', label: 'Uso de AINEs ou antiplaquetários', type: 'checkbox' },
                    { id: 'alcohol', label: 'Álcool > 8 doses/semana', type: 'checkbox' },
                ]
            },
            'heart-score': {
                name: 'Escore HEART (Dor Torácica)',
                fields: [
                    { id: 'history', label: 'História', type: 'select', options: ['Levemente suspeita (0)', 'Moderadamente suspeita (1)', 'Altamente suspeita (2)'] },
                    { id: 'ecg', label: 'ECG', type: 'select', options: ['Normal (0)', 'Alterações não específicas da repolarização (1)', 'Alteração significativa do segmento ST (2)'] },
                    { id: 'age', label: 'Idade', type: 'select', options: ['< 45 anos (0)', '45-64 anos (1)', '≥ 65 anos (2)'] },
                    { id: 'risk_factors', label: 'Fatores de Risco', type: 'select', options: ['Nenhum fator de risco (0)', '1-2 fatores de risco (1)', '≥ 3 fatores de risco (2)'] },
                    { id: 'troponin', label: 'Troponina inicial', type: 'select', options: ['≤ Limite normal (0)', '1-3x o limite normal (1)', '> 3x o limite normal (2)'] },
                ]
            },
        }
    },
    'Nefrologia e Metabologia': {
        icon: StethoscopeIcon,
        items: {
            'anion-gap': {
                name: 'Cálculo do Ânion Gap',
                fields: [
                    { id: 'sodium', label: 'Sódio (Na+)', type: 'number', unit: 'mEq/L' },
                    { id: 'chloride', label: 'Cloreto (Cl-)', type: 'number', unit: 'mEq/L' },
                    { id: 'bicarbonate', label: 'Bicarbonato (HCO3-)', type: 'number', unit: 'mEq/L' },
                ]
            },
            'corrected-calcium': {
                name: 'Cálcio Corrigido pela Albumina',
                fields: [
                    { id: 'calcium', label: 'Cálcio total medido', type: 'number', unit: 'mg/dL' },
                    { id: 'albumin', label: 'Albumina sérica', type: 'number', unit: 'g/dL' },
                ]
            },
            'cockcroft-gault': {
                name: 'Clearance de Creatinina (Cockcroft-Gault)',
                fields: [
                    { id: 'age', label: 'Idade', type: 'number', unit: 'anos' },
                    { id: 'weight', label: 'Peso', type: 'number', unit: 'kg' },
                    { id: 'creatinine', label: 'Creatinina sérica', type: 'number', unit: 'mg/dL' },
                    { id: 'gender', label: 'Sexo', type: 'select', options: ['Masculino', 'Feminino'] },
                ]
            },
            'ckd-epi': {
                name: 'Taxa de Filtração Glomerular (CKD-EPI 2021)',
                fields: [
                    { id: 'creatinine', label: 'Creatinina sérica', type: 'number', unit: 'mg/dL' },
                    { id: 'age', label: 'Idade', type: 'number', unit: 'anos' },
                    { id: 'gender', label: 'Sexo', type: 'select', options: ['Masculino', 'Feminino'] },
                ]
            },
        }
    },
    'Pneumologia e Risco': {
        icon: LungsIcon,
        items: {
            'curb-65': {
                name: 'Escore CURB-65 (Gravidade da Pneumonia)',
                fields: [
                    { id: 'confusion', label: 'Confusão mental', type: 'checkbox' },
                    { id: 'urea', label: 'Ureia > 50 mg/dL (ou BUN > 19 mg/dL)', type: 'checkbox' },
                    { id: 'respiratory_rate', label: 'Frequência respiratória ≥ 30/min', type: 'checkbox' },
                    { id: 'blood_pressure', label: 'Pressão arterial (PAS < 90 mmHg ou PAD ≤ 60 mmHg)', type: 'checkbox' },
                    { id: 'age65', label: 'Idade ≥ 65 anos', type: 'checkbox' },
                ]
            },
            'wells-pe': {
                name: 'Escore de Wells (Risco de TEP)',
                fields: [
                    { id: 'dvt_signs', label: 'Sinais clínicos de TVP (3 pts)', type: 'checkbox' },
                    { id: 'pe_most_likely', label: 'TEP é o diagnóstico #1 ou igualmente provável (3 pts)', type: 'checkbox' },
                    { id: 'heart_rate', label: 'Frequência cardíaca > 100 bpm (1.5 pts)', type: 'checkbox' },
                    { id: 'immobilization', label: 'Imobilização (≥ 3 dias) ou cirurgia nas 4 semanas anteriores (1.5 pts)', type: 'checkbox' },
                    { id: 'previous_dvt_pe', label: 'História de TVP/TEP (1.5 pts)', type: 'checkbox' },
                    { id: 'hemoptysis', label: 'Hemoptise (1 pt)', type: 'checkbox' },
                    { id: 'malignancy', label: 'Malignidade (tratamento nos últimos 6 meses ou paliativo) (1 pt)', type: 'checkbox' },
                ]
            },
             'rcri': {
                name: 'Índice de Risco Cardíaco Revisado (Pré-operatório)',
                fields: [
                    { id: 'high_risk_surgery', label: 'Cirurgia de alto risco (intraperitoneal, intratorácica, vascular suprainguinal)', type: 'checkbox' },
                    { id: 'ischemic_heart_disease', label: 'História de doença cardíaca isquêmica (IAM, angina)', type: 'checkbox' },
                    { id: 'congestive_heart_failure', label: 'História de insuficiência cardíaca congestiva', type: 'checkbox' },
                    { id: 'cerebrovascular_disease', label: 'História de doença cerebrovascular (AVC ou AIT)', type: 'checkbox' },
                    { id: 'insulin_therapy', label: 'Uso de insulina para diabetes', type: 'checkbox' },
                    { id: 'preop_creatinine', label: 'Creatinina pré-operatória > 2.0 mg/dL', type: 'checkbox' },
                ]
            },
        }
    },
    'Hepatologia': {
        icon: StethoscopeIcon,
        items: {
            'child-pugh': {
                name: 'Escore de Child-Pugh (Gravidade da Cirrose)',
                fields: [
                    { id: 'bilirubin', label: 'Bilirrubina total (mg/dL)', type: 'select', options: ['< 2 (1 pt)', '2-3 (2 pts)', '> 3 (3 pts)'] },
                    { id: 'albumin', label: 'Albumina sérica (g/dL)', type: 'select', options: ['> 3.5 (1 pt)', '2.8-3.5 (2 pts)', '< 2.8 (3 pts)'] },
                    { id: 'inr', label: 'INR', type: 'select', options: ['< 1.7 (1 pt)', '1.7-2.3 (2 pts)', '> 2.3 (3 pts)'] },
                    { id: 'ascites', label: 'Ascite', type: 'select', options: ['Ausente (1 pt)', 'Leve (2 pts)', 'Moderada/Grave (3 pts)'] },
                    { id: 'encephalopathy', label: 'Encefalopatia Hepática', type: 'select', options: ['Nenhuma (1 pt)', 'Grau 1-2 (2 pts)', 'Grau 3-4 (3 pts)'] },
                ]
            },
            'meld': {
                name: 'Escore MELD (Doença Hepática)',
                fields: [
                    { id: 'creatinine', label: 'Creatinina sérica', type: 'number', unit: 'mg/dL' },
                    { id: 'bilirubin', label: 'Bilirrubina total', type: 'number', unit: 'mg/dL' },
                    { id: 'inr', label: 'INR', type: 'number', unit: '' },
                    { id: 'dialysis', label: 'Realizou diálise 2x na última semana?', type: 'checkbox' },
                ]
            },
        }
    },
    'Pediatria e Obstetrícia': {
        icon: BabyIcon,
        items: {
            'apgar': {
                name: 'Escore de APGAR (Avaliação do Recém-Nascido)',
                fields: [
                    { id: 'appearance', label: 'Aparência (Cor da pele)', type: 'select', options: ['Cianose central/palidez (0)', 'Acrocianose (1)', 'Rosado (2)'] },
                    { id: 'pulse', label: 'Pulso (Frequência cardíaca)', type: 'select', options: ['Ausente (0)', '< 100 bpm (1)', '> 100 bpm (2)'] },
                    { id: 'grimace', label: 'Gesticulação (Resposta a estímulo)', type: 'select', options: ['Sem resposta (0)', 'Careta/movimento fraco (1)', 'Tosse/espirro/choro (2)'] },
                    { id: 'activity', label: 'Atividade (Tônus muscular)', type: 'select', options: ['Flácido (0)', 'Alguma flexão (1)', 'Movimento ativo (2)'] },
                    { id: 'respiration', label: 'Respiração (Esforço respiratório)', type: 'select', options: ['Ausente (0)', 'Lento/irregular (1)', 'Bom/choro forte (2)'] },
                ]
            },
        }
    },
    'Neurologia e Psiquiatria': {
        icon: UserCircleIcon,
        items: {
            'gcs': {
                name: 'Escala de Coma de Glasgow (GCS)',
                fields: [
                    { id: 'eyes', label: 'Abertura Ocular', type: 'select', options: ['Espontânea (4)', 'Ao som (3)', 'À pressão (2)', 'Nenhuma (1)'] },
                    { id: 'verbal', label: 'Resposta Verbal', type: 'select', options: ['Orientado (5)', 'Confuso (4)', 'Palavras (3)', 'Sons (2)', 'Nenhuma (1)'] },
                    { id: 'motor', label: 'Resposta Motora', type: 'select', options: ['Obedece a comandos (6)', 'Localiza dor (5)', 'Retirada à dor (4)', 'Flexão anormal (3)', 'Extensão anormal (2)', 'Nenhuma (1)'] },
                ]
            },
            'gad-7': {
                name: 'Escore GAD-7 (Ansiedade)',
                fields: [
                    { id: 'nervous', label: 'Sentir-se nervoso(a), ansioso(a) ou no limite', type: 'select', options: ['Nenhuma vez (0)', 'Vários dias (1)', 'Mais da metade dos dias (2)', 'Quase todos os dias (3)'] },
                    { id: 'control_worry', label: 'Não ser capaz de parar ou controlar a preocupação', type: 'select', options: ['Nenhuma vez (0)', 'Vários dias (1)', 'Mais da metade dos dias (2)', 'Quase todos os dias (3)'] },
                    { id: 'worry_different', label: 'Preocupar-se muito com coisas diferentes', type: 'select', options: ['Nenhuma vez (0)', 'Vários dias (1)', 'Mais da metade dos dias (2)', 'Quase todos os dias (3)'] },
                    { id: 'relax', label: 'Dificuldade em relaxar', type: 'select', options: ['Nenhuma vez (0)', 'Vários dias (1)', 'Mais da metade dos dias (2)', 'Quase todos os dias (3)'] },
                    { id: 'restless', label: 'Estar tão inquieto(a) que é difícil ficar parado(a)', type: 'select', options: ['Nenhuma vez (0)', 'Vários dias (1)', 'Mais da metade dos dias (2)', 'Quase todos os dias (3)'] },
                    { id: 'irritable', label: 'Ficar facilmente aborrecido(a) ou irritado(a)', type: 'select', options: ['Nenhuma vez (0)', 'Vários dias (1)', 'Mais da metade dos dias (2)', 'Quase todos os dias (3)'] },
                    { id: 'afraid', label: 'Sentir medo como se algo terrível fosse acontecer', type: 'select', options: ['Nenhuma vez (0)', 'Vários dias (1)', 'Mais da metade dos dias (2)', 'Quase todos os dias (3)'] },
                ]
            },
            'phq-9': {
                name: 'Escore PHQ-9 (Depressão)',
                fields: [
                    { id: 'interest', label: 'Pouco interesse ou prazer em fazer as coisas', type: 'select', options: ['Nenhuma vez (0)', 'Vários dias (1)', 'Mais da metade dos dias (2)', 'Quase todos os dias (3)'] },
                    { id: 'down', label: 'Sentir-se para baixo, deprimido(a) ou sem esperança', type: 'select', options: ['Nenhuma vez (0)', 'Vários dias (1)', 'Mais da metade dos dias (2)', 'Quase todos os dias (3)'] },
                    { id: 'sleep', label: 'Dificuldade em adormecer/permanecer dormindo, ou dormir demais', type: 'select', options: ['Nenhuma vez (0)', 'Vários dias (1)', 'Mais da metade dos dias (2)', 'Quase todos os dias (3)'] },
                    { id: 'tired', label: 'Sentir-se cansado(a) ou com pouca energia', type: 'select', options: ['Nenhuma vez (0)', 'Vários dias (1)', 'Mais da metade dos dias (2)', 'Quase todos os dias (3)'] },
                    { id: 'appetite', label: 'Apetite fraco ou excessivo', type: 'select', options: ['Nenhuma vez (0)', 'Vários dias (1)', 'Mais da metade dos dias (2)', 'Quase todos os dias (3)'] },
                    { id: 'failure', label: 'Sentir-se mal sobre si mesmo(a) - ou que você é um fracasso', type: 'select', options: ['Nenhuma vez (0)', 'Vários dias (1)', 'Mais da metade dos dias (2)', 'Quase todos os dias (3)'] },
                    { id: 'concentration', label: 'Dificuldade em se concentrar nas coisas', type: 'select', options: ['Nenhuma vez (0)', 'Vários dias (1)', 'Mais da metade dos dias (2)', 'Quase todos os dias (3)'] },
                    { id: 'slow_restless', label: 'Mover-se ou falar tão lentamente que outras pessoas notaram. Ou o oposto', type: 'select', options: ['Nenhuma vez (0)', 'Vários dias (1)', 'Mais da metade dos dias (2)', 'Quase todos os dias (3)'] },
                    { id: 'suicide', label: 'Pensamentos de que seria melhor estar morto(a) ou de se ferir', type: 'select', options: ['Nenhuma vez (0)', 'Vários dias (1)', 'Mais da metade dos dias (2)', 'Quase todos os dias (3)'] },
                ]
            },
        }
    }
};

const CalculatorScreen: React.FC = () => {
    const firstCategory = Object.keys(calculators)[0];
    const firstCalc = Object.keys(calculators[firstCategory as keyof typeof calculators].items)[0];
    
    const [selectedCalc, setSelectedCalc] = useState<string>(firstCalc);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(firstCategory);
    
    const [inputs, setInputs] = useState<Record<string, string | boolean>>({});
    const [result, setResult] = useState<ClinicalCalculationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const findCalculator = (key: string) => {
        for (const category of Object.values(calculators)) {
            const found = category.items[key as keyof typeof category.items];
            if (found) {
                return found;
            }
        }
        return null;
    };
    
    const currentCalculator = useMemo(() => findCalculator(selectedCalc), [selectedCalc]);

    const handleCalcSelect = (calcKey: string) => {
        setSelectedCalc(calcKey);
        setInputs({});
        setResult(null);
        setError(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        
        if (isCheckbox) {
             setInputs(prev => ({ ...prev, [id]: (e.target as HTMLInputElement).checked }));
        } else {
             setInputs(prev => ({ ...prev, [id]: value }));
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        if (!currentCalculator) {
            setError("Calculadora não encontrada.");
            setLoading(false);
            return;
        }
        
        const promptInputs: Record<string, string> = {};
        for(const field of currentCalculator.fields) {
            const value = inputs[field.id];
            if(field.type === 'checkbox') {
                promptInputs[field.label] = value ? "Sim" : "Não";
            } else if (value !== undefined) {
                 promptInputs[field.label] = String(value);
            }
        }

        try {
            const calcResult = await calculateClinicalScore(currentCalculator.name, promptInputs);
            setResult(calcResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="container mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 animate-fadeIn">
            <div className="text-center mb-12">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white flex items-center justify-center gap-3">
                    <CalculatorIcon className="w-10 h-10 text-sky-500"/>
                    Calculadoras Clínicas
                </h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Ferramentas de apoio à decisão para agilizar sua prática.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Coluna da Esquerda: Navegação por Categoria */}
                <aside className="md:col-span-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 h-fit sticky top-20">
                     <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2 px-2">Categorias</h2>
                     <nav>
                         <div className="space-y-2">
                            {Object.entries(calculators).map(([categoryName, categoryData]) => {
                                const Icon = categoryData.icon;
                                const isExpanded = expandedCategory === categoryName;
                                return (
                                    <div key={categoryName}>
                                        <button
                                            onClick={() => setExpandedCategory(isExpanded ? null : categoryName)}
                                            className="w-full flex justify-between items-center p-3 rounded-lg text-md font-bold transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                                            aria-expanded={isExpanded}
                                            aria-controls={`category-${categoryName}`}
                                        >
                                            <span className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                                                <Icon className="w-6 h-6 text-sky-500" />
                                                {categoryName}
                                            </span>
                                            <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isExpanded && (
                                            <ul id={`category-${categoryName}`} className="space-y-1 mt-1 pl-4 border-l-2 border-slate-200 dark:border-slate-700 ml-4">
                                                {Object.entries(categoryData.items).map(([key, { name }]) => (
                                                    <li key={key}>
                                                        <button
                                                            onClick={() => handleCalcSelect(key)}
                                                            className={`w-full text-left p-2.5 rounded-md text-sm font-medium transition-colors ${
                                                                selectedCalc === key
                                                                    ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300'
                                                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                            }`}
                                                        >
                                                            {name}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })}
                         </div>
                     </nav>
                </aside>

                {/* Coluna da Direita: Formulário e Resultado */}
                <div className="md:col-span-2">
                    {currentCalculator ? (
                        <>
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{currentCalculator.name}</h2>
                                    
                                    <div className="space-y-4">
                                        {currentCalculator.fields.map(field => (
                                            <div key={field.id}>
                                                {field.type === 'checkbox' ? (
                                                    <div className="flex items-center">
                                                        <input id={field.id} type="checkbox" checked={!!inputs[field.id]} onChange={handleInputChange} className="h-5 w-5 rounded border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer" />
                                                        <label htmlFor={field.id} className="ml-3 block text-sm text-slate-700 dark:text-slate-300 cursor-pointer">{field.label}</label>
                                                    </div>
                                                ) : field.type === 'select' ? (
                                                    <>
                                                        <label htmlFor={field.id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">{field.label}</label>
                                                        <select id={field.id} value={String(inputs[field.id] || '')} onChange={handleInputChange} required className="mt-1 block w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md">
                                                            <option value="" disabled>Selecione...</option>
                                                            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                        </select>
                                                    </>
                                                ) : (
                                                    <>
                                                        <label htmlFor={field.id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">{field.label}</label>
                                                        <div className="mt-1 relative rounded-md shadow-sm">
                                                            <input type={field.type} id={field.id} value={String(inputs[field.id] || '')} onChange={handleInputChange} required className="w-full p-2 bg-slate-50 dark:bg-slate-700 rounded-md border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-sky-500 focus:outline-none"/>
                                                            {field.unit && <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><span className="text-gray-500 sm:text-sm">{field.unit}</span></div>}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div>
                                        <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all">
                                            {loading ? <Spinner size="sm" color="border-white" containerClassName="p-0"/> : 'Calcular'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                            
                            {/* Área de resultado */}
                            <div className="mt-8">
                                {loading && <div className="flex justify-center"><Spinner /></div>}
                                {error && <div className="text-red-500 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg w-full text-center">{error}</div>}
                                {result && !loading && (
                                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 w-full animate-fadeIn space-y-4">
                                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Resultado</h2>
                                        <div className="text-center bg-sky-100 dark:bg-sky-900/50 p-4 rounded-lg">
                                            <span className="block text-lg font-medium text-sky-800 dark:text-sky-300">Escore Calculado</span>
                                            <span className="block text-4xl font-bold text-sky-600 dark:text-sky-400">{result.score}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-700 dark:text-slate-200">Interpretação Clínica</h3>
                                            <p className="mt-1 text-sm p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">{result.interpretation}</p>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-700 dark:text-slate-200">Fórmula Utilizada</h3>
                                            <p className="mt-1 text-sm p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md font-mono">{result.formula}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 text-center">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Selecione uma Calculadora</h2>
                            <p className="mt-2 text-slate-500">Escolha uma calculadora na lista à esquerda para começar.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalculatorScreen;