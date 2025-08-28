import type { SavedPrescription, PrescriptionToSave, Workplace } from '../types';

const getStorageKey = () => `gpi_prescriptions_local`;
const getWorkplacesKey = () => `gpi_workplaces_local`;

/**
 * Busca os locais de trabalho salvos do localStorage.
 * @returns Uma promessa que resolve para um array de locais de trabalho salvos.
 */
export const getWorkplaces = async (): Promise<Workplace[]> => {
    try {
        const key = getWorkplacesKey();
        const workplacesJson = localStorage.getItem(key);
        return workplacesJson ? JSON.parse(workplacesJson) as Workplace[] : [];
    } catch (error) {
        console.error("Erro ao buscar locais de trabalho do localStorage:", error);
        return [];
    }
};

/**
 * Adiciona um novo local de trabalho ao localStorage.
 * @param name O nome do novo local de trabalho.
 * @returns Uma promessa que resolve para o novo local de trabalho criado.
 */
export const addWorkplace = async (name: string): Promise<Workplace> => {
    const workplaces = await getWorkplaces();
    if (workplaces.some(w => w.name.toLowerCase() === name.toLowerCase())) {
        throw new Error("Este local de trabalho já existe.");
    }

    const newWorkplace: Workplace = {
        id: `wp-${new Date().getTime()}-${Math.random().toString(36).substring(2, 9)}`,
        name,
    };

    const updatedWorkplaces = [...workplaces, newWorkplace];
    try {
        localStorage.setItem(getWorkplacesKey(), JSON.stringify(updatedWorkplaces));
        return newWorkplace;
    } catch (error) {
        console.error("Erro ao adicionar local de trabalho no localStorage:", error);
        throw new Error("Não foi possível salvar o novo local de trabalho.");
    }
};

/**
 * Deleta um local de trabalho do localStorage.
 * @param id O ID do local de trabalho a ser deletado.
 */
export const deleteWorkplace = async (id: string): Promise<void> => {
    let workplaces = await getWorkplaces();
    const updatedWorkplaces = workplaces.filter(w => w.id !== id);

    try {
        localStorage.setItem(getWorkplacesKey(), JSON.stringify(updatedWorkplaces));
        // Opcional: Desassociar este workplace das prescrições existentes
        let prescriptions = await getSavedPrescriptions();
        prescriptions.forEach(p => {
            if (p.workplaceId === id) {
                delete p.workplaceId;
                delete p.workplaceName;
            }
        });
        localStorage.setItem(getStorageKey(), JSON.stringify(prescriptions));

    } catch (error) {
        console.error("Erro ao deletar local de trabalho do localStorage:", error);
        throw new Error("Não foi possível deletar o local de trabalho.");
    }
};

/**
 * Busca as prescrições salvas do localStorage.
 * @returns Uma promessa que resolve para um array de prescrições salvas.
 */
export const getSavedPrescriptions = async (): Promise<SavedPrescription[]> => {
    try {
        const key = getStorageKey();
        const prescriptionsJson = localStorage.getItem(key);
        const prescriptions = prescriptionsJson ? JSON.parse(prescriptionsJson) as SavedPrescription[] : [];
        // Ordena por data (mais recente primeiro)
        return prescriptions.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    } catch (error) {
        console.error("Erro ao buscar prescrições do localStorage:", error);
        return []; // Retorna array vazio em caso de erro de parsing
    }
};

/**
 * Salva ou atualiza uma prescrição no localStorage.
 * @param prescription Os dados da prescrição a serem salvos.
 * @param id O ID da prescrição (se for uma atualização).
 * @returns Uma promessa que resolve para a prescrição salva com seu ID.
 */
export const savePrescription = async (prescription: PrescriptionToSave, id?: string): Promise<SavedPrescription> => {
    const key = getStorageKey();
    const savedPrescriptions = await getSavedPrescriptions();
    
    let prescriptionToSave: SavedPrescription;

    if (id) {
        // Atualiza uma prescrição existente
        const index = savedPrescriptions.findIndex(p => p.id === id);
        if (index === -1) {
            // Se não encontrar, adiciona como nova para evitar perda de dados
             prescriptionToSave = {
                ...prescription,
                id: id,
                savedAt: new Date().toISOString(),
            };
            savedPrescriptions.push(prescriptionToSave);
        } else {
            prescriptionToSave = {
                ...prescription,
                id: id,
                savedAt: new Date().toISOString(), // Atualiza a data de salvamento
            };
            savedPrescriptions[index] = prescriptionToSave;
        }
    } else {
        // Cria uma nova prescrição
        prescriptionToSave = {
            ...prescription,
            id: `presc-${new Date().getTime()}-${Math.random().toString(36).substring(2, 9)}`,
            savedAt: new Date().toISOString(),
        };
        savedPrescriptions.push(prescriptionToSave);
    }
    
    try {
        localStorage.setItem(key, JSON.stringify(savedPrescriptions));
        return prescriptionToSave;
    } catch (error) {
        console.error("Erro ao salvar prescrição no localStorage:", error);
        throw new Error("Não foi possível salvar os dados localmente.");
    }
};

/**
 * Deleta uma prescrição do localStorage.
 * @param id O ID da prescrição a ser deletada.
 */
export const deletePrescription = async (id: string): Promise<void> => {
    const key = getStorageKey();
    let savedPrescriptions = await getSavedPrescriptions();
    
    const updatedPrescriptions = savedPrescriptions.filter(p => p.id !== id);

    try {
        localStorage.setItem(key, JSON.stringify(updatedPrescriptions));
    } catch (error) {
        console.error("Erro ao deletar prescrição do localStorage:", error);
        throw new Error("Não foi possível deletar a prescrição localmente.");
    }
};