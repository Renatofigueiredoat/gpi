
import React from 'react';
import type { PrescriptionGenerationData } from '../types';

interface SpecialPrescriptionOutputProps {
    data: PrescriptionGenerationData;
}

const PrescriptionVia: React.FC<{ data: PrescriptionGenerationData; via: '1ª VIA FARMÁCIA' | '2ª VIA PACIENTE' }> = ({ data, via }) => {
    const { doctor, patient, medicationsByRoute } = data;

    return (
        <div className="bg-white p-2 w-full max-w-2xl mx-auto text-black font-serif text-xs print:max-w-none">
            <div className="border border-black p-2">
                {/* Header */}
                <div className="border border-black text-center py-1">
                    <h1 className="font-bold tracking-widest text-sm">RECEITUÁRIO DE CONTROLE ESPECIAL</h1>
                </div>

                {/* Top Section */}
                <div className="flex justify-between mt-2 text-[10px] leading-tight">
                    {/* Emitter Info */}
                    <div className="border border-black p-2 w-[48%]">
                        <h2 className="text-center font-bold mb-1 text-xs">IDENTIFICAÇÃO DO EMITENTE</h2>
                        <div className="text-center space-y-px">
                            <p className="font-bold">{doctor.emitterNameLine1}</p>
                            <p className="font-bold">{doctor.emitterNameLine2}</p>
                            <p className="mt-2">{doctor.emitterAddress}</p>
                            <p>{doctor.emitterCityState}</p>
                            <p>{doctor.emitterCnpj}</p>
                        </div>
                    </div>
                    {/* Unit Info */}
                    <div className="w-[48%] flex flex-col justify-between items-end text-right">
                        <div className="space-y-px">
                            <p className="font-bold">{doctor.clinicName}</p>
                            <p>{doctor.clinicAddress} - Tel. - {doctor.clinicPhone}</p>
                            <p>{doctor.clinicCityStateZip}</p>
                        </div>
                        <div className="mt-2 text-xs font-bold">
                            {via === '1ª VIA FARMÁCIA' ? (
                                <>
                                    <p>1ª VIA FARMÁCIA</p>
                                    <p>2ª VIA PACIENTE</p>
                                </>
                            ) : (
                                <p>2ª VIA PACIENTE</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Patient Info */}
                <div className="mt-4 space-y-2 text-sm">
                    <p><span className="font-bold">Paciente:</span> {patient.name || '________________________________________________'}</p>
                    <p><span className="font-bold">Endereço:</span> {patient.address || '________________________________________________'}</p>
                </div>
                
                {/* Prescription Area */}
                <div className="min-h-[30rem] mt-2 px-2 text-sm">
                    {Object.entries(medicationsByRoute).map(([route, meds]) => (
                        <div key={route} className="mb-4">
                            <p className="font-bold underline">Uso {route}:</p>
                            {meds.map((med, index) => (
                                <div key={index} className="ml-4 mt-2 text-justify">
                                    <p className="font-bold">{index + 1}. {med.name} - {med.presentation}</p>
                                    <p className="pl-4">Uso: {med.posology}</p>
                                    <p className="pl-4">Quantidade: {med.quantity}</p>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Bottom Section */}
                <div className="flex text-xs">
                    {/* Buyer Info */}
                    <div className="border border-black p-2 w-1/2 min-h-[10rem]">
                        <h3 className="text-center font-bold">IDENTIFICAÇÃO DO COMPRADOR</h3>
                        <div className="space-y-2 mt-3 text-[10px] leading-relaxed">
                            <p>Nome:___________________________________</p>
                            <div className="flex justify-between">
                                <span>Identidade nº:________________</span>
                                <span className="pr-4">Órgão Emissor:______</span>
                            </div>
                            <p>End:____________________________________</p>
                            <p>Cidade:_____________________ UF:________</p>
                            <p>Telefone:_______________________________</p>
                        </div>
                    </div>
                    {/* Supplier Info */}
                    <div className="border border-black p-2 w-1/2 border-l-0 flex flex-col min-h-[10rem]">
                        <h3 className="text-center font-bold">IDENTIFICAÇÃO DO FORNECEDOR</h3>
                        <div className="mt-auto text-center text-[10px]">
                             <div className="border-b border-black mx-4 mb-1 h-8"></div>
                             <p>Ass. Do Farmacêutico</p>
                             <div className="mt-3">
                                <p className="tracking-widest">____/____/____</p>
                                <p>Data</p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const SpecialPrescriptionOutput: React.FC<SpecialPrescriptionOutputProps> = ({ data }) => {
    return (
        <div className="bg-slate-200 dark:bg-slate-900 p-4 print:p-0 print:bg-transparent">
             <div className="page-break-after-always">
                 <PrescriptionVia data={data} via="1ª VIA FARMÁCIA" />
             </div>
             <div>
                 <PrescriptionVia data={data} via="2ª VIA PACIENTE" />
             </div>
        </div>
    );
};

export default SpecialPrescriptionOutput;