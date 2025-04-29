import mongoose, { Schema, Document } from 'mongoose';

// Interface TypeScript que define a estrutura de um documento de Departamento
export interface IDepartment extends Document {
  name: string;           // Nome do departamento
  description?: string;   // Descrição do departamento (opcional)
  active: boolean;        // Indica se o departamento está ativo ou não
  createdAt: Date;        // Data de criação do registo (gerado automaticamente)
  updatedAt: Date;        // Data da última atualização (gerado automaticamente)
}

// Definição do schema do Mongoose para Department
const DepartmentSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true,   // Campo obrigatório
    unique: true      // Nome do departamento deve ser único
  },
  description: { 
    type: String      // Campo opcional
  },
  active: {
    type: Boolean,
    default: true     // Por padrão, o departamento é criado como ativo
  }
}, {
  timestamps: true    // Isto adiciona automaticamente os campos createdAt e updatedAt
});

// Índices para melhorar a performance das consultas
DepartmentSchema.index({ name: 1 });    // Índice ascendente no nome (para buscas rápidas por nome)
DepartmentSchema.index({ active: 1 });  // Índice ascendente no estado ativo (para filtrar ativos/inativos)

// Exporta o modelo Department, pronto a ser usado nos controladores e serviços
export default mongoose.model<IDepartment>('Department', DepartmentSchema);

// -----------------------------------------------------------------------------
// Este ficheiro define o modelo de dados (schema e interface) para departamentos na base de dados MongoDB, usando o Mongoose.
// Permite guardar e consultar departamentos de forma tipada e validada.
// Garante unicidade do nome, datas automáticas e performance nas operações relacionadas a departamentos na aplicação. 