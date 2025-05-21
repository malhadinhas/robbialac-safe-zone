import mongoose, { Document, Schema } from 'mongoose';

// Interface TypeScript que define a estrutura de um documento de Sensibilização
export interface ISensibilizacao extends Document {
  name: string;                // Nome do documento de sensibilização
  country: string;             // País associado ao documento
  date: Date;                  // Data do documento
  pdfFile: {                   // Informação sobre o ficheiro PDF associado
    key: string;               // Chave/ID do ficheiro (ex: no storage)
    originalName: string;      // Nome original do ficheiro
    size: number;              // Tamanho do ficheiro em bytes
    mimeType: string;          // Tipo MIME do ficheiro
  };
  createdAt: Date;             // Data de criação do registo (gerado automaticamente)
  updatedAt: Date;             // Data da última atualização (gerado automaticamente)
}

// Definição do schema do Mongoose para Sensibilização
const SensibilizacaoSchema: Schema = new Schema({
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
  pdfFile: {                 // Subdocumento para ficheiro PDF
    key: { type: String },
    originalName: { type: String },
    size: { type: Number },
    mimeType: { type: String }
  }
}, {
  timestamps: true // Isto adiciona automaticamente os campos createdAt e updatedAt
});

// Índice para melhorar a performance das consultas por data
SensibilizacaoSchema.index({ date: -1 });

// Exporta o modelo Sensibilizacao, pronto a ser usado nos controladores e serviços
export default mongoose.model<ISensibilizacao>('Sensibilizacao', SensibilizacaoSchema);

// -----------------------------------------------------------------------------
// Este ficheiro define o modelo de dados (schema e interface) para documentos de sensibilização na base de dados MongoDB, usando o Mongoose.
// Permite guardar e consultar documentos de sensibilização de forma tipada e validada.
// Garante consistência e performance nas operações relacionadas a estes documentos na aplicação. 