import mongoose, { Schema, Document } from 'mongoose';

// Interface TypeScript que define a estrutura de um documento de Comentário
export interface IComment extends Document {
  userId: mongoose.Types.ObjectId; // ID do utilizador que fez o comentário (pode ser string)
  userName: string;                // Nome do utilizador (guardado para exibição rápida)
  itemId: mongoose.Types.ObjectId;  // ID do item comentado (pode ser QA, acidente, sensibilização)
  itemType: 'qa' | 'accident' | 'sensibilizacao'; // Tipo do item comentado
  text: string;                     // Texto do comentário
  createdAt: Date;                  // Data de criação do comentário
}

// Definição do schema do Mongoose para Comment
const CommentSchema: Schema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, // Referência ao utilizador (User)
    ref: 'User', 
    required: true 
  },
  userName: { // Nome do utilizador guardado diretamente (denormalizado)
    type: String,
    required: true
  },
  itemId: { 
    type: Schema.Types.ObjectId, // Referência ao item comentado
    required: true 
  },
  itemType: {
    type: String,
    required: true,
    enum: ['qa', 'accident', 'sensibilizacao'] // Só permite estes tipos
  },
  text: {
    type: String,
    required: true,
    trim: true,      // Remove espaços em branco no início/fim
    maxlength: 500   // Limita o tamanho do comentário
  }
}, {
  timestamps: { createdAt: true, updatedAt: false } // Só guarda createdAt, não updatedAt
});

// Índice para buscar comentários de um item rapidamente (por itemId, itemType e data)
CommentSchema.index({ itemId: 1, itemType: 1, createdAt: -1 });

// Exporta o modelo Comment, pronto a ser usado nos controladores e serviços
export default mongoose.model<IComment>('Comment', CommentSchema);

// -----------------------------------------------------------------------------
// Este ficheiro define o modelo de dados (schema e interface) para comentários na base de dados MongoDB, usando o Mongoose.
// Permite guardar e consultar comentários de forma tipada e validada.
// Garante consistência e performance nas operações relacionadas a comentários na aplicação. 