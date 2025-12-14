export interface Material {
  sku: string;
  description: string;
  unit: string;
  category: string;
}

export interface Employee {
  id: string; // Matrícula
  name: string;
  role: string;
  password?: string; // Senha pessoal (opcional, pois nem todos precisam de login)
}

export type AdminRole = 'MASTER' | 'COMMON';

export interface Admin {
  id: string; // Username ou ID
  name: string;
  role: AdminRole;
  password?: string;
}

export interface Rig {
  id: string;
  name: string;
  location: string;
}

export interface RequestItem {
  material: Material;
  quantity: number;
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface MaterialRequest {
  id: string;
  rigId: string;
  employeeId: string;
  supervisorId: string;
  items: RequestItem[];
  status: RequestStatus;
  createdAt: string;
  supervisorNote?: string;
}