export const restaurant = {
  name: 'Café Admin',
  tagline: 'Restaurant Management',
  gstin: '29ABCDE1234F1Z5',
  address: '12 Brew Street, Indiranagar, Bengaluru 560038',
  phone: '+91 80 4123 7788',
  gstRate: 0.05,
};

export const user = {
  name: 'Admin User',
  role: 'Manager',
  initials: 'AD',
};

export const users = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    name: 'Admin User',
    role: 'Manager',
    initials: 'AD',
  },
  {
    id: '2',
    username: 'cashier',
    password: 'cashier123',
    name: 'Riya Sharma',
    role: 'Cashier',
    initials: 'RS',
  },
];

export const categories = ['Coffee', 'Bakery', 'Salads', 'Sandwiches', 'Beverages'];

export const menuItems = [
  { id: '1', name: 'Espresso', category: 'Coffee', price: 120, available: true, addons: 3 },
  { id: '2', name: 'Cappuccino', category: 'Coffee', price: 150, available: true, addons: 5 },
  { id: '3', name: 'Latte', category: 'Coffee', price: 160, available: true, addons: 4 },
  { id: '4', name: 'Croissant', category: 'Bakery', price: 80, available: true, addons: 2 },
  { id: '5', name: 'Blueberry Muffin', category: 'Bakery', price: 90, available: false, addons: 1 },
  { id: '6', name: 'Caesar Salad', category: 'Salads', price: 280, available: true, addons: 3 },
];

export const addons = [
  { id: '1', name: 'Extra Shot', price: 30, linkedDishes: ['Espresso', 'Cappuccino', 'Latte'] },
  { id: '2', name: 'Almond Milk', price: 40, linkedDishes: ['Cappuccino', 'Latte'] },
  { id: '3', name: 'Caramel Syrup', price: 25, linkedDishes: ['Latte', 'Cappuccino'] },
  { id: '4', name: 'Whipped Cream', price: 35, linkedDishes: ['Cappuccino', 'Latte'] },
  { id: '5', name: 'Vanilla Extract', price: 20, linkedDishes: ['Latte'] },
  { id: '6', name: 'Cinnamon Powder', price: 15, linkedDishes: ['Cappuccino', 'Espresso'] },
  { id: '7', name: 'Chocolate Drizzle', price: 30, linkedDishes: ['Cappuccino', 'Latte'] },
  { id: '8', name: 'Oat Milk', price: 45, linkedDishes: ['Cappuccino', 'Latte'] },
];

export const orders = [
  {
    id: '1',
    orderNo: '#001',
    table: 'T-05',
    time: '11:25 AM',
    date: '06 Nov 2025',
    status: 'new',
    items: [
      { name: 'Cappuccino', quantity: 2, addons: ['Extra Shot', 'Almond Milk'] },
      { name: 'Croissant', quantity: 1 },
    ],
    notes: 'Less sugar',
  },
  {
    id: '2',
    orderNo: '#002',
    table: 'T-12',
    time: '11:18 AM',
    date: '06 Nov 2025',
    status: 'new',
    items: [
      { name: 'Latte', quantity: 1, addons: ['Caramel Syrup'] },
      { name: 'Caesar Salad', quantity: 2 },
    ],
  },
  {
    id: '3',
    orderNo: '#003',
    table: 'T-03',
    time: '11:10 AM',
    date: '06 Nov 2025',
    status: 'new',
    items: [
      { name: 'Espresso', quantity: 3 },
      { name: 'Croissant', quantity: 3 },
    ],
  },
  {
    id: '4',
    orderNo: '#004',
    table: 'T-18',
    time: '11:05 AM',
    date: '06 Nov 2025',
    status: 'new',
    items: [
      { name: 'Cappuccino', quantity: 2 },
      { name: 'Caesar Salad', quantity: 1 },
    ],
  },
  {
    id: '5',
    orderNo: '#005',
    table: 'T-22',
    time: '11:20 AM',
    date: '06 Nov 2025',
    status: 'kot-printed',
    items: [
      { name: 'Latte', quantity: 1 },
      { name: 'Blueberry Muffin', quantity: 2 },
    ],
  },
  {
    id: '6',
    orderNo: '#006',
    table: 'T-14',
    time: '11:15 AM',
    date: '06 Nov 2025',
    status: 'kot-printed',
    items: [
      { name: 'Espresso', quantity: 2 },
      { name: 'Croissant', quantity: 2 },
    ],
  },
  {
    id: '7',
    orderNo: '#007',
    table: 'T-09',
    time: '11:08 AM',
    date: '06 Nov 2025',
    status: 'kot-printed',
    items: [
      { name: 'Caesar Salad', quantity: 1 },
      { name: 'Cappuccino', quantity: 1 },
    ],
  },
  {
    id: '8',
    orderNo: '#008',
    table: 'T-21',
    time: '10:55 AM',
    date: '06 Nov 2025',
    status: 'served',
    items: [
      { name: 'Latte', quantity: 2 },
      { name: 'Croissant', quantity: 2 },
    ],
  },
  {
    id: '9',
    orderNo: '#009',
    table: 'T-15',
    time: '10:50 AM',
    date: '06 Nov 2025',
    status: 'served',
    items: [{ name: 'Cappuccino', quantity: 1 }],
  },
];

export const tables = [
  { id: '1', number: 'T-01', capacity: 2, status: 'occupied', currentOrder: '#003' },
  { id: '2', number: 'T-02', capacity: 4, status: 'vacant' },
  { id: '3', number: 'T-03', capacity: 4, status: 'bill-pending', currentOrder: '#005' },
  { id: '4', number: 'T-04', capacity: 2, status: 'vacant' },
  { id: '5', number: 'T-05', capacity: 6, status: 'occupied', currentOrder: '#001' },
  { id: '6', number: 'T-06', capacity: 4, status: 'reserved' },
  { id: '7', number: 'T-07', capacity: 2, status: 'vacant' },
  { id: '8', number: 'T-08', capacity: 8, status: 'occupied', currentOrder: '#008' },
  { id: '9', number: 'T-09', capacity: 4, status: 'vacant' },
  { id: '10', number: 'T-10', capacity: 2, status: 'reserved' },
  { id: '11', number: 'T-11', capacity: 4, status: 'vacant' },
  { id: '12', number: 'T-12', capacity: 6, status: 'bill-pending', currentOrder: '#002' },
];

export const orderHistory = [
  { id: '1', orderNo: '#048', table: 'T-12', date: '06 Nov 2025', time: '10:45 AM', status: 'completed', totalAmount: 850, paymentMode: 'upi', items: 5 },
  { id: '2', orderNo: '#047', table: 'T-05', date: '06 Nov 2025', time: '10:30 AM', status: 'completed', totalAmount: 320, paymentMode: 'cash', items: 2 },
  { id: '3', orderNo: '#046', table: 'T-18', date: '06 Nov 2025', time: '10:15 AM', status: 'completed', totalAmount: 1250, paymentMode: 'card', items: 7 },
  { id: '4', orderNo: '#045', table: 'T-03', date: '06 Nov 2025', time: '10:00 AM', status: 'cancelled', totalAmount: 0, paymentMode: 'cash', items: 3 },
  { id: '5', orderNo: '#044', table: 'T-09', date: '06 Nov 2025', time: '09:45 AM', status: 'completed', totalAmount: 680, paymentMode: 'upi', items: 4 },
  { id: '6', orderNo: '#043', table: 'T-22', date: '05 Nov 2025', time: '08:30 PM', status: 'completed', totalAmount: 1450, paymentMode: 'card', items: 6 },
  { id: '7', orderNo: '#042', table: 'T-14', date: '05 Nov 2025', time: '08:15 PM', status: 'completed', totalAmount: 590, paymentMode: 'cash', items: 3 },
  { id: '8', orderNo: '#041', table: 'T-07', date: '05 Nov 2025', time: '07:50 PM', status: 'completed', totalAmount: 420, paymentMode: 'upi', items: 2 },
];

export const dashboard = {
  businessDate: 'Thursday, November 6, 2025',
  businessTime: '11:30 AM',
  stats: [
    { id: 'orders', label: 'Total Orders Today', value: '48', delta: '+12%', tone: 'positive', icon: 'clipboard' },
    { id: 'tables', label: 'Active Tables', value: '12/25', delta: '48% occupied', tone: 'positive', icon: 'users' },
    { id: 'kot', label: 'Pending KOT', value: '5', delta: '2 urgent', tone: 'positive', icon: 'clock' },
    { id: 'revenue', label: 'Revenue Today', value: '₹18,450', delta: '+8.5%', tone: 'positive', icon: 'rupee' },
  ],
  latestOrders: [
    { id: '1', orderNo: '#001', table: 'T-05', items: 3, placedAgo: '2 min ago', status: 'new' },
    { id: '2', orderNo: '#002', table: 'T-12', items: 5, placedAgo: '8 min ago', status: 'kot-printed' },
    { id: '3', orderNo: '#003', table: 'T-03', items: 2, placedAgo: '15 min ago', status: 'served' },
    { id: '4', orderNo: '#004', table: 'T-18', items: 4, placedAgo: '18 min ago', status: 'kot-printed' },
    { id: '5', orderNo: '#005', table: 'T-09', items: 3, placedAgo: '22 min ago', status: 'new' },
  ],
};
