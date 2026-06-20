// This file contains TypeScript type definitions for the application, defining interfaces and types used throughout the project.

interface User {
    id: string;
    username: string;
    password: string;
    role: 'principal' | 'student' | 'classMaster' | 'examOfficer';
}

interface Student {
    id: string;
    studentId: string;
    name: string;
    class: string;
    grades: Record<string, number>;
}

interface Class {
    id: string;
    name: string;
    schedule: string[];
    students: Student[];
}

interface Exam {
    id: string;
    subject: string;
    date: Date;
    results: Record<string, number>; // studentId -> score
}

interface Principal {
    id: string;
    name: string;
    reports: string[];
}

interface ClassMaster {
    id: string;
    name: string;
    class: string;
    attendance: Record<string, boolean>; // studentId -> present/absent
}

interface ExamOfficer {
    id: string;
    name: string;
    exams: Exam[];
}