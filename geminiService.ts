
import { GoogleGenAI, Type } from "@google/genai";
import type { InteractionCheckResult, PrescriptionGenerationData, GroundingSource, ClinicalCalculationResult, FdaDrugInfo } from '../types';
import { medications } from '../data/medications';

// Inicializa a API do Gemini estritamente com a chave de ambiente,
// garantindo que a aplicação compilada funcione corretamente.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const interactionSchema = {
    type: Type.OBJECT,
    properties: {
        interactions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    drugs: { type: Type.ARRAY, items: { type: Type.STRING }},
                    description: { type: Type.STRING, description: "Descrição do mecanismo da interação." },
                    recommendation: { type: Type.STRING, description: "Recomendação clínica prática." },
                    riskLevel: { type: Type.STRING, description: "Nível de risco da interação (A, B, C, ou D)." }
                },
                required: ['drugs', 'description', 'recommendation', 'riskLevel']
            }
        }
    },
    required: ['interactions']
};

const autocompleteSchema = {
    type: Type.OBJECT,
    properties: {
        suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Uma lista de 5 a 7 sugestões de diagnóstico ou condição médica, com base na entrada do usuário."
        }
    },
    required: ['suggestions']
};

const prescriptionTemplateSchema = {
  type: Type.OBJECT,
  properties: {
    diagnosis: { type: Type.STRING, description: "O nome do diagnóstico." },
    protocolSource: { type: Type.STRING, description: "A fonte principal da diretriz clínica (ex: 'UpToDate', 'Diretriz da Sociedade Brasileira de Cardiologia 2023')." },
    medications: {
      type: Type.ARRAY,
      description: "Lista de medicamentos sugeridos para o tratamento.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Um identificador único para o medicamento, preferencialmente usando o princípio ativo em kebab-case (ex: 'losartana-potassica')." },
          name: { type: Type.STRING, description: "O nome do princípio ativo do medicamento." },
          presentation: { type: Type.STRING, description: "A apresentação comum do medicamento (ex: '50mg comp.', '10mg/mL sol oral')." },
          dosage: { type: Type.STRING, description: "A dose padrão recomendada." },
          route: { type: Type.STRING, description: "A via de administração (ex: 'Via Oral', 'Via Intravenosa')." },
          frequency: { type: Type.STRING, description: "A frequência da administração (ex: 'a cada 12 horas', '1x ao dia')." },
          observations: { type: Type.STRING, description: "Observações importantes para o prescritor (ex: 'Monitorar função renal', 'Não usar em gestantes')." },
          adjustments: {
            type: Type.OBJECT,
            description: "Ajustes de dose necessários para condições específicas.",
            properties: {
              renal: { type: Type.STRING, description: "Recomendação de ajuste para insuficiência renal." },
              hepatic: { type: Type.STRING, description: "Recomendação de ajuste para insuficiência hepática." },
            },
            required: ['renal', 'hepatic']
          },
        },
        required: ['id', 'name', 'presentation', 'dosage', 'route', 'frequency', 'observations', 'adjustments']
      },
    },
  },
  required: ['diagnosis', 'protocolSource', 'medications']
};

const clinicalCalculationSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.STRING, description: "O valor numérico final ou o resultado do escore (ex: '5 pontos', 'Risco Baixo')." },
        interpretation: { type: Type.STRING, description: "A interpretação clínica e as recomendações baseadas no resultado do escore." },
        formula: { type: Type.STRING, description: "A fórmula ou os critérios exatos usados para o cálculo, para fins de transparência." },
    },
    required: ['score', 'interpretation', 'formula']
};

const fdaDrugInfoSchema = {
    type: Type.OBJECT,
    properties: {
        generic_name: { type: Type.STRING },
        indications_and_usage: { type: Type.ARRAY, items: { type: Type.STRING } },
        warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
        dosage_and_administration: { type: Type.ARRAY, items: { type: Type.STRING } },
    }
};

export const getPrescriptionTemplate = async (diagnosis: string): Promise<string> => {
    const medicationExamples = medications.slice(0, 10).map(m => `Princípio Ativo: ${m.activeIngredient}, Nome Comercial: ${m.productName}`).join('\n');
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Gere um modelo de prescrição para o diagnóstico de "${diagnosis}". Foque em tratamentos de primeira linha baseados em evidências, comumente usados no Brasil. Inclua medicamentos com nome (princípio ativo), apresentação, posologia padrão (dose, via, frequência), observações para o prescritor e ajustes de dose para insuficiência renal e hepática. Use a seguinte lista como exemplo para formatação e nomenclatura de medicamentos:\n${medicationExamples}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: prescriptionTemplateSchema,
        },
    });

    return response.text;
};

export const checkInteractions = async (medicationNames: string[]): Promise<InteractionCheckResult> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Verifique as interações medicamentosas clinicamente relevantes entre os seguintes fármacos: ${medicationNames.join(', ')}. Para cada interação, forneça a descrição, a recomendação clínica e o nível de risco (A, B, C, D).`,
        config: {
            responseMimeType: "application/json",
            responseSchema: interactionSchema,
        },
    });

    try {
        const result = JSON.parse(response.text);
        return result as InteractionCheckResult;
    } catch (e) {
        console.error("Failed to parse interaction check JSON", e);
        return { interactions: [] };
    }
};

export const generateFinalPrescription = async (data: PrescriptionGenerationData): Promise<string> => {
    const contextInstruction = data.context === 'Hospitalar'
        ? "Formato para uso interno hospitalar, com ênfase na clareza para a equipe de enfermagem."
        : "Formato para receita ambulatorial, para ser entregue ao paciente.";

    const prescriptionDetails = Object.entries(data.medicationsByRoute).map(([route, meds]) => {
        const medLines = meds.map((med, index) => 
            `${index + 1}. ${med.name} - ${med.presentation}\n   Uso: ${med.posology}\n   Quantidade: ${med.quantity}`
        ).join('\n\n');
        return `Uso ${route}:\n${medLines}`;
    }).join('\n\n');

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Formate o seguinte receituário no padrão brasileiro (CFM), como um texto simples. ${contextInstruction}
        
        Dados do Médico:
        - Nome: ${data.doctor.name}
        - CRM: ${data.doctor.crm}
        - Clínica: ${data.doctor.clinicName}, ${data.doctor.clinicAddress}

        Dados do Paciente:
        - Nome: ${data.patient.name}

        Medicamentos:
        ${prescriptionDetails}

        Data: ${data.issueDate}

        O texto final deve ser limpo, sem markdown, apenas o corpo da receita, começando com os dados da clínica e terminando com a assinatura do médico.`,
    });

    return response.text;
};

export const performGroundedSearch = async (query: string): Promise<{ summary: string; sources: GroundingSource[] }> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Faça um resumo conciso e objetivo sobre a condição clínica "${query}", abordando os pontos principais de diagnóstico e tratamento, com base nas diretrizes médicas mais recentes.`,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const summary = response.text;
    const rawSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const sources: GroundingSource[] = rawSources
        .filter((s: any) => s.web && s.web.uri && s.web.title)
        .map((s: any) => ({
            uri: s.web.uri,
            title: s.web.title,
        }));

    return { summary, sources };
};

export const getAutocompleteSuggestions = async (query: string): Promise<string[]> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Com base na busca do usuário por "${query}", gere uma lista de 5 a 7 sugestões de autocompletar para diagnósticos e condições médicas comuns.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: autocompleteSchema,
            thinkingConfig: { thinkingBudget: 0 } // Baixa latência para autocompletar
        },
    });

    try {
        const result = JSON.parse(response.text);
        return (result.suggestions || []) as string[];
    } catch (e) {
        console.error("Failed to parse autocomplete suggestions JSON", e);
        return [];
    }
};

export const calculateClinicalScore = async (calculatorName: string, inputs: Record<string, string>): Promise<ClinicalCalculationResult> => {
    const inputString = Object.entries(inputs).map(([key, value]) => `- ${key}: ${value}`).join('\n');
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Calcule o escore clínico para "${calculatorName}" com os seguintes dados:\n${inputString}\n\nForneça o resultado final, a interpretação clínica e a fórmula/critérios utilizados.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: clinicalCalculationSchema,
        },
    });
    
    try {
        return JSON.parse(response.text) as ClinicalCalculationResult;
    } catch (e) {
        console.error("Failed to parse clinical calculation JSON", e);
        throw new Error("Não foi possível interpretar o resultado do cálculo.");
    }
};

export const getDrugInfoInPortuguese = async (drugName: string): Promise<FdaDrugInfo> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Busque informações farmacológicas para o princípio ativo "${drugName}". Retorne as seções de "Indicações e Uso", "Avisos e Precauções" e "Dosagem e Administração". Traduza o conteúdo para o português do Brasil.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: fdaDrugInfoSchema,
        },
    });
    
    try {
        const result = JSON.parse(response.text);
        if (!result.generic_name) {
            result.generic_name = drugName;
        }
        return result as FdaDrugInfo;
    } catch (e) {
        console.error("Failed to parse drug info JSON", e);
        throw new Error("Não foi possível interpretar os dados do medicamento.");
    }
};
