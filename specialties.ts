
export interface Specialty {
    name: string;
    diagnoses: string[];
}

export const specialties: Specialty[] = [
    {
      name: "Cardiologia",
      diagnoses: [
        "Crise Hipertensiva",
        "Insuficiência Cardíaca Descompensada",
        "Fibrilação Atrial",
      ]
    },
    {
      name: "Pneumologia",
      diagnoses: [
        "Pneumonia Adquirida na Comunidade",
        "Asma Aguda",
        "DPOC Exacerbada",
      ]
    },
    {
      name: "Infectologia",
      diagnoses: [
          "Infecção do Trato Urinário",
          "Gastroenterite Aguda",
          "Sepse",
      ]
    },
    {
      name: "Psiquiatria",
      diagnoses: [
        "Transtorno Depressivo Maior",
        "Transtorno de Ansiedade Generalizada",
        "Esquizofrenia (manutenção)",
        "Transtorno do Pânico",
        "Transtorno Bipolar (fase de mania)",
      ]
    },
    {
      name: "Urgência e Emergência",
      diagnoses: [
        "Tromboembolismo Pulmonar",
        "Acidente Vascular Cerebral Isquêmico",
        "Choque Séptico",
        "Infarto Agudo do Miocárdio",
        "Cetoacidose Diabética",
      ]
    },
    {
      name: "Clínica Médica",
      diagnoses: [
        "Hipertensão Arterial Sistêmica",
        "Hipotireoidismo",
        "Doença do Refluxo Gastroesofágico",
        "Diabetes Mellitus Tipo 2",
        "Anemia Ferropriva",
      ]
    }
];
