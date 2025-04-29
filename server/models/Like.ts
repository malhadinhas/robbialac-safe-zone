import mongoose, { Schema, Document } from 'mongoose'; // Importa o mongoose e tipos auxiliares

// Interface TypeScript que define a estrutura de um documento de Like (gosto)
export interface ILike extends Document {
  userId: mongoose.Types.ObjectId; // ID do utilizador que fez o like (pode ser string, depende do projeto)
  itemId: mongoose.Types.ObjectId; // ID do item gostado (QA, Acidente, Sensibilização)
  itemType: 'qa' | 'accident' | 'sensibilizacao'; // Tipo do item gostado
  createdAt: Date; // Data em que o like foi feito
}

// Definição do schema do Mongoose para Like
const LikeSchema: Schema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, // Referência ao utilizador (User)
    ref: 'User', // Assume que existe um modelo User
    required: true 
  },
  itemId: { 
    type: Schema.Types.ObjectId, // Referência ao item gostado
    required: true 
  },
  itemType: {
    type: String,
    required: true,
    enum: ['qa', 'accident', 'sensibilizacao'] // Só permite estes tipos de item
  },
}, {
  timestamps: { createdAt: true, updatedAt: false } // Só guarda createdAt, não updatedAt
});

// Índice composto para garantir que um utilizador só possa gostar de um item uma vez
LikeSchema.index({ userId: 1, itemId: 1, itemType: 1 }, { unique: true });
// Índice para buscas rápidas por item
LikeSchema.index({ itemId: 1, itemType: 1 });

// Exporta o modelo Like, pronto a ser usado nos controladores e serviços
export default mongoose.model<ILike>('Like', LikeSchema);

// -----------------------------------------------------------------------------
// Este ficheiro define o modelo de dados (schema e interface) para likes (gostos) na base de dados MongoDB, usando o Mongoose.
// Permite guardar e consultar likes de forma tipada e validada.
// Garante unicidade (um utilizador só pode gostar de um item uma vez) e performance nas operações relacionadas a gostos na aplicação. 