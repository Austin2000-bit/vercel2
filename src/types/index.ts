export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'helper' | 'student' | 'driver';
  created_at: string;
  updated_at: string;
  photo?: string;
  phone?: string;
  disability_type?: string;
  time_period?: 'full_year' | 'semester' | 'half_semester';
  status?: 'active' | 'completed' | 'inactive';
}

export interface HelperStudentAssignment {
  id?: string;
  helper_id: string;
  student_id: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface StudentHelpConfirmation {
  id?: string;
  student_id: string;
  helper_id: string;
  description?: string;
  date: string;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Complaint {
  id?: string;
  user_id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string;
  feedback?: string;
  followUp?: string;
}

export interface RideRequest {
  id?: string;
  student_id: string;
  driver_id?: string | null;
  pickup_location: string;
  destination: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
  estimatedTime?: string | number;
  student_name?: string;
  driver_name?: string;
}

export interface RideRequestWithDetails extends RideRequest {
  student_name?: string;
  driver_name?: string;
}

export interface Message {
  id?: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentOtp {
  id?: string;
  sessionId?: string;
  otp: string;
  timestamp: number;
  helperName: string;
  studentId: string;
  helperId: string;
}

export interface SystemLog {
  id?: string;
  type: string;
  message: string;
  userId?: string;
  userRole?: string;
  timestamp: number;
}

// Types needed for other parts of the application
export interface SignInRecord {
  id?: string;
  date: string;
  helper: string;
  timestamp: number;
}

export interface HelpConfirmation {
  id?: string;
  date: string;
  helper: string;
  student: string;
  description: string;
  timestamp: number;
}

export interface GadgetLoan {
  id: string;
  student_id: string;
  gadget_name: string;
  status: 'borrowed' | 'returned';
  borrowed_date: string;
  return_date?: string;
  full_name: string;
  reg_number: string;
  course: string;
  disability_type: string;
  gadget_types: string[];
  duration: string;
  created_at?: string;
  updated_at?: string;
}

export interface GadgetUsageLog {
  id?: string;
  gadget_loan_id: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  notes?: string;
  created_at: string;
}

export interface HelperStatusLog {
  id?: string;
  helper_id: string;
  status: 'available' | 'busy' | 'offline';
  changed_at: string;
  changed_by?: string;
  notes?: string;
}
