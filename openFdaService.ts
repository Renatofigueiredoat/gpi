import type { FdaDrugInfo } from '../types';

// A chave da API é obtida da variável de ambiente, com um fallback para a chave pública padrão.
// É uma boa prática gerenciar chaves via variáveis de ambiente.
const API_KEY = process.env.OPENFDA_API_KEY || 'qO7dxhRCLZL8HABR2VweTVzLw89cIgXWAXMgU1hn';

/**
 * Fetches detailed drug information from the openFDA API.
 * @param drugName The generic name of the drug to search for.
 * @returns A promise that resolves to a structured drug information object or null if not found.
 */
export const getDrugInfo = async (drugName: string): Promise<FdaDrugInfo | null> => {
    if (!drugName) {
        return null;
    }

    // Sanitize the drug name for the URL
    const sanitizedDrugName = encodeURIComponent(drugName.trim());
    const url = `https://api.fda.gov/drug/label.json?api_key=${API_KEY}&search=openfda.generic_name:"${sanitizedDrugName}"&limit=1`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`A API do FDA respondeu com o status: ${response.status}`);
        }
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            const info: FdaDrugInfo = {
                generic_name: result.openfda?.generic_name?.[0] || drugName,
                indications_and_usage: result.indications_and_usage,
                warnings: result.warnings,
                dosage_and_administration: result.dosage_and_administration,
            };
            return info;
        }

        return null;
    } catch (error) {
        console.error("Erro ao buscar informações do openFDA:", error);
        throw new Error("Não foi possível buscar os dados do medicamento no serviço do FDA.");
    }
};