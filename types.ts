
export enum Category {
  FURNISHINGS = 'Furnishings',
  KITCHEN = 'Kitchen Appliances',
  LINENS = 'Linens & Bedding',
  BATHROOM = 'Bathroom Essentials',
  ELECTRONICS = 'Electronics',
  MAINTENANCE = 'Maintenance/Cleaning',
  OTHER = 'Other'
}

export enum Condition {
  EXCELLENT = 'Excellent',
  GOOD = 'Good',
  WORN = 'Worn',
  DAMAGED = 'Damaged',
  MISSING = 'Missing'
}

export enum Role {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  AUDITOR = 'Auditor',
  VIEWER = 'Viewer'
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  status: 'Active' | 'Invited';
}

export interface InventoryItem {
  id: string;
  name: string;
  category: Category;
  room: string;
  quantity: number;
  condition: Condition;
  lastChecked: string;
  notes?: string;
  propertyId: string;
  guestStayId?: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  location: string;
  type: string;
  bedrooms: number;
  thumbnail: string;
  ownerName: string;
  ownerContact: string;
  ownerEmail: string;
  assignedEmployeeName: string;
  assignedEmployeeEmail: string;
}

export interface GuestStay {
  id: string;
  propertyId: string;
  guestName: string;
  guestContact: string;
  guestEmail: string;
  agreementDate: string;
  checkInDate: string;
  checkOutDate: string;
  notes: string;
  handoverEmployeeName: string;
  handoverEmployeeEmail: string;
}

export interface AppState {
  properties: Property[];
  inventory: InventoryItem[];
  guestStays: GuestStay[];
  users: User[];
  currentUser: User;
}
