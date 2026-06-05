export interface Warehouse {
  id: number;
  name: string;
  address: string;
  manager_name: string;
  manager_phone: string;
  capacity: number;
}

export interface Material {
  id: number;
  code: string;
  name: string;
  category: string;
  specification?: string;
  unit: string;
  unit_price: number;
  warehouse_id: number;
  quantity: number;
  safety_stock: number;
  expiry_date?: string;
}

export interface InventoryRecord {
  id: number;
  record_type: string;
  order_no: string;
  warehouse_id: number;
  material_code: string;
  material_name: string;
  quantity: number;
  record_date: string;
  handler: string;
  department?: string;
  purpose?: string;
  created_at: string;
}

export interface TransferMaterial {
  id: number;
  transfer_order_id: number;
  material_code: string;
  material_name: string;
  quantity: number;
}

export interface TransferOrder {
  id: number;
  transfer_no: string;
  from_warehouse_id: number;
  to_warehouse_id: number;
  status: string;
  initiator: string;
  approver?: string;
  approval_time?: string;
  out_confirm_time?: string;
  in_confirm_time?: string;
  created_at: string;
  materials: TransferMaterial[];
}

export interface Alert {
  id: number;
  alert_type: string;
  severity: string;
  material_id: number;
  material_code: string;
  material_name: string;
  warehouse_id: number;
  warehouse_name: string;
  message: string;
  current_quantity?: number;
  safety_stock?: number;
  expiry_date?: string;
  is_handled: boolean;
  handle_result?: string;
  handled_at?: string;
  created_at: string;
}

export interface WarehouseStats {
  warehouse_id: number;
  warehouse_name: string;
  total_value: number;
  used_capacity: number;
  total_capacity: number;
  usage_rate: number;
}

export interface CategoryData {
  category: string;
  quantity: number;
}

export interface MonthlyFlow {
  month: string;
  total_in: number;
  total_out: number;
}

export interface ExpiringMaterial {
  id: number;
  code: string;
  name: string;
  category: string;
  quantity: number;
  expiry_date: string;
  days_to_expiry: number;
}

export interface TransferRate {
  total_transfers: number;
  completed_transfers: number;
  completion_rate: number;
}
