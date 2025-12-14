import { Employee, Material, Rig, Admin } from './types';

export const RIGS: Rig[] = [
  { id: 'S01', name: 'Sonda Alpha 01', location: 'Bacia de Campos' },
  { id: 'S02', name: 'Sonda Beta 02', location: 'Bacia de Santos' },
  { id: 'S03', name: 'Sonda Gamma 03', location: 'Onshore - Bahia' },
];

export const EMPLOYEES: Employee[] = [
  { id: 'MAT001', name: 'Carlos Silva', role: 'Torrista' },
  { id: 'MAT002', name: 'Ana Oliveira', role: 'Plataformista' },
  { id: 'MAT003', name: 'Roberto Santos', role: 'Sondador' },
  { id: 'MAT004', name: 'Fernanda Lima', role: 'Mecânico' },
  // Supervisores adicionados com senhas individuais iniciais
  { id: 'SUP001', name: 'Ricardo Mendes', role: 'Supervisor', password: 'prrecv' },
  { id: 'SUP002', name: 'Juliana Costa', role: 'Supervisor', password: 'prrecv' },
];

export const ADMINS: Admin[] = [
  { id: 'luantorres', name: 'Luan Torres', role: 'MASTER', password: '1905' },
  { id: 'almoxarife', name: 'Almoxarife Local', role: 'COMMON', password: 'user123' },
];

export const MATERIALS: Material[] = [
  { sku: 'EQP-001', description: 'Capacete de Segurança Classe B', unit: 'UN', category: 'EPI' },
  { sku: 'EQP-002', description: 'Luva de Vaqueta Mista', unit: 'PAR', category: 'EPI' },
  { sku: 'EQP-003', description: 'Óculos de Proteção Incolor', unit: 'UN', category: 'EPI' },
  { sku: 'MEC-101', description: 'Válvula de Esfera 2 pol', unit: 'UN', category: 'Mecânica' },
  { sku: 'MEC-102', description: 'Rolamento SKF 6205', unit: 'UN', category: 'Mecânica' },
  { sku: 'MEC-103', description: 'Graxa Litio Azul MP2', unit: 'KG', category: 'Lubrificantes' },
  { sku: 'ELE-201', description: 'Cabo Flexível 2.5mm Preto', unit: 'MT', category: 'Elétrica' },
  { sku: 'ELE-202', description: 'Disjuntor Tripolar 63A', unit: 'UN', category: 'Elétrica' },
  { sku: 'PER-301', description: 'Broca Tricônica 8 1/2', unit: 'UN', category: 'Perfuração' },
  { sku: 'PER-302', description: 'Fluido de Perfuração Bentonita', unit: 'SC', category: 'Químicos' },
];