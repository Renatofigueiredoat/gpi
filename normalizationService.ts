import type { PrescriptionTemplate, Medication } from '../types';

/**
 * Limpa a string JSON bruta, removendo a formatação markdown que a IA às vezes adiciona.
 * @param text A string bruta da IA.
 * @returns Uma string JSON limpa.
 */
const cleanJsonString = (text: string): string => {
    // Remove ```json, ```, e espaços em branco no início/fim.
    const cleanedText = text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return cleanedText;
};


/**
 * Normaliza os dados brutos de um medicamento recebido da IA para a estrutura Medication.
 * @param med - O objeto de medicamento bruto da IA.
 * @returns Um objeto Medication normalizado.
 */
const normalizeMedication = (med: any): Medication => {
    const adjustments = med.adjustments || med.ajustes_dose || {};
    return {
        id: med.id || `med-${Math.random().toString(36).substring(2, 9)}`,
        name: med.name || med.nome || "Medicamento sem nome",
        presentation: med.presentation || med.apresentacao || "N/A",
        dosage: med.dosage || med.posologia_padrao || "N/A",
        route: med.route || med.via_administracao || "N/A",
        frequency: med.frequency || med.frequencia || "N/A",
        observations: med.observations || med.observacoes_prescritor || "N/A",
        adjustments: {
            renal: adjustments.renal || adjustments.insuficiencia_renal || "N/A",
            hepatic: adjustments.hepatic || adjustments.insuficiencia_hepatica || "N/A",
        },
    };
};

/**
 * Pega a resposta completa da IA (como string), limpa, analisa e normaliza em uma
 * estrutura `PrescriptionTemplate` estrita e segura.
 * Lida com vários sinônimos de chave (ex: 'medications', 'prescricao_modelo').
 * @param rawText - A string de resposta completa da IA.
 * @param diagnosisFallback - Um diagnóstico para usar se a IA não fornecer um.
 * @returns Um objeto PrescriptionTemplate validado.
 * @throws Lança um erro se a estrutura fundamental (lista de medicamentos) estiver ausente ou for inválida.
 */
export const normalizePrescriptionData = (rawText: string, diagnosisFallback: string): PrescriptionTemplate => {
    if (!rawText || rawText.trim() === '') {
        throw new Error("A resposta da IA está vazia.");
    }
    
    const cleanedJson = cleanJsonString(rawText);
    let parsedJson: any;

    try {
        parsedJson = JSON.parse(cleanedJson);
    } catch (parseError) {
        console.error("Falha ao analisar JSON:", parseError, "\nJSON Limpo Tentado:", cleanedJson);
        throw new Error("A resposta da IA não é um JSON válido.");
    }

    // Procura pela lista de medicamentos usando várias chaves possíveis
    const medicationsList = parsedJson.medications || parsedJson.prescricao_modelo || parsedJson.medicamentos;

    if (!medicationsList || !Array.isArray(medicationsList)) {
        console.error("Estrutura de modelo inválida recebida da IA:", parsedJson);
        throw new Error("A resposta da IA não contém uma lista de medicamentos válida ou tem uma estrutura incorreta.");
    }
    
    const normalizedTemplate: PrescriptionTemplate = {
        diagnosis: parsedJson.diagnosis || parsedJson.diagnostico || diagnosisFallback,
        protocolSource: parsedJson.protocolSource || parsedJson.fonte_diretriz || parsedJson.fonte_diretrizes_principais || "Não especificada",
        medications: medicationsList.map(normalizeMedication)
    };
    
    return normalizedTemplate;
};
