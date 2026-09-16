// User management types for Firebase integration
export interface User {
  id: string // Firebase Auth UID - Primary key
  name: string // Required - User's full name
  email: string // Required, unique - Email for login (indexed)
  avatar_url?: string // Optional - Profile picture URL
  status: "active" | "inactive" // Required - Account status, default 'active'
  role?: string // Optional - Firebase profile role used by the admin guard
  permissions?: string[] // Optional - Firebase profile permissions used by the admin guard
  last_login_at?: string // Optional - Last login timestamp (ISO string)
  created_at: string // Required - Account creation timestamp
  updated_at: string // Required - Last update timestamp
}

// Extended user interface for admin management
export interface AdminUser extends User {
  role?: string // Optional - For display purposes, actual roles managed separately
  permissions?: string[] // Optional - For display purposes, actual permissions managed separately
}

// User creation data (without auto-generated fields)
export interface CreateUserData {
  name: string
  email: string
  avatar_url?: string
  status?: "active" | "inactive"
}

// User update data (partial fields)
export interface UpdateUserData {
  name?: string
  email?: string
  avatar_url?: string
  status?: "active" | "inactive"
  last_login_at?: string
}

// User statistics
export interface UserStats {
  total: number
  active: number
  inactive: number
  newThisMonth: number
}
