import mongoose, { Schema, Document } from 'mongoose';

export interface ILike extends Document {
  userId: mongoose.Types.ObjectId; // Ou string, dependendo de como os IDs de usuário são armazenados
  itemId: mongoose.Types.ObjectId; // ID do item (QA, Acidente, Sensibilizacao)
  itemType: 'qa' | 'accident' | 'sensibilizacao'; // Tipo do item
  createdAt: Date;
}

const LikeSchema: Schema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, // Referência ao usuário (ajustar se ID for string)
    ref: 'User', // Assumindo que existe um modelo User
    required: true 
  },
  itemId: { 
    type: Schema.Types.ObjectId, 
    required: true 
  },
  itemType: {
    type: String,
    required: true,
    enum: ['qa', 'accident', 'sensibilizacao']
  },
}, {
  timestamps: { createdAt: true, updatedAt: false } // Apenas createdAt é relevante
});

// Índice composto para garantir que um usuário só possa gostar de um item uma vez
LikeSchema.index({ userId: 1, itemId: 1, itemType: 1 }, { unique: true });
// Índices para buscas comuns
LikeSchema.index({ itemId: 1, itemType: 1 });

export default mongoose.model<ILike>('Like', LikeSchema); 