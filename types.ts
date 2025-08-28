
export interface Medication {
  id: string;
  name: string;
  presentation: string;
  dosage: string;
  route: string;
  frequency: string;
  observations: string;
  adjustments: {
    renal: string;
    hepatic: string;
  };
}

export interface PrescriptionTemplate {
  diagnosis: string;
  protocolSource: string;
  medications: Medication[];
}

export interface Interaction {
  drugs: string[];
  description: string;
  recommendation: string;
  riskLevel: 'A' | 'B' | 'C' | 'D';
}

export interface InteractionCheckResult {
    interactions: Interaction[];
}

// Represents an item in the prescription being built by the user
export interface PrescriptionItem extends Medication {
  selected: boolean;
  customPosology: string;
  quantity: string;
  isCustom?: boolean;
}

export interface DoctorInfo {
    name: string;
    crm: string;

    // Primary Workplace Info (used for simple prescriptions and 'Unidade' on special ones)
    clinicName: string;
    clinicAddress: string;
    clinicPhone: string;
    clinicCityStateZip: string;

    // Emitter Info (for the "Emitente" box on special prescriptions)
    emitterNameLine1: string; // e.g., "SECRETARIA MUNICIPAL DA SAÚDE"
    emitterNameLine2: string; // e.g., "DE POÁ"
    emitterAddress: string;   // e.g., "Rua Barão de Japurana, 43 - Tel. - 4636-2110"
    emitterCityState: string; // e.g., "Poá – São Paulo"
    emitterCnpj: string;      // e.g., "CNPJ 55.021.455/0001-85"
}


export interface PatientInfo {
    name: string;
    document: string;
    address: string;
}

// Represents a Workplace/Health Facility
export interface Workplace {
    id: string;
    name: string;
}

// Data structure for saving a prescription to local storage
export interface PrescriptionToSave {
    customName: string;
    diagnosis: string;
    protocolSource: string;
    items: PrescriptionItem[];
    doctorInfo: DoctorInfo;
    patientInfo: PatientInfo;
    workplaceId?: string;
    workplaceName?: string;
}

export interface SavedPrescription extends PrescriptionToSave {
    id: string;
    savedAt: string;
}

export interface PrescriptionGenerationData {
    prescriptionType: 'Receita Simples' | 'Receita de Controle Especial';
    context: 'Ambulatorial' | 'Hospitalar';
    issueDate: string;
    patient: PatientInfo;
    doctor: DoctorInfo;
    medicationsByRoute: {
        [route: string]: {
            name: string;
            presentation: string;
            posology: string;
            quantity: string;
        }[];
    };
}

// Represents a logged-in user
export interface User {
    id: string;
    email: string;
    doctorInfo: DoctorInfo;
}

// Represents a source from Google Search grounding
export interface GroundingSource {
    uri: string;
    title: string;
}

// Represents the result from the clinical calculator
export interface ClinicalCalculationResult {
    score: string;
    interpretation: string;
    formula: string;
}

// Represents a medication from the local data for autocomplete
export interface MedicationData {
    productName: string;
    activeIngredient: string;
}

// Represents drug information from the openFDA API
export interface FdaDrugInfo {
    indications_and_usage?: string[];
    warnings?: string[];
    dosage_and_administration?: string[];
    generic_name?: string;
}
