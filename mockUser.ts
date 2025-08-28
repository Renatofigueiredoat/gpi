import type { DoctorInfo, User } from '../types';

/**
 * Informações profissionais mockadas para um médico.
 * Usado para preencher dados na aplicação durante o modo de teste.
 */
export const mockDoctorInfo: DoctorInfo = {
    name: 'Dr(a). Usuário Teste',
    crm: 'CRM/SP 123456',
    // Workplace
    clinicName: 'UNIDADE UBS TESTE',
    clinicAddress: 'Rua de Teste, 123',
    clinicPhone: '11 4636-0000',
    clinicCityStateZip: 'CEP 08560-000 Teste-SP',
    // Emitter
    emitterNameLine1: 'SECRETARIA MUNICIPAL DA SAÚDE',
    emitterNameLine2: 'DE POÁ',
    emitterAddress: 'Rua Barão de Japurana, 43 - Tel. - 4636-2110',
    emitterCityState: 'Poá – São Paulo',
    emitterCnpj: 'CNPJ 55.021.455/0001-85'
};

/**
 * Objeto de usuário mockado.
 * Injetado no AuthContext para simular um login e pular a autenticação.
 */
export const mockUser: User = {
    id: 'mock-user-id-123',
    email: 'teste@gpi.com',
    doctorInfo: mockDoctorInfo,
};
