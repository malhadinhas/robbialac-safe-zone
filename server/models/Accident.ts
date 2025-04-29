import mongoose, { Schema, Document } from 'mongoose';

// Interface TypeScript que define a estrutura de um documento de Acidente
export interface IAccident extends Document {
  name: string;                // Nome do acidente ou título do registo
  country: string;             // País onde ocorreu o acidente
  date: Date;                  // Data do acidente
  pdfFile?: {                  // Informação sobre o ficheiro PDF associado (opcional)
    key: string;               // Chave/ID do ficheiro (ex: no storage)
    originalName: string;      // Nome original do ficheiro
    size: number;              // Tamanho do ficheiro em bytes
    mimeType: string;          // Tipo MIME do ficheiro
  };
  createdAt: Date;             // Data de criação do registo (gerado automaticamente)
  updatedAt: Date;             // Data da última atualização (gerado automaticamente)
}

// Definição do schema do Mongoose para Accident
const AccidentSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true           // Campo obrigatório
  },
  country: { 
    type: String, 
    required: true           // Campo obrigatório
  },
  date: { 
    type: Date, 
    required: true           // Campo obrigatório
  },
  pdfFile: {                 // Subdocumento para ficheiro PDF (opcional)
    key: { type: String },
    originalName: { type: String },
    size: { type: Number },
    mimeType: { type: String }
  }
}, {
  timestamps: true // Isto adiciona automaticamente os campos createdAt e updatedAt
});

// Índices para melhorar a performance das consultas
AccidentSchema.index({ date: -1 });     // Índice descendente na data (para ordenar por data mais recente)
AccidentSchema.index({ country: 1 });   // Índice ascendente no país (para filtrar por país)

// Exporta o modelo Accident, pronto a ser usado nos controladores e serviços
export default mongoose.model<IAccident>('Accident', AccidentSchema);

// -----------------------------------------------------------------------------
// Este ficheiro define o modelo de dados (schema e interface) para acidentes na base de dados MongoDB, usando o Mongoose.
// Permite guardar e consultar acidentes de forma tipada e validada.
// Garante consistência e performance nas operações relacionadas a acidentes na aplicação. 