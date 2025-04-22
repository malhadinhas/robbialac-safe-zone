import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  userId: mongoose.Types.ObjectId; // Ou string
  userName: string; // Guardar nome para exibição fácil
  itemId: mongoose.Types.ObjectId;
  itemType: 'qa' | 'accident' | 'sensibilizacao';
  text: string;
  createdAt: Date;
}

const CommentSchema: Schema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, // Referência ao usuário
    ref: 'User', 
    required: true 
  },
  userName: { // Denormalizado para evitar lookups constantes
    type: String,
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
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500 // Limitar tamanho do comentário
  }
}, {
  timestamps: { createdAt: true, updatedAt: false } // Apenas createdAt é relevante
});

// Índice para buscar comentários de um item rapidamente
CommentSchema.index({ itemId: 1, itemType: 1, createdAt: -1 });

export default mongoose.model<IComment>('Comment', CommentSchema); 