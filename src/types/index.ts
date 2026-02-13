export type AppRole = 'WORKER' | 'DEPARTMENT_ADMIN' | 'ESTABLISHMENT_ADMIN';

export interface UserContext {
    authUserId: string;
    role: AppRole;
    workerId?: string;
    establishmentId?: string;
    departmentId?: string;
    fullName?: string;
    email?: string;
    district?: string;
}

export interface WorkerProfile {
    id: string;
    worker_id: string;
    first_name: string;
    last_name: string;
    aadhaar_last_four?: string;
    phone?: string;
    email?: string;
    date_of_birth?: string;
    gender?: string;
    address_line?: string;
    district?: string;
    state?: string;
    photo_url?: string;
    status?: string;
    job_role?: string;
    designation?: string;
    identifiers?: WorkerIdentifier[];
    family_members?: FamilyMember[];
    documents?: WorkerDocument[];
}

export interface FamilyMember {
    name: string;
    relation: string;
    dob?: string;
    is_health_covered: boolean;
}

export interface WorkerDocument {
    title: string;
    type: string; // 'ID Proof', 'Address Proof'
    uploaded_on: string;
    url: string;
}

export interface WorkerIdentifier {
    label: string;
    value: string;
    type: 'WID' | 'ES' | 'BO' | 'ESI' | 'PF' | 'MG' | 'TU';
}

export interface AttendanceRecord {
    id: string;
    attendance_date: string;
    first_checkin_at?: string;
    last_checkout_at?: string;
    total_hours?: number;
    status: 'PRESENT' | 'ABSENT' | 'PARTIAL';
    establishment_name?: string;
    department_name?: string;
}

export interface Scheme {
    id: number;
    name: string;
    type: 'Central' | 'State' | 'Welfare Board';
    status: 'Eligible' | 'Applied' | 'Active' | 'Pending Verification';
    description: string;
    benefit_type: string;
    benefit_value?: string;
    tags: string[];
}

export interface Grievance {
    id: string;
    category: string;
    status: 'Submitted' | 'In Progress' | 'Resolved';
    subject: string;
    description: string;
    created_at: string;
    sla_date?: string;
}

export interface HealthRecord {
    date: string;
    type: string;
    doctor: string;
    status: string;
    notes?: string;
    member_name: string;
    member_relation: string;
    hospital: string;
    city: string;
    cost?: string;
    govt_paid?: string;
    category: string;
    insurance_type: string;
}
