
import React, { useState, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, useParams, useNavigate, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { InventoryTable } from './components/InventoryTable';
import { TeamManagement } from './components/TeamManagement';
import { Property, InventoryItem, Category, Condition, GuestStay, Role, User } from './types';
import { analyzePropertyStatus } from './services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Templates for sections
const SECTION_TEMPLATES = {
  LIVING_ROOM: { name: 'Living Room', icon: '🛋️', items: [{ name: 'Sofa', category: Category.FURNISHINGS }, { name: 'TV Stand', category: Category.ELECTRONICS }, { name: 'Carpet/Rug', category: Category.FURNISHINGS }, { name: 'Coffee Table', category: Category.FURNISHINGS }, { name: 'Curtains (Set)', category: Category.FURNISHINGS }] },
  BEDROOM: { name: 'Bedroom', icon: '🛏️', items: [{ name: 'Bed Frame', category: Category.FURNISHINGS }, { name: 'Mattress', category: Category.FURNISHINGS }, { name: 'Pillows', category: Category.LINENS }, { name: 'Duvet Set', category: Category.LINENS }, { name: 'Nightstand', category: Category.FURNISHINGS }] },
  KITCHEN: { name: 'Kitchen', icon: '🍳', items: [{ name: 'Fridge/Freezer', category: Category.KITCHEN }, { name: 'Microwave', category: Category.KITCHEN }, { name: 'Stove/Cooktop', category: Category.KITCHEN }, { name: 'Kettle', category: Category.KITCHEN }, { name: 'Cutlery Set', category: Category.KITCHEN }] },
  BATHROOM: { name: 'Bathroom', icon: '🚿', items: [{ name: 'Shower Curtain', category: Category.BATHROOM }, { name: 'Bath Mat', category: Category.BATHROOM }, { name: 'Towel Set', category: Category.LINENS }, { name: 'Mirror', category: Category.FURNISHINGS }] },
  BALCONY: { name: 'Balcony', icon: '☀️', items: [{ name: 'Outdoor Table', category: Category.FURNISHINGS }, { name: 'Outdoor Chairs', category: Category.FURNISHINGS }, { name: 'Outdoor Lighting', category: Category.ELECTRONICS }, { name: 'Potted Plants', category: Category.OTHER }] },
  GARDEN: { name: 'Garden', icon: '🌿', items: [{ name: 'Garden Furniture Set', category: Category.FURNISHINGS }, { name: 'Watering System', category: Category.MAINTENANCE }, { name: 'Maintenance Tools', category: Category.MAINTENANCE }, { name: 'Outdoor Decor', category: Category.OTHER }] },
  LAUNDRY: { name: 'Laundry Room', icon: '🧺', items: [{ name: 'Washing Machine', category: Category.KITCHEN }, { name: 'Drying Rack', category: Category.MAINTENANCE }, { name: 'Iron & Board', category: Category.MAINTENANCE }] }
};

const INITIAL_PROPERTIES: Property[] = [{ id: 'p1', name: 'Downtown Penthouse', address: '123 Sky High Ave, Metro', location: 'Downtown', type: 'Penthouse', bedrooms: 2, thumbnail: 'https://picsum.photos/seed/pent/400/300', ownerName: 'Alex Rivers', ownerContact: '+1 555-0101', ownerEmail: 'alex@example.com', assignedEmployeeName: 'Marcus Chen', assignedEmployeeEmail: 'marcus@labriza.com' }];
const INITIAL_INVENTORY: InventoryItem[] = [{ id: 'i1', name: 'Nespresso Machine', room: 'Kitchen', category: Category.KITCHEN, quantity: 1, condition: Condition.EXCELLENT, lastChecked: new Date().toISOString(), propertyId: 'p1', notes: 'Includes 10 pods' }, { id: 'i2', name: 'Velvet Sofa', room: 'Living Room', category: Category.FURNISHINGS, quantity: 1, condition: Condition.GOOD, lastChecked: new Date().toISOString(), propertyId: 'p1', notes: 'Slight wear on left armrest' }];
const INITIAL_USERS: User[] = [
  { id: 'u1', firstName: 'Admin', lastName: 'User', email: 'admin@labriza.com', role: Role.ADMIN, status: 'Active' },
  { id: 'u2', firstName: 'Marcus', lastName: 'Chen', email: 'marcus@labriza.com', role: Role.MANAGER, status: 'Active' },
  { id: 'u3', firstName: 'Jane', lastName: 'Smith', email: 'jane@labriza.com', role: Role.AUDITOR, status: 'Invited' }
];

const DashboardPage: React.FC<{ inventory: InventoryItem[]; properties: Property[]; guestStays: GuestStay[] }> = ({ inventory, properties, guestStays }) => {
  const stats = useMemo(() => {
    const totalItems = inventory.reduce((acc, curr) => acc + curr.quantity, 0);
    const damagedItems = inventory.filter(i => i.condition === Condition.DAMAGED || i.condition === Condition.MISSING).length;
    const activeStays = guestStays.filter(s => new Date(s.checkOutDate) >= new Date()).length;
    const categoryDist = Object.values(Category).map(cat => ({ name: cat, value: inventory.filter(i => i.category === cat).reduce((acc, curr) => acc + curr.quantity, 0) }));
    return { totalItems, damagedItems, activeStays, categoryDist };
  }, [inventory, guestStays]);
  const COLORS = ['#003580', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];
  return (
    <div className="space-y-8">
      <header><h2 className="text-3xl font-bold text-slate-900">Dashboard</h2><p className="text-slate-500 mt-1">Portfolio overview for La Brisa Asset Management.</p></header>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><div className="text-slate-500 text-sm font-medium mb-2 uppercase tracking-wider">Owner Assets</div><div className="text-4xl font-bold text-slate-900">{properties.length}</div></div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><div className="text-slate-500 text-sm font-medium mb-2 uppercase tracking-wider">Active Guest Stays</div><div className="text-4xl font-bold text-labriza">{stats.activeStays}</div></div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><div className="text-slate-500 text-sm font-medium mb-2 uppercase tracking-wider">Total Items</div><div className="text-4xl font-bold text-slate-900">{stats.totalItems}</div></div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><div className="text-slate-500 text-sm font-medium mb-2 uppercase tracking-wider">Maintenance Alerts</div><div className="text-4xl font-bold text-rose-600">{stats.damagedItems}</div></div>
      </div>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100"><h3 className="text-lg font-bold text-slate-800 mb-6">Inventory Distribution</h3><div className="h-80 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={stats.categoryDist} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" /><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} /><Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>{stats.categoryDist.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></div></div>
    </div>
  );
};

const PropertiesPage: React.FC<{ properties: Property[]; onAdd: (p: any) => void; currentUser: User }> = ({ properties, onAdd, currentUser }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const canAdd = currentUser.role === Role.ADMIN || currentUser.role === Role.MANAGER;
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div><h2 className="text-3xl font-bold text-slate-900">Owner Assets</h2><p className="text-slate-500 mt-1">Manage physical inventory for property owners.</p></div>
        {canAdd && <button onClick={() => setIsModalOpen(true)} className="bg-labriza text-white px-5 py-2.5 rounded-lg font-semibold shadow-md shadow-blue-900/20 hover:opacity-90 transition-all flex items-center"><svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Asset Property</button>}
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map(p => (
          <div key={p.id} onClick={() => navigate(`/properties/${p.id}`)} className="group cursor-pointer bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"><div className="h-48 overflow-hidden relative border-b border-slate-50"><img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" /><div className="absolute top-4 left-4 bg-labriza text-white px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">{p.bedrooms} BR {p.type}</div></div><div className="p-6"><h4 className="text-xl font-bold text-slate-900 mb-1">{p.name}</h4><p className="text-slate-500 text-sm flex items-center mb-4"><svg className="w-4 h-4 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>{p.address}</p><div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-medium text-slate-400"><span>{p.ownerName}</span><span className="text-labriza font-bold">Manage Assets →</span></div></div></div>
        ))}
      </div>
    </div>
  );
};

const PropertyDetailPage: React.FC<{ properties: Property[]; inventory: InventoryItem[]; onUpdateInventory: any; onAddInventory: any; onDeleteInventory: any; onClearSection: any; currentUser: User; isGuestStay?: boolean; guestStay?: GuestStay; }> = ({ properties, inventory, onUpdateInventory, onAddInventory, onDeleteInventory, onClearSection, currentUser, isGuestStay, guestStay }) => {
  const { id } = useParams();
  const property = properties.find(p => p.id === (isGuestStay ? guestStay?.propertyId : id));
  const items = inventory.filter(i => isGuestStay ? i.guestStayId === guestStay?.id : (i.propertyId === id && !i.guestStayId));
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const today = new Date().toLocaleDateString();
  const canAdd = currentUser.role === Role.ADMIN || currentUser.role === Role.MANAGER;

  const handleDownloadPdf = () => { /* reuse previous PDF logic */ };

  const addFullSection = (templateKey: keyof typeof SECTION_TEMPLATES) => {
    if (!property) return;
    SECTION_TEMPLATES[templateKey].items.forEach(item => onAddInventory({ name: item.name, room: SECTION_TEMPLATES[templateKey].name, category: item.category, quantity: 1, condition: Condition.EXCELLENT, lastChecked: new Date().toISOString(), propertyId: property.id, guestStayId: isGuestStay ? guestStay?.id : undefined }));
  };

  if (!property) return <div>Data not found</div>;

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex-grow">
          <button onClick={() => window.history.back()} className="text-slate-400 hover:text-slate-600 mb-2 flex items-center text-sm font-medium">Back</button>
          <div className="flex items-center space-x-3 mb-1"><h2 className="text-3xl font-bold text-slate-900">{isGuestStay ? `Handover: ${guestStay?.guestName}` : property.name}</h2></div>
          <p className="text-slate-500 mb-4">{property.address}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 self-start"><button onClick={handleDownloadPdf} className="bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-lg font-bold hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm whitespace-nowrap">Export Handover PDF</button></div>
      </header>

      <InventoryTable items={items} onUpdate={onUpdateInventory} onDelete={onDeleteInventory} onClearSection={(room: string) => onClearSection(room, property.id, guestStay?.id)} userRole={currentUser.role} />

      {canAdd && (
        <div className="mt-10">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Add Units & Full Sections</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button onClick={() => addFullSection('BALCONY')} className="bg-labriza/5 border-2 border-labriza/20 p-4 rounded-xl text-labriza font-bold hover:bg-labriza/10 transition-all flex items-center justify-center group text-sm">Add Full Balcony</button>
            <button onClick={() => addFullSection('GARDEN')} className="bg-labriza/5 border-2 border-labriza/20 p-4 rounded-xl text-labriza font-bold hover:bg-labriza/10 transition-all flex items-center justify-center group text-sm">Add Full Garden</button>
            <button onClick={() => addFullSection('LAUNDRY')} className="bg-labriza/5 border-2 border-labriza/20 p-4 rounded-xl text-labriza font-bold hover:bg-labriza/10 transition-all flex items-center justify-center group text-sm">Add Laundry Room</button>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [guestStays, setGuestStays] = useState<GuestStay[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);

  const handleInviteUser = (user: Omit<User, 'id' | 'status'>) => {
    const newUser: User = { ...user, id: 'u' + Date.now(), status: 'Invited' };
    setUsers([...users, newUser]);
  };

  const handleUpdateUserRole = (id: string, role: Role) => {
    setUsers(users.map(u => u.id === id ? { ...u, role } : u));
    if (currentUser.id === id) setCurrentUser({ ...currentUser, role });
  };

  const handleDeleteUser = (id: string) => setUsers(users.filter(u => u.id !== id));

  const handleUpdateInventory = (id: string, updates: Partial<InventoryItem>) => setInventory(prev => prev.map(item => item.id === id ? { ...item, ...updates, lastChecked: new Date().toISOString() } : item));
  const handleAddInventory = (item: Omit<InventoryItem, 'id'>) => setInventory(prev => [...prev, { ...item, id: Math.random().toString(36).substr(2, 9) }]);
  const handleDeleteInventory = (id: string) => setInventory(prev => prev.filter(item => item.id !== id));
  const handleClearSection = (roomName: string, propId: string, stayId?: string) => setInventory(prev => prev.filter(item => !(item.propertyId === propId && (stayId ? item.guestStayId === stayId : !item.guestStayId) && item.room === roomName)));

  const handleAddGuestStay = (s: Omit<GuestStay, 'id'>) => {
    const stayId = 'stay' + Date.now();
    const stayItems = inventory.filter(i => i.propertyId === s.propertyId && !i.guestStayId).map(item => ({ ...item, id: Math.random().toString(36).substr(2, 9), guestStayId: stayId }));
    setGuestStays([...guestStays, { ...s, id: stayId }]);
    setInventory(prev => [...prev, ...stayItems]);
  };

  return (
    <Router>
      <Layout currentUser={currentUser} onSwitchRole={(r) => setCurrentUser(prev => ({...prev, role: r}))}>
        <Routes>
          <Route path="/" element={<DashboardPage inventory={inventory} properties={properties} guestStays={guestStays} />} />
          <Route path="/properties" element={<PropertiesPage properties={properties} onAdd={(p:any)=>setProperties([...properties, {...p, id:'p'+Date.now()}])} currentUser={currentUser} />} />
          <Route path="/properties/:id" element={<PropertyDetailPage properties={properties} inventory={inventory} onUpdateInventory={handleUpdateInventory} onAddInventory={handleAddInventory} onDeleteInventory={handleDeleteInventory} onClearSection={handleClearSection} currentUser={currentUser} />} />
          <Route path="/guest-stays" element={<div className="space-y-6"><h2 className="text-3xl font-bold">Guest Stays</h2>{guestStays.map(s=>(<div key={s.id} className="p-4 bg-white border rounded-lg mb-2">{s.guestName} - {s.checkInDate}</div>))}</div>} />
          <Route path="/team" element={currentUser.role === Role.ADMIN ? <TeamManagement users={users} onInvite={handleInviteUser} onDelete={handleDeleteUser} onUpdateRole={handleUpdateUserRole} /> : <Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
