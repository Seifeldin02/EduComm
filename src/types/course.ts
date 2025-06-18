export interface Course {
  id: string;
  name: string;
  description: string;
  courseCode?: string | null;
  createdBy: string;
  createdAt: string;
  students: string[];
  isActive: boolean;
  lecturerName?: string;
  lecturerEmail?: string;
  lecturer?: {
    uid: string;
    name: string;
    email: string;
  };
  studentsInfo?: Array<{
    uid: string;
    name: string;
    email: string;
  }>;
  isLecturer?: boolean;
  studentCount?: number;
}

export interface CourseMaterial {
  id: string;
  courseId: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  fileAttachment?: {
    id: string;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    isImage: boolean;
    url: string;
    uploadedBy: string;
    uploadedAt: string;
  };
  isVisible: boolean;
}

export interface Assignment {
  id: string;
  courseId: string;
  courseName?: string;
  title: string;
  description: string;
  instructions: string;
  dueDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  maxPoints: number;
  allowLateSubmission: boolean;
  fileAttachment?: {
    id: string;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    isImage: boolean;
    url: string;
    uploadedBy: string;
    uploadedAt: string;
  };
  submissionCount?: number;
  userSubmission?: {
    id: string;
    submittedAt: string;
    fileAttachment?: any;
    status: 'submitted' | 'late' | 'graded';
    grade?: number;
    feedback?: string;
  };
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  submittedAt: string;
  fileAttachment?: {
    id: string;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    isImage: boolean;
    url: string;
    uploadedBy: string;
    uploadedAt: string;
  };
  grade?: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
  isLate: boolean;
}

export interface CourseTopic {
  id: string;
  courseId: string;
  title: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface TopicReply {
  id: string;
  topicId: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
} 