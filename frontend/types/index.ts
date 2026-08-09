export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER';
  createdAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  startDate?: string;
  endDate?: string;
  createdAt: string;
  managerId: string;
  manager: User;
  members: ProjectMember[];
  tasks: Task[];
  _count?: {
    tasks: number;
    members: number;
  };
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: 'MEMBER' | 'LEAD';
  joinedAt: string;
  user: User;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
  createdAt: string;
  projectId: string;
  assigneeId: string;
  assignee: User;
  comments?: TaskComment[];
}

export interface TaskComment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user: User;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  role?: 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER';
}