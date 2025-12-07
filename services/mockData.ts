
import { Branch, Order, OrderStatus, User, UserRole } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 1,
    username: 'admin',
    role: UserRole.SUPER_ADMIN,
    full_name: 'المدير العام'
  },
  {
    id: 2,
    username: 'manager1',
    role: UserRole.BRANCH_MANAGER,
    full_name: 'مدير فرع القاهرة',
    branch_id: 1
  },
  {
    id: 3,
    username: 'manager2',
    role: UserRole.BRANCH_MANAGER,
    full_name: 'مدير فرع الإسكندرية',
    branch_id: 2
  }
];

export const MOCK_BRANCHES: Branch[] = [
  {
    id: 1,
    manager_id: 2,
    name: 'فرع القاهرة - وسط البلد',
    phone_contact: '01000000001',
    is_active: true,
    created_at: new Date().toISOString(),
    zones: [
      {
        name: 'Zone A (Close)',
        delivery_fee: 15.00,
        polygon: [[30.0444, 31.2357], [30.05, 31.24], [30.04, 31.24]]
      }
    ]
  },
  {
    id: 2,
    manager_id: 3,
    name: 'فرع الإسكندرية - سموحة',
    phone_contact: '01200000002',
    is_active: true,
    created_at: new Date().toISOString(),
    zones: []
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 1,
    branch_id: 1,
    customer_name: 'أحمد محمد',
    customer_phone: '01112223334',
    address_text: '15 شارع التحرير، القاهرة',
    items: [
      { name: 'برجر كلاسيك', qty: 2, price: 85 },
      { name: 'بطاطس مقلية', qty: 1, price: 30 }
    ],
    notes: 'بدون بصل من فضلك',
    subtotal: 200,
    delivery_fee: 15,
    total_price: 215,
    status: OrderStatus.PENDING,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 mins ago
  },
  {
    id: 2,
    branch_id: 1,
    customer_name: 'سارة علي',
    customer_phone: '01555555555',
    address_text: '10 شارع النيل، الزمالك',
    items: [
      { name: 'بيتزا مارجريتا', qty: 1, price: 120 },
      { name: 'بيبسي', qty: 2, price: 15 }
    ],
    subtotal: 150,
    delivery_fee: 20,
    total_price: 170,
    status: OrderStatus.ACCEPTED,
    created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    accepted_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  },
  {
    id: 3,
    branch_id: 2,
    customer_name: 'محمود حسن',
    customer_phone: '01222222222',
    address_text: 'سموحة، شارع 14',
    items: [
      { name: 'وجبة دجاج عائلية', qty: 1, price: 250 }
    ],
    subtotal: 250,
    delivery_fee: 25,
    total_price: 275,
    status: OrderStatus.IN_KITCHEN,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    accepted_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    in_kitchen_at: new Date(Date.now() - 1000 * 60 * 35).toISOString()
  }
];
