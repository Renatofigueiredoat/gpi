
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getPrescriptionTemplate, checkInteractions, generateFinalPrescription } from '../services/geminiService';
import { normalizePrescriptionData } from '../services/normalizationService';
import { searchMedications } from '../services/medicationService';
import type { PrescriptionItem, PrescriptionToSave, SavedPrescription, PatientInfo, Interaction, MedicationData, DoctorInfo, PrescriptionGenerationData } from '../types';
import Spinner from '../components/Spinner';
import PillIcon from '../components/icons/PillIcon';
import AlertTriangleIcon from '../components/icons/AlertTriangleIcon';
import ClipboardCheckIcon from '../components/icons/ClipboardCheckIcon';
import PrinterIcon from '../components/icons/PrinterIcon';
import ArchiveBoxIcon from '../components/icons/ArchiveBoxIcon';
import ShareIcon from '../components/icons/ShareIcon';
import DocumentTextIcon from '../components/icons/DocumentTextIcon';
import PlusIcon from '../components/icons/PlusIcon';
import TrashIcon from '../components/icons/TrashIcon';
import FdaInfoModal from '../components/FdaInfoModal';
import InformationCircleIcon from '../components/icons/InformationCircleIcon';
import SavePrescriptionModal from '../components/SavePrescriptionModal';
import SpecialPrescriptionOutput from '../components/SpecialPrescriptionOutput';
import { useAuth } from '../components/AuthContext';
import DocumentArrowDownIcon from '../components/icons/DocumentArrowDownIcon';


type SaveState = 'idle' | 'saving' | 'saved';
type InteractionStatus = 'idle' | 'debouncing' | 'loading' | 'success' | 'error';

const FormInput = ({ label, id, value, onChange, placeholder, required = false, readOnly = false }: { label: string, id: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string, required?: boolean, readOnly?: boolean }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type="text"
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            readOnly={readOnly}
            className={`w-full p-2 rounded-md border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-sky-500 focus:outline-none ${readOnly ? 'bg-slate-200 dark:bg-slate-800 cursor-not-allowed' : 'bg-slate-100 dark:bg-slate-700'}`}
        />
    </div>
);

const getInteractionSeverityClasses = (riskLevel: Interaction['riskLevel']) => {
    switch (riskLevel) {
        case 'D':
            return 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700/50 text-red-800 dark:text-red-300';
        case 'C':
            return 'bg-orange-50 border-orange-300 dark:bg-orange-900/20 dark:border-orange-700/50 text-orange-800 dark:text-orange-300';
        case 'B':
            return 'bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700/50 text-yellow-800 dark:text-yellow-300';
        case 'A':
            return 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700/50 text-green-800 dark:text-green-300';
        default:
            return 'bg-slate-50 border-slate-300 dark:bg-slate-700/50 dark:border-slate-600 text-slate-800 dark:text-slate-300';
    }
};

const PrescriptionBuilderScreen: React.FC = () => {
  const { diagnosis: diagnosisFromUrl } = useParams<{ diagnosis: string }>();
  const navigate = useNavigate();
  const { state } = useLocation();
  const savedData = state?.savedData as SavedPrescription | undefined;
  
  const [template, setTemplate] = useState<any | null>(null);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [interactionStatus, setInteractionStatus] = useState<InteractionStatus>('idle');
  const [interactionErrorMessage, setInteractionErrorMessage] = useState<string | null>(null);

  const [shareFeedback, setShareFeedback] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({ name: '', document: '', address: '' });
  const [prescriptionType, setPrescriptionType] = useState<'Receita Simples' | 'Receita de Controle Especial'>('Receita Simples');
  const [prescriptionContext, setPrescriptionContext] = useState<'Ambulatorial' | 'Hospitalar'>('Ambulatorial');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState<string | PrescriptionGenerationData | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);


  const [savedPrescriptionId, setSavedPrescriptionId] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSharingPdf, setIsSharingPdf] = useState(false);

  // Autocomplete state
  const [medicationSuggestions, setMedicationSuggestions] = useState<MedicationData[]>([]);
  const [activeSuggestionBox, setActiveSuggestionBox] = useState<string | null>(null);
  const suggestionBoxRef = useRef<HTMLDivElement>(null);

  // FDA Modal state
  const [fdaModal, setFdaModal] = useState({ isOpen: false, drugName: '' });
  
  const { currentUser } = useAuth();
  const doctorInfo = currentUser?.doctorInfo;


  const decodedDiagnosis = useMemo(() => {
    if (savedData) return savedData.diagnosis;
    if (diagnosisFromUrl === 'new') return 'Nova Prescrição';
    if (diagnosisFromUrl) return decodeURIComponent(diagnosisFromUrl);
    return 'Carregando Prescrição...';
  }, [savedData, diagnosisFromUrl]);

  const handlePatientInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      setPatientInfo(prev => ({...prev, [id]: value}));
  }

  useEffect(() => {
    const fetchTemplate = async (diagnosis: string) => {
        setLoading(true);
        setError(null);
        setTemplate(null);
        setPrescriptionItems([]);
        setSavedPrescriptionId(null);
        setCustomName('');

        try {
            const jsonString = await getPrescriptionTemplate(diagnosis);
            
            const normalizedTemplate = normalizePrescriptionData(jsonString, diagnosis);
            setTemplate(normalizedTemplate);

            const initialItems = normalizedTemplate.medications.map(med => {
              const defaultPosology = [med.dosage, med.route, med.frequency].filter(Boolean).join(', ');
              return { ...med, selected: true, customPosology: defaultPosology, quantity: "1 (uma) caixa" };
            });
            setPrescriptionItems(initialItems);

        } catch (err) {
            console.error("Erro ao processar o modelo de prescrição:", err);
            setError(err instanceof Error ? `Falha ao processar a prescrição: ${err.message}. Tente novamente.` : 'Ocorreu um erro desconhecido.');
        } finally {
            setLoading(false);
        }
    };

    const loadData = () => {
      setLoading(true);
      setError(null);
      setGeneratedOutput(null);

      if (savedData) {
          const loadedTemplate: any = {
              diagnosis: savedData.diagnosis,
              protocolSource: savedData.protocolSource,
              medications: savedData.items,
          };
          setTemplate(loadedTemplate);
          setPrescriptionItems(savedData.items);
          setSavedPrescriptionId(savedData.id);
          setCustomName(savedData.customName);
          if (savedData.patientInfo) setPatientInfo(savedData.patientInfo);
          setLoading(false);
      } else if (diagnosisFromUrl) {
          const diagnosis = decodeURIComponent(diagnosisFromUrl);
          if (diagnosis === 'new') {
              // Handle blank prescription
              setTemplate({
                  diagnosis: 'Nova Prescrição',
                  protocolSource: 'N/A',
                  medications: [],
              });
              setPrescriptionItems([]);
              setCustomName('Nova Prescrição');
              setLoading(false);
          } else {
              fetchTemplate(diagnosis);
          }
      }
    };

    loadData();
  }, [savedData, diagnosisFromUrl]);

  const selectedMedications = useMemo(() => 
    prescriptionItems.filter(item => item.selected), 
    [prescriptionItems]
  );
  
  const handleToggleItem = (id: string) => {
    setPrescriptionItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };
  
  const handleItemChange = (id: string, field: 'customPosology' | 'quantity' | 'name' | 'presentation', value: string) => {
    setPrescriptionItems(prevItems =>
        prevItems.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        )
    );

    const currentItem = prescriptionItems.find(item => item.id === id);
    if (field === 'name' && currentItem?.isCustom) {
        if (value.length > 2) {
            setMedicationSuggestions(searchMedications(value));
        } else {
            setMedicationSuggestions([]);
        }
    }
  };

  const handleSuggestionSelect = (itemId: string, med: MedicationData) => {
      setPrescriptionItems(prevItems =>
          prevItems.map(item => {
              if (item.id === itemId) {
                  return {
                      ...item,
                      name: med.activeIngredient,
                      // Preenche a apresentação com o nome comercial, deixando espaço para o usuário adicionar a dosagem.
                      presentation: `${med.productName} `
                  };
              }
              return item;
          })
      );
      setActiveSuggestionBox(null);
      setMedicationSuggestions([]);
  };
  
  const handleAddItem = useCallback(() => {
    const newItem: PrescriptionItem = {
      id: `custom-${new Date().getTime()}`,
      name: '',
      presentation: '',
      selected: true,
      isCustom: true,
      customPosology: '',
      quantity: '1',
      dosage: '',
      route: '',
      frequency: '',
      observations: '',
      adjustments: { renal: 'N/A', hepatic: 'N/A' },
    };
    setPrescriptionItems(prev => [...prev, newItem]);
  }, []);

  const handleRemoveItem = (id: string) => {
    setPrescriptionItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const selectedMedicationNamesString = useMemo(() => 
    prescriptionItems
        .filter(item => item.selected && item.name)
        .map(item => item.name)
        .sort()
        .join(','), 
  [prescriptionItems]);

  useEffect(() => {
    const medNamesList = selectedMedicationNamesString.split(',').filter(Boolean);

    if (medNamesList.length < 2) {
        setInteractions([]);
        setInteractionErrorMessage(null);
        setInteractionStatus('idle');
        return;
    }

    setInteractionStatus('debouncing');

    const runInteractionCheck = async () => {
        setInteractionStatus('loading');
        setInteractionErrorMessage(null);
        try {
            const result = await checkInteractions(medNamesList);
            const clinicallyRelevantInteractions = result.interactions.filter(
                (interaction) => interaction.riskLevel !== 'A'
            );
            setInteractions(clinicallyRelevantInteractions);
            setInteractionStatus('success');
        } catch (err) {
            console.error("Erro ao verificar interações:", err);
            let errorMessage = "Falha ao verificar interações medicamentosas.";
            if (err instanceof Error) {
                if (err.message.includes('429') || err.message.includes('exceeded')) {
                    errorMessage = "Você atingiu o limite de requisições. Por favor, aguarde um momento.";
                } else {
                    errorMessage = `Falha na verificação: ${err.message}`;
                }
            }
            setInteractionErrorMessage(errorMessage);
            setInteractions([]);
            setInteractionStatus('error');
        }
    };

    const handler = setTimeout(runInteractionCheck, 1200);

    return () => clearTimeout(handler);
  }, [selectedMedicationNamesString]);
  
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionBoxRef.current && !suggestionBoxRef.current.contains(event.target as Node)) {
                setActiveSuggestionBox(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

  const handleConfirmSave = async (
    name: string,
    workplace?: { id: string; name: string }
  ) => {
    if (!template || !doctorInfo) return;
    setSaveState('saving');
    setIsSaveModalOpen(false);

    const prescriptionToSave: PrescriptionToSave = {
      customName: name,
      diagnosis: template.diagnosis,
      protocolSource: template.protocolSource,
      items: prescriptionItems,
      patientInfo: patientInfo,
      doctorInfo: doctorInfo,
      workplaceId: workplace?.id,
      workplaceName: workplace?.name,
    };

    try {
      const { savePrescription } = await import('../services/storageService');
      const savedItem = await savePrescription(prescriptionToSave, savedPrescriptionId ?? undefined);
      setSavedPrescriptionId(savedItem.id);
      setCustomName(savedItem.customName);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (err) {
      console.error("Falha ao salvar a prescrição", err);
      setError("Falha ao salvar a prescrição.");
      setSaveState('idle');
    }
  };


  const handleGenerateClick = async () => {
      if(selectedMedications.length === 0) {
          alert("Selecione ao menos um medicamento para gerar a receita.");
          return;
      }
      if (!doctorInfo) {
          alert("Dados do médico não encontrados. Não é possível gerar a receita.");
          return;
      }
      setIsGenerating(true);
      setError(null);
      setGeneratedOutput(null);

      const medicationsByRoute = selectedMedications.reduce((acc, med) => {
          const route = med.route || 'Uso Interno'; // Default group if route is missing
          if (!acc[route]) {
              acc[route] = [];
          }
          acc[route].push({
              name: med.name,
              presentation: med.presentation,
              posology: med.customPosology,
              quantity: med.quantity,
          });
          return acc;
      }, {} as { [route: string]: { name: string; presentation: string; posology: string; quantity: string; }[] });

      const data: PrescriptionGenerationData = {
          prescriptionType,
          context: prescriptionContext,
          issueDate: new Date().toLocaleDateString('pt-BR'),
          doctor: doctorInfo,
          patient: patientInfo,
          medicationsByRoute,
      };
      
      if (prescriptionType === 'Receita de Controle Especial') {
          setGeneratedOutput(data);
          setIsGenerating(false);
          return;
      }

      try {
          const resultText = await generateFinalPrescription(data);
          setGeneratedOutput(resultText);
      } catch (err) {
          setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido ao gerar a receita.");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleShare = async () => {
    if (!generatedOutput) {
        alert("Gere a receita primeiro para poder compartilhar.");
        return;
    }
    
    const textToShare = typeof generatedOutput === 'string'
        ? generatedOutput
        : outputRef.current?.innerText || '';

    if (!textToShare) {
        alert("Não foi possível extrair o texto para compartilhamento.");
        return;
    }

    const shareData = {
        title: `Prescrição para ${template?.diagnosis}`,
        text: textToShare,
    };
    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(textToShare);
            setShareFeedback(true);
            setTimeout(() => setShareFeedback(false), 2000);
        }
    } catch (err) {
        console.error("Error sharing:", err);
        alert("Falha ao compartilhar. A prescrição foi copiada para a área de transferência.");
        await navigator.clipboard.writeText(textToShare);
        setShareFeedback(true);
        setTimeout(() => setShareFeedback(false), 2000);
    }
  };

    const handleSharePdf = async () => {
        if (!generatedOutput || !outputRef.current || typeof generatedOutput === 'string') {
            alert("Gere uma Receita de Controle Especial para compartilhar como PDF.");
            return;
        }

        setIsSharingPdf(true);

        try {
            const { default: jsPDF } = await import('jspdf');
            const { default: html2canvas } = await import('html2canvas');

            const vias = outputRef.current.querySelectorAll<HTMLDivElement>('.bg-white.p-2.w-full');
            if (vias.length < 2) {
                throw new Error("Não foi possível encontrar as vias da receita para gerar o PDF.");
            }
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            for (let i = 0; i < vias.length; i++) {
                const via = vias[i];
                const canvas = await html2canvas(via, { scale: 3, useCORS: true });
                const imgData = canvas.toDataURL('image/png');
                
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgProps = pdf.getImageProperties(imgData);
                const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
                
                if (i > 0) {
                    pdf.addPage();
                }
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
            }

            const pdfBlob = pdf.output('blob');
            const pdfFile = new File([pdfBlob], 'prescricao.pdf', { type: 'application/pdf' });
            
            if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                await navigator.share({
                    title: 'Prescrição Médica',
                    text: `Prescrição para ${template?.diagnosis}`,
                    files: [pdfFile],
                });
            } else {
                pdf.save('prescricao.pdf');
            }

        } catch (err) {
            console.error("Erro ao gerar ou compartilhar PDF:", err);
            alert("Ocorreu um erro ao gerar o PDF. Verifique o console para mais detalhes.");
        } finally {
            setIsSharingPdf(false);
        }
    };


    const handlePrint = () => {
        if (!generatedOutput || !outputRef.current) {
            alert("Gere a receita primeiro para poder imprimir.");
            return;
        }

        const printNode = outputRef.current.cloneNode(true) as HTMLElement;

        const elementsToHide = printNode.querySelectorAll('.print\\:hidden');
        elementsToHide.forEach(el => (el as HTMLElement).remove());
        const printContents = printNode.innerHTML;

        let styles = '';
        for (const sheet of Array.from(document.styleSheets)) {
            try {
                if (sheet.cssRules) {
                    styles += Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
                }
            } catch (e) {
                console.warn("Não foi possível ler a folha de estilo para impressão:", e);
            }
        }

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        iframe.srcdoc = `
            <html>
                <head>
                    <title>Prescrição Médica</title>
                    <style>${styles}</style>
                </head>
                <body>
                    ${printContents}
                </body>
            </html>
        `;

        iframe.onload = () => {
            setTimeout(() => {
                try {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                } catch (e) {
                    console.error("Erro ao imprimir:", e);
                    alert("Ocorreu um erro ao tentar imprimir.");
                } finally {
                    document.body.removeChild(iframe);
                }
            }, 100);
        };
    };

  const getSaveButtonContent = () => {
    switch (saveState) {
        case 'saving':
            return <Spinner size="sm" color="border-white" containerClassName="p-0" />;
        case 'saved':
            return <><ClipboardCheckIcon className="w-6 h-6 mr-2" /> Salvo!</>;
        default:
            return savedPrescriptionId 
                ? <><ArchiveBoxIcon className="w-6 h-6 mr-2" /> Atualizar Modelo</>
                : <><ArchiveBoxIcon className="w-6 h-6 mr-2" /> Salvar como Modelo</>;
    }
  };

  if (loading || !doctorInfo) {
    return (
        <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 animate-fadeIn">
            <button onClick={() => navigate('/dashboard')} className="mb-4 text-sm text-sky-600 hover:underline dark:text-sky-400">&larr; Voltar para a busca</button>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">{decodedDiagnosis}</h1>
                <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mt-2 animate-pulse" aria-label="Carregando fonte do protocolo..."></div>
            </div>
            <div className="text-center p-8 my-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <Spinner />
                <p className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">Gerando sugestões de prescrição...</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Isso pode levar alguns segundos.</p>
            </div>
        </div>
    );
  }

  if (error && !generatedOutput) return (
      <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 animate-fadeIn">
          <button onClick={() => navigate('/dashboard')} className="mb-4 text-sm text-sky-600 hover:underline dark:text-sky-400">&larr; Voltar para a busca</button>
          <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h2 className="text-xl font-bold text-red-700 dark:text-red-300">Erro na Geração da Prescrição</h2>
              <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>
              <button onClick={() => navigate(0)} className="mt-6 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">
                  Tentar Novamente
              </button>
          </div>
      </div>
  );
  
  if (!template) {
    return <div className="text-center p-8">Nenhum modelo de prescrição encontrado.</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 animate-fadeIn print:p-0 print:m-0 print:max-w-none">
        <button onClick={() => navigate('/dashboard')} className="mb-4 text-sm text-sky-600 hover:underline dark:text-sky-400 print:hidden">&larr; Voltar para a busca</button>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6 print:hidden">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">{template.diagnosis}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Fonte da diretriz: {template.protocolSource}</p>
        </div>

        {/* CFM Generator Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6 print:hidden">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center"><DocumentTextIcon className="w-6 h-6 mr-2 text-sky-500"/>Gerador de Receita (Padrão CFM)</h2>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                        Contexto da Prescrição
                    </label>
                    <div className="flex rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
                        <button
                            type="button"
                            onClick={() => setPrescriptionContext('Ambulatorial')}
                            className={`w-full py-2 text-sm font-semibold rounded-md transition-colors ${
                                prescriptionContext === 'Ambulatorial'
                                    ? 'bg-white dark:bg-slate-800 text-sky-600 shadow'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                        >
                            Ambulatorial
                        </button>
                        <button
                            type="button"
                            onClick={() => setPrescriptionContext('Hospitalar')}
                            className={`w-full py-2 text-sm font-semibold rounded-md transition-colors ${
                                prescriptionContext === 'Hospitalar'
                                    ? 'bg-white dark:bg-slate-800 text-sky-600 shadow'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                        >
                            Hospitalar
                        </button>
                    </div>
                </div>

                <div>
                    <label htmlFor="prescription-type" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Tipo de Receita</label>
                    <select id="prescription-type" value={prescriptionType} onChange={e => setPrescriptionType(e.target.value as any)} className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded-md border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-sky-500 focus:outline-none">
                        <option value="Receita Simples">Receita Simples</option>
                        <option value="Receita de Controle Especial">Receita de Controle Especial</option>
                    </select>
                </div>
                <div className="space-y-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <h3 className="font-semibold text-lg">Dados do Médico e Clínica (padrão)</h3>
                    <FormInput label="Nome Completo" id="doc-name" value={doctorInfo.name} onChange={() => {}} readOnly />
                    <FormInput label="CRM/Estado" id="doc-crm" value={doctorInfo.crm} onChange={() => {}} readOnly />
                    <FormInput label="Nome da Clínica/Unidade" id="clinic-name" value={doctorInfo.clinicName} onChange={() => {}} readOnly />
                    <FormInput label="Endereço da Clínica" id="clinic-address" value={doctorInfo.clinicAddress} onChange={() => {}} readOnly />
                </div>
                <div className="space-y-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <h3 className="font-semibold text-lg">Dados do Paciente</h3>
                    <FormInput label="Nome Completo" id="name" value={patientInfo.name} onChange={handlePatientInfoChange} required />
                    <FormInput label="Documento de Identificação (RG/CPF)" id="document" value={patientInfo.document} onChange={handlePatientInfoChange} />
                    <FormInput label="Endereço Completo" id="address" value={patientInfo.address} onChange={handlePatientInfoChange} required={prescriptionType === 'Receita de Controle Especial'} />
                </div>

            </div>
        </div>

        {interactionStatus !== 'idle' && (
            <div className="mb-6 rounded-lg p-4 border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 print:hidden">
                <h3 className="font-bold text-lg flex items-center text-slate-800 dark:text-slate-200">
                    <AlertTriangleIcon className="w-6 h-6 mr-2"/> 
                    Análise de Interação Medicamentosa
                </h3>
                <div className="mt-2">
                    {interactionStatus === 'debouncing' && <p className="text-sm text-slate-500 dark:text-slate-400">Aguardando para verificar...</p>}
                    {interactionStatus === 'loading' && <Spinner size="sm" />}
                    {interactionStatus === 'error' && <p className="text-red-700 dark:text-red-400">{interactionErrorMessage}</p>}
                    {interactionStatus === 'success' && (
                        interactions.length > 0 ? (
                            <ul className="space-y-3">
                                {interactions.map((interaction, index) => (
                                    <li key={index} className={`p-3 rounded-md border ${getInteractionSeverityClasses(interaction.riskLevel)}`}>
                                        <strong className="font-semibold block">Risco Nível {interaction.riskLevel}: {interaction.drugs.join(' + ')}</strong>
                                        <span className="text-sm">{interaction.description}</span>
                                        <br />
                                        <span className="text-sm opacity-90"><strong className="font-semibold">Recomendação:</strong> {interaction.recommendation}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-green-700 dark:text-green-400">Nenhuma interação clinicamente relevante encontrada.</p>
                        )
                    )}
                </div>
            </div>
        )}

        <div className="print:hidden">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 mt-8">Medicamentos Sugeridos</h2>
          <div className="space-y-4" ref={suggestionBoxRef}>
              {prescriptionItems.map(item => (
                  <div key={item.id} className={`bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 transition-all ${item.selected ? 'ring-2 ring-sky-500' : 'opacity-70'}`}>
                      <div className="flex items-start">
                          {item.isCustom ? (
                              <div className="flex-shrink-0 pt-1">
                                  <button onClick={() => handleRemoveItem(item.id)} aria-label="Remover medicamento" className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-300 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                                      <TrashIcon className="w-5 h-5" />
                                  </button>
                              </div>
                          ) : (
                              <div className="flex-shrink-0 pt-1">
                                  <input type="checkbox" checked={item.selected} onChange={() => handleToggleItem(item.id)} className="h-6 w-6 rounded border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"/>
                              </div>
                          )}
                          <div className="ml-4 flex-1">
                              {item.isCustom ? (
                                  <div className="grid grid-cols-1 md:grid-cols-5 gap-x-4 gap-y-2 mb-3">
                                      <div className="md:col-span-3 relative">
                                          <label htmlFor={`name-${item.id}`} className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 block">Medicamento:</label>
                                          <input 
                                              type="text" 
                                              id={`name-${item.id}`} 
                                              value={item.name} 
                                              onChange={(e) => handleItemChange(item.id, 'name', e.target.value)} 
                                              onFocus={() => setActiveSuggestionBox(item.id)}
                                              className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded-md border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-sky-500 focus:outline-none text-sm" 
                                              placeholder="Busque pelo nome ou princípio ativo"
                                              autoComplete="off"
                                          />
                                          {activeSuggestionBox === item.id && medicationSuggestions.length > 0 && (
                                              <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto">
                                                  <ul>
                                                      {medicationSuggestions.map(med => (
                                                          <li key={med.productName + med.activeIngredient}>
                                                              <button
                                                                  type="button"
                                                                  onClick={() => handleSuggestionSelect(item.id, med)}
                                                                  className="w-full text-left px-4 py-2 hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors"
                                                              >
                                                                  <span className="font-semibold block">{med.activeIngredient}</span>
                                                                  <span className="text-xs text-slate-500 dark:text-slate-400">Nome comercial: {med.productName}</span>
                                                              </button>
                                                          </li>
                                                      ))}
                                                  </ul>
                                              </div>
                                          )}
                                      </div>
                                      <div className="md:col-span-2">
                                          <label htmlFor={`presentation-${item.id}`} className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 block">Apresentação:</label>
                                          <input type="text" id={`presentation-${item.id}`} value={item.presentation} onChange={(e) => handleItemChange(item.id, 'presentation', e.target.value)} className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded-md border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-sky-500 focus:outline-none text-sm" placeholder="Ex: 50mg comp."/>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="flex items-center gap-2">
                                      <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center">
                                          <PillIcon className="w-5 h-5 mr-2 text-sky-500"/>{item.name}
                                          <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">({item.presentation})</span>
                                      </h3>
                                      <button onClick={() => setFdaModal({ isOpen: true, drugName: item.name })} title={`Buscar informações de ${item.name}`} className="text-slate-400 hover:text-sky-500 transition-colors">
                                          <InformationCircleIcon className="w-5 h-5"/>
                                      </button>
                                  </div>
                              )}

                              <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${item.isCustom ? '' : 'mt-3'}`}>
                                  <div className="md:col-span-2">
                                      <label htmlFor={`posology-${item.id}`} className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 block">Posologia:</label>
                                      <textarea id={`posology-${item.id}`} value={item.customPosology} onChange={(e) => handleItemChange(item.id, 'customPosology', e.target.value)} rows={2} className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded-md border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-sky-500 focus:outline-none text-sm" placeholder="Ex: Tomar 1 comprimido, via oral, a cada 8 horas..."/>
                                  </div>
                                  <div>
                                      <label htmlFor={`quantity-${item.id}`} className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 block">Quantidade:</label>
                                      <input type="text" id={`quantity-${item.id}`} value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded-md border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-sky-500 focus:outline-none text-sm" />
                                  </div>
                              </div>

                              {!item.isCustom && (
                                  <>
                                      {item.observations && <p className="text-sm italic text-slate-500 dark:text-slate-400 pt-2"><strong>Obs. para o médico:</strong> {item.observations}</p>}
                                      <details className="mt-3 text-xs">
                                          <summary className="cursor-pointer font-semibold text-sky-600 dark:text-sky-400">Ajustes de Dose</summary>
                                          <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded"><p><strong className="font-medium">Renal:</strong> {item.adjustments.renal}</p><p><strong className="font-medium">Hepático:</strong> {item.adjustments.hepatic}</p></div>
                                      </details>
                                  </>
                              )}
                          </div>
                      </div>
                  </div>
              ))}
          </div>
        
          <div className="mt-6">
              <button onClick={handleAddItem} className="w-full flex justify-center items-center py-2 px-4 border-2 border-dashed border-sky-400 text-sky-600 dark:text-sky-300 font-medium rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-slate-800 transition-all">
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Adicionar Medicamento
              </button>
          </div>
        </div>

        {/* Final Generation and Actions */}
        <div className="mt-8 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg print:hidden">
            <button onClick={handleGenerateClick} disabled={isGenerating || selectedMedications.length === 0} className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-lg font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all">
                {isGenerating ? <Spinner size="sm" color="border-white" containerClassName="p-0" /> : <><DocumentTextIcon className="w-6 h-6 mr-2" /> Gerar Receita Formatada</>}
            </button>
            
            {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
        </div>

        {generatedOutput && (
            <div className="mt-6 print:mt-0" id="prescription-print-area" ref={outputRef}>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 print:hidden">Receita Gerada</h3>
                
                {typeof generatedOutput === 'string' ? (
                     <div id="final-prescription-view" className="p-6 bg-white dark:bg-slate-50 rounded-md border border-slate-200 dark:border-slate-700 shadow-inner print:border-none print:shadow-none print:p-0">
                        <div className="whitespace-pre-wrap font-serif leading-relaxed text-black">{generatedOutput}</div>
                    </div>
                ) : (
                    <SpecialPrescriptionOutput data={generatedOutput} />
                )}

                 <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-4 print:hidden">
                    <button onClick={handlePrint} className="w-full sm:w-auto flex-1 flex justify-center items-center py-2 px-4 border border-transparent font-medium rounded-lg text-white bg-slate-600 hover:bg-slate-700"><PrinterIcon className="w-5 h-5 mr-2"/> Imprimir</button>
                    <button onClick={handleShare} disabled={shareFeedback} className="w-full sm:w-auto flex-1 flex justify-center items-center py-2 px-4 border border-transparent font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-green-600">
                         {shareFeedback ? ( <> <ClipboardCheckIcon className="w-5 h-5 mr-2" /> Copiado! </> ) : ( <> <ShareIcon className="w-5 h-5 mr-2" /> Compartilhar Texto </> )}
                    </button>
                    {typeof generatedOutput !== 'string' && (
                        <button onClick={handleSharePdf} disabled={isSharingPdf} className="w-full sm:w-auto flex-1 flex justify-center items-center py-2 px-4 border border-transparent font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400">
                           {isSharingPdf ? <Spinner size="sm" color="border-white" containerClassName="p-0" /> : <><DocumentArrowDownIcon className="w-5 h-5 mr-2" /> Compartilhar PDF</>}
                        </button>
                    )}
                </div>
            </div>
        )}


        <div className="mt-8 flex justify-center print:hidden">
             <button onClick={() => setIsSaveModalOpen(true)} disabled={saveState !== 'idle' || selectedMedications.length === 0} className="w-full sm:w-auto flex justify-center items-center py-3 px-6 border border-transparent text-lg font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed">
                {getSaveButtonContent()}
            </button>
        </div>

        <FdaInfoModal 
            drugName={fdaModal.drugName}
            isOpen={fdaModal.isOpen}
            onClose={() => setFdaModal({ isOpen: false, drugName: '' })}
        />

        <SavePrescriptionModal
            isOpen={isSaveModalOpen}
            onClose={() => setIsSaveModalOpen(false)}
            onSave={handleConfirmSave}
            currentName={customName}
            diagnosis={template.diagnosis}
        />
    </div>
  );
};

export default PrescriptionBuilderScreen;