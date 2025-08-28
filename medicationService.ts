
import { medications, type MedicationData } from '../data/medications';

/**
 * Searches for medications based on a query string.
 * The search is case-insensitive and checks both product name and active ingredient.
 * @param query The search term.
 * @returns An array of matching MedicationData, limited to 10 results.
 */
export const searchMedications = (query: string): MedicationData[] => {
    if (!query || query.length < 3) {
        return [];
    }

    const lowerCaseQuery = query.toLowerCase();
    const results: MedicationData[] = [];

    for (const med of medications) {
        if (results.length >= 10) {
            break;
        }

        const productNameMatch = med.productName.toLowerCase().includes(lowerCaseQuery);
        const activeIngredientMatch = med.activeIngredient.toLowerCase().includes(lowerCaseQuery);

        if (productNameMatch || activeIngredientMatch) {
            results.push(med);
        }
    }

    return results;
};
