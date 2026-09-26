// Static demo content shown until the UI is connected to the StockSense API.
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Bell,
  Box,
  ClipboardList,
  Gauge,
  PackageCheck,
  SlidersHorizontal,
} from 'lucide-react';

export const operations = [
  {
    id: 'WH/IN/00042',
    type: 'Receipt',
    partner: 'Steel supplier',
    items: 'Steel Rods · 50 kg',
    status: 'Ready',
    date: 'Today, 09:42',
    tone: 'green',
    icon: ArrowDownToLine,
  },
  {
    id: 'WH/OUT/00018',
    type: 'Delivery',
    partner: 'Customer order',
    items: 'Cement Bags · 120 units',
    status: 'Waiting',
    date: 'Today, 08:17',
    tone: 'amber',
    icon: ArrowUpFromLine,
  },
  {
    id: 'WH/TR/00031',
    type: 'Internal',
    partner: 'Main Store → Production',
    items: 'Aluminium Sheets · 18',
    status: 'Done',
    date: 'Yesterday, 16:25',
    tone: 'blue',
    icon: ArrowLeftRight,
  },
  {
    id: 'WH/ADJ/00009',
    type: 'Adjustment',
    partner: 'Cycle count · Aisle 04',
    items: 'Safety Gloves · -12',
    status: 'Draft',
    date: 'Yesterday, 13:08',
    tone: 'purple',
    icon: SlidersHorizontal,
  },
  {
    id: 'WH/OUT/00017',
    type: 'Delivery',
    partner: 'Customer order',
    items: 'Oak Panels · 24 units',
    status: 'Ready',
    date: 'Sep 24, 11:36',
    tone: 'amber',
    icon: ArrowUpFromLine,
  },
];

export const operationStatuses = ['Ready', 'Waiting', 'Done', 'Draft'];

export const stock = [
  {
    name: 'Steel Rods',
    sku: 'STL-ROD-08',
    category: 'Raw materials',
    location: 'Main Warehouse',
    qty: 842,
    unit: 'kg',
    threshold: 250,
    color: 'coral',
  },
  {
    name: 'Cement Bags',
    sku: 'CEM-50KG',
    category: 'Raw materials',
    location: 'Main Warehouse',
    qty: 124,
    unit: 'units',
    threshold: 160,
    color: 'yellow',
  },
  {
    name: 'Oak Panels',
    sku: 'OAK-PNL-12',
    category: 'Finished goods',
    location: 'Production Floor',
    qty: 36,
    unit: 'units',
    threshold: 40,
    color: 'green',
  },
  {
    name: 'Safety Gloves',
    sku: 'SAFE-GLV-M',
    category: 'Consumables',
    location: 'Main Warehouse',
    qty: 18,
    unit: 'pairs',
    threshold: 50,
    color: 'blue',
  },
];

export const kpis = [
  {
    label: 'Total stock value',
    value: '₹2,84,680',
    detail: '+8.2%',
    note: 'vs last month',
    icon: PackageCheck,
    tone: 'teal',
  },
  {
    label: 'Items in stock',
    value: '12,486',
    detail: '+342',
    note: 'this week',
    icon: Box,
    tone: 'coral',
  },
  {
    label: 'Low / out of stock',
    value: '18',
    detail: '4 critical',
    note: 'needs attention',
    icon: Bell,
    tone: 'yellow',
    alert: true,
  },
  {
    label: 'Open operations',
    value: '24',
    detail: '7 due today',
    note: 'across all types',
    icon: ClipboardList,
    tone: 'blue',
  },
];

export const warehouses = ['All warehouses', 'Main Warehouse', 'Production Floor'];

export const navGroups = [
  {
    label: 'Workspace',
    links: [
      { label: 'Overview', icon: Gauge },
      { label: 'Products', icon: Box },
    ],
  },
  {
    label: 'Operations',
    links: [
      { label: 'Receipts', icon: ArrowDownToLine, count: 3 },
      { label: 'Delivery orders', icon: ArrowUpFromLine, count: 2 },
      { label: 'Internal transfers', icon: ArrowLeftRight },
      { label: 'Adjustments', icon: SlidersHorizontal },
      { label: 'Stock ledger', icon: ClipboardList },
    ],
  },
];
