import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
  ChevronRight,
  Search,
  Bell,
  Mail,
  ChevronDown,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Activity,
  UserPlus,
  Filter,
  ChevronLeft,
  FileSpreadsheet,
  Send,
  Building,
  ClipboardList,
  Menu,
  Shield,
  Layers,
  Database,
  ArrowRightLeft,
  RefreshCw,
  Clock3,
  HardDrive,
  LogOut
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const mockSubjects = [
  { code: 'MTH 101', name: 'Mathematics', dept: 'Sciences', classes: ['Nursery 1', 'Nursery 2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'JSS 1', 'JSS 2', 'SS 1 Sci', 'SS 3 Arts'] },
  { code: 'ENG 101', name: 'English Language', dept: 'Humanities', classes: ['Nursery 1', 'Nursery 2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'JSS 1', 'JSS 2', 'SS 1 Sci', 'SS 3 Arts'] },
  { code: 'PHY 201', name: 'Physics', dept: 'Sciences', classes: ['SS 1 Sci', 'SS 3 Sci'] },
  { code: 'CHM 201', name: 'Chemistry', dept: 'Sciences', classes: ['SS 1 Sci', 'SS 3 Sci'] },
  { code: 'BIO 201', name: 'Biology', dept: 'Sciences', classes: ['SS 1 Sci', 'SS 3 Sci'] },
  { code: 'CIV 101', name: 'Civic Education', dept: 'Humanities', classes: ['Primary 4', 'Primary 5', 'JSS 1', 'JSS 2', 'SS 1 Sci', 'SS 3 Arts'] },
  { code: 'GEO 201', name: 'Geography', dept: 'Social Sciences', classes: ['SS 1 Sci', 'SS 3 Arts'] },
  { code: 'ECO 101', name: 'Economics', dept: 'Social Sciences', classes: ['SS 1 Sci', 'SS 3 Arts'] },
  { code: 'CSC 101', name: 'Computer Science', dept: 'Sciences', classes: ['Primary 3', 'Primary 4', 'Primary 5', 'JSS 1', 'JSS 2', 'SS 1 Sci'] },
  { code: 'AGR 101', name: 'Agricultural Science', dept: 'Sciences', classes: ['Primary 4', 'Primary 5', 'JSS 1', 'JSS 2'] },
  { code: 'FMA 201', name: 'Further Mathematics', dept: 'Sciences', classes: ['SS 1 Sci', 'SS 3 Sci'] },
  { code: 'LIT 201', name: 'Literature in English', dept: 'Humanities', classes: ['SS 3 Arts'] },
  { code: 'RDG 101', name: 'Reading/Dictation Skill', dept: 'Basic Skills', classes: ['Nursery 1', 'Nursery 2', 'Primary 1', 'Primary 2', 'Primary 3'] },
  { code: 'WRT 101', name: 'Writing Skill', dept: 'Basic Skills', classes: ['Nursery 1', 'Nursery 2', 'Primary 1', 'Primary 2', 'Primary 3'] },
  { code: 'ARA 101', name: 'Arabic Language', dept: 'Languages', classes: ['Nursery 1', 'Nursery 2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5'] },
  { code: 'HAU 101', name: 'Hausa Language', dept: 'Languages', classes: ['Nursery 1', 'Nursery 2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'JSS 1', 'JSS 2'] },
  { code: 'IRK 101', name: 'Islamic Religious Knowledge', dept: 'Humanities', classes: ['Nursery 1', 'Nursery 2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'JSS 1', 'JSS 2', 'JSS 3'] },
  { code: 'SOC 101', name: 'Social Studies', dept: 'Social Sciences', classes: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'JSS 1', 'JSS 2', 'JSS 3'] },
  { code: 'BSC 101', name: 'Basic Science', dept: 'Sciences', classes: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'JSS 1', 'JSS 2', 'JSS 3'] },
  { code: 'HEC 101', name: 'Home Economics', dept: 'Sciences', classes: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5'] },
  { code: 'PHE 101', name: 'Physical & Health Education', dept: 'Sciences', classes: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5'] },
  { code: 'FRN 101', name: 'French', dept: 'Languages', classes: ['Primary 4', 'Primary 5'] }
];

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.startsWith('/admin/students')) return 'students';
    if (path.startsWith('/admin/staff')) return 'staff';
    if (path.startsWith('/admin/classes')) return 'classes';
    if (path.startsWith('/admin/subjects')) return 'subjects';
    if (path.startsWith('/admin/results')) return 'results';
    if (path.startsWith('/admin/finance')) return 'finance';
    if (path.startsWith('/admin/reports')) return 'reports';
    if (path.startsWith('/admin/settings')) return 'settings';
    return 'dashboard';
  };

  const activeTab = getActiveTabFromPath();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [selectedClassTab, setSelectedClassTab] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [classMastersPage, setClassMastersPage] = useState(1);
  const [subjectTeachersPage, setSubjectTeachersPage] = useState(1);
  const [adminStaffPage, setAdminStaffPage] = useState(1);

  const [academicSession, setAcademicSession] = useState('2026/2027');
  const [academicTerm, setAcademicTerm] = useState('1st Term');

  // Data States
  const [stats, setStats] = useState({
    students: 120,
    classMasters: 10,
    classTeachers: 0,
    examOfficers: 1,
    principals: 1,
    bursars: 1,
    classes: 6,
    subjects: 24
  });

  const [users, setUsers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>(mockSubjects);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [viewedUser, setViewedUser] = useState<any>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [addingClass, setAddingClass] = useState(false);
  const [addingSubject, setAddingSubject] = useState(false);
  const [selectedSubjectDetail, setSelectedSubjectDetail] = useState<any>(null);

  // Assignment Modal
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [selectedTeacherForAssignments, setSelectedTeacherForAssignments] = useState<any>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [savingAssignments, setSavingAssignments] = useState(false);

  // Results & Reports States
  const [selectedClassForResults, setSelectedClassForResults] = useState<any>(null);
  const [selectedStudentForResults, setSelectedStudentForResults] = useState<any>(null);
  const [resultsReportData, setResultsReportData] = useState<any>(null);
  const [loadingResultsReport, setLoadingResultsReport] = useState(false);
  const [selectedClassForReport, setSelectedClassForReport] = useState<any>(null);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<any>(null);
  const [termReportData, setTermReportData] = useState<any>(null);
  const [loadingTermReport, setLoadingTermReport] = useState(false);
  const [classRankings, setClassRankings] = useState<Record<number, number>>({});

  // Form States
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    password: '',
    role: 'student',
    class_id: ''
  });

  const enrollmentData = [
    { name: 'Sept', Primary: 90, Secondary: 40 },
    { name: 'Oct', Primary: 95, Secondary: 42 },
    { name: 'Nov', Primary: 98, Secondary: 45 },
    { name: 'Dec', Primary: 98, Secondary: 45 },
    { name: 'Jan', Primary: 105, Secondary: 48 },
    { name: 'Feb', Primary: 110, Secondary: 52 },
    { name: 'Mar', Primary: 115, Secondary: 55 }
  ];

  const feeCollectionData = [
    { month: 'Jan', Collected: 1200000, Expected: 1500000 },
    { month: 'Feb', Collected: 2100000, Expected: 2500000 },
    { month: 'Mar', Collected: 3200000, Expected: 3500000 },
    { month: 'Apr', Collected: 4100000, Expected: 4500000 },
    { month: 'May', Collected: 4800000, Expected: 5000000 }
  ];

  const getRelativeTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const [recentActivities, setRecentActivities] = useState(() => {
    const saved = localStorage.getItem('admin_audit_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing admin_audit_logs', e);
      }
    }
    return [
      { id: 1, type: 'payment', message: 'Hafsat Ibrahim (STU3420) completed school fee invoice payment', timestamp: Date.now() - 10 * 60 * 1000, user: 'BUR001' },
      { id: 2, type: 'registration', message: 'Registered new student account: Fatima Lawal', timestamp: Date.now() - 60 * 60 * 1000, user: 'ADM001' },
      { id: 3, type: 'result', message: 'Finalized academic grades: JSS 1 Mathematics', timestamp: Date.now() - 3 * 60 * 60 * 1000, user: 'EXM001' },
      { id: 4, type: 'staff', message: 'Assigned Mr. Sani Garba as Primary 3 Master', timestamp: Date.now() - 24 * 60 * 60 * 1000, user: 'PRN001' },
      { id: 5, type: 'attendance', message: 'Daily attendance sheet submitted for SS 1 Science', timestamp: Date.now() - 24 * 60 * 60 * 1000 - 10 * 60 * 1000, user: 'MAS001' }
    ];
  });

  const getActorUsername = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const parsed = JSON.parse(userStr);
        return parsed.username || 'ADM001';
      }
    } catch (e) {
      console.error('Error parsing user', e);
    }
    return 'ADM001';
  };

  const addAuditLogEntry = (type: string, message: string, actorOverride?: string) => {
    const actor = actorOverride || getActorUsername();
    const newEntry = {
      id: Date.now(),
      type,
      message,
      timestamp: Date.now(),
      user: actor
    };
    setRecentActivities(prev => {
      const updated = [newEntry, ...prev].slice(0, 50);
      localStorage.setItem('admin_audit_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const recentPayments = [
    { id: 1, student: 'Mustapha Garba', class: 'JSS 1', ref: 'REM-8921820', amount: '45,000.00', date: 'June 21, 2026', status: 'success' },
    { id: 2, student: 'Safiya Suleiman', class: 'Primary 1', ref: 'REM-3201948', amount: '30,000.00', date: 'June 20, 2026', status: 'success' },
    { id: 3, student: 'Idris Ibrahim', class: 'SS 1 Science', ref: 'REM-9948201', amount: '60,000.00', date: 'June 18, 2026', status: 'pending' },
    { id: 4, student: 'Bilkisu Danladi', class: 'Nursery 2', ref: 'REM-1120938', amount: '15,000.00', date: 'June 17, 2026', status: 'failed' }
  ];

  const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  useEffect(() => {
    fetchDashboardData();
    const handleGlobalSearch = (e: any) => {
      setSearchQuery(e.detail || '');
    };
    window.addEventListener('globalPortalSearch', handleGlobalSearch);
    return () => {
      window.removeEventListener('globalPortalSearch', handleGlobalSearch);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, classFilter, selectedClassTab, activeTab]);

  const formatPosition = (pos: number) => {
    if (!pos) return '';
    const s = ["th", "st", "nd", "rd"],
          v = pos % 100;
    return pos + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  useEffect(() => {
    const fetchResultsReportForAdmin = async () => {
      if (!selectedStudentForResults) {
        setResultsReportData(null);
        return;
      }
      setLoadingResultsReport(true);
      try {
        const token = localStorage.getItem('token');
        const reqHeaders = { Authorization: `Bearer ${token}` };
        const res = await axios.get(`/api/student/term-report?studentId=${selectedStudentForResults.id}&term=${encodeURIComponent(academicTerm)}&year=${encodeURIComponent(academicSession)}`, { headers: reqHeaders });
        setResultsReportData(res.data);
      } catch (err) {
        console.error(err);
        setResultsReportData(null);
      } finally {
        setLoadingResultsReport(false);
      }
    };
    fetchResultsReportForAdmin();
  }, [selectedStudentForResults, academicTerm, academicSession]);

  useEffect(() => {
    const fetchTermReportForAdmin = async () => {
      if (!selectedStudentForReport) {
        setTermReportData(null);
        return;
      }
      setLoadingTermReport(true);
      try {
        const token = localStorage.getItem('token');
        const reqHeaders = { Authorization: `Bearer ${token}` };
        const res = await axios.get(`/api/student/term-report?studentId=${selectedStudentForReport.id}&term=${encodeURIComponent(academicTerm)}&year=${encodeURIComponent(academicSession)}`, { headers: reqHeaders });
        setTermReportData(res.data);
      } catch (err) {
        console.error(err);
        setTermReportData(null);
      } finally {
        setLoadingTermReport(false);
      }
    };
    fetchTermReportForAdmin();
  }, [selectedStudentForReport, academicTerm, academicSession]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const reqHeaders = { Authorization: `Bearer ${token}` };

      const [usersRes, classesRes, subjectsRes, assignmentsRes] = await Promise.allSettled([
        axios.get('/api/admin/users', { headers: reqHeaders }),
        axios.get('/api/exam-officer/classes', { headers: reqHeaders }),
        axios.get('/api/exam-officer/subjects', { headers: reqHeaders }),
        axios.get('/api/principal/assignments', { headers: reqHeaders })
      ]);

      let userList: any[] = [];
      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value.data)) {
        userList = usersRes.value.data;
        setUsers(userList);
      }

      let classList: any[] = [];
      if (classesRes.status === 'fulfilled' && Array.isArray(classesRes.value.data)) {
        classList = classesRes.value.data;
        setClasses(classList);
      }

      let subjectList: any[] = mockSubjects;
      if (subjectsRes.status === 'fulfilled' && Array.isArray(subjectsRes.value.data)) {
        subjectList = subjectsRes.value.data;
        setSubjects(subjectList);
      }

      let assignList: any[] = [];
      if (assignmentsRes.status === 'fulfilled' && Array.isArray(assignmentsRes.value.data)) {
        assignList = assignmentsRes.value.data;
        setAssignments(assignList);
      }

      setStats({
        students: userList.filter((u: any) => u.role === 'student').length,
        classMasters: userList.filter((u: any) => u.role === 'class_master').length,
        classTeachers: userList.filter((u: any) => u.role === 'subject_teacher').length,
        examOfficers: userList.filter((u: any) => u.role === 'exam_officer').length,
        principals: userList.filter((u: any) => u.role === 'principal').length,
        bursars: userList.filter((u: any) => u.role === 'bursar').length,
        classes: classList.length,
        subjects: subjectList.length
      });

      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Could not load administrative console data.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/users', formData, { headers });
      setFormData({ full_name: '', username: '', password: '', role: 'student', class_id: '' });
      setIsAddModalOpen(false);
      await fetchDashboardData();
      addAuditLogEntry('registration', `Created ${formData.role.replace('_', ' ')} account: ${formData.full_name}`);
    } catch (err: any) {
      alert(err.response?.data?.msg || 'Failed to create user account');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await axios.put(`/api/admin/users/${selectedUser.id}`, formData, { headers });
      setIsEditModalOpen(false);
      setSelectedUser(null);
      await fetchDashboardData();
      addAuditLogEntry('system', `Updated account credentials for: ${formData.full_name}`);
    } catch (err: any) {
      alert(err.response?.data?.msg || 'Failed to update user profile');
    }
  };

  const handleDeleteUser = async (id: number) => {
    const target = users.find(u => u.id === id);
    if (!window.confirm(`Are you sure you want to delete user "${target?.full_name || 'Account'}"?`)) return;
    try {
      await axios.delete(`/api/admin/users/${id}`, { headers });
      await fetchDashboardData();
      addAuditLogEntry('system', `Deleted user account: ${target?.full_name || `ID #${id}`}`);
    } catch (err: any) {
      alert(err.response?.data?.msg || 'Failed to delete user');
    }
  };

  const handleOpenEditModal = (user: any) => {
    setSelectedUser(user);
    setFormData({
      full_name: user.full_name,
      username: user.username,
      password: '',
      role: user.role,
      class_id: user.class_id || ''
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDetailsModal = (user: any) => {
    setViewedUser(user);
    setIsDetailsModalOpen(true);
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const exportToCSV = () => {
    const headersList = ['ID', 'Full Name', 'Username', 'Role', 'Assigned Class', 'Date Created'];
    const csvRows = [headersList.join(',')];

    for (const u of filteredUsers) {
      const values = [
        u.id,
        `"${u.full_name.replace(/"/g, '""')}"`,
        `"${u.username}"`,
        `"${u.role}"`,
        `"${u.class_name || 'N/A'}"`,
        `"${u.created_at || 'N/A'}"`
      ];
      csvRows.push(values.join(','));
    }

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ERP_User_Export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleForceSync = async () => {
    await fetchDashboardData();
    addAuditLogEntry('system', 'Forced database cache reconciliation and sync');
  };

  const handleCreateClassAlert = () => {
    setIsAddClassModalOpen(true);
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setAddingClass(true);
    try {
      await axios.post('/api/exam-officer/classes', { name: newClassName }, { headers });
      setNewClassName('');
      setIsAddClassModalOpen(false);
      await fetchDashboardData();
      addAuditLogEntry('system', `Created classroom: ${newClassName}`);
    } catch (err: any) {
      alert(err.response?.data?.msg || 'Failed to create classroom');
    } finally {
      setAddingClass(false);
    }
  };

  const handleDeleteClass = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete classroom "${name}"?`)) return;
    try {
      await axios.delete(`/api/exam-officer/classes/${id}`, { headers });
      if (selectedClassTab === name) setSelectedClassTab('All');
      await fetchDashboardData();
      addAuditLogEntry('system', `Deleted classroom: ${name}`);
    } catch (err: any) {
      alert(err.response?.data?.msg || 'Failed to delete classroom');
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    setAddingSubject(true);
    try {
      await axios.post('/api/exam-officer/subjects', { name: newSubjectName }, { headers });
      setNewSubjectName('');
      setIsAddSubjectModalOpen(false);
      await fetchDashboardData();
      addAuditLogEntry('system', `Registered curriculum subject: ${newSubjectName}`);
    } catch (err: any) {
      alert(err.response?.data?.msg || 'Failed to register subject');
    } finally {
      setAddingSubject(false);
    }
  };

  const handleDeleteSubject = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete subject "${name}"?`)) return;
    try {
      await axios.delete(`/api/exam-officer/subjects/${id}`, { headers });
      await fetchDashboardData();
      addAuditLogEntry('system', `Deleted subject: ${name}`);
    } catch (err: any) {
      alert(err.response?.data?.msg || 'Failed to delete subject');
    }
  };

  const handleSaveAssignments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherForAssignments) return;
    setSavingAssignments(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/principal/teachers/${selectedTeacherForAssignments.id}/assignments`,
        {
          subject_ids: selectedSubjectIds,
          class_ids: selectedClassIds
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchDashboardData();
      setIsAssignmentModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.msg || 'Failed to save assignments');
    } finally {
      setSavingAssignments(false);
    }
  };

  const filteredUsers = users
    .filter(u => {
      const matchesSearch = u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (u.class_name && u.class_name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });

  const teacherAssignmentsMap = (() => {
    const map: Record<number, { subjects: string[], classes: string[], subjectIds: number[], classIds: number[] }> = {};
    assignments.forEach(item => {
      if (!map[item.teacher_id]) {
        map[item.teacher_id] = { subjects: [], classes: [], subjectIds: [], classIds: [] };
      }
      if (!map[item.teacher_id].subjectIds.includes(item.subject_id)) {
        map[item.teacher_id].subjectIds.push(item.subject_id);
        map[item.teacher_id].subjects.push(item.subject_name);
      }
      if (!map[item.teacher_id].classIds.includes(item.class_id)) {
        map[item.teacher_id].classIds.push(item.class_id);
        map[item.teacher_id].classes.push(item.class_name);
      }
    });
    return map;
  })();

  const renderStaffSection = (
    title: string,
    description: string,
    list: any[],
    showClassroomColumn: boolean,
    classroomColumnHeader: string,
    rolePage: number,
    setRolePage: (page: number) => void
  ) => {
    const itemsPerPage = 8;
    const indexOfLast = rolePage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentItems = list.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(list.length / itemsPerPage);

    if (list.length === 0) return null;

    return (
      <div className="dashboard-card" style={{ padding: '28px 32px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {title}
            <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '6px', background: 'var(--color-accent-light)', color: 'var(--color-accent)', fontWeight: 800 }}>
              {list.length} records
            </span>
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--color-secondary)' }}>{description}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          {currentItems.map((st) => {
            const teacherData = teacherAssignmentsMap[st.id] || { subjects: [], classes: [] };
            return (
              <div key={st.id} style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'center', alignItems: 'center', minHeight: '210px' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-accent-light)', color: 'var(--color-accent)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem', marginBottom: '10px' }}>
                  {getInitials(st.full_name)}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)' }}>{st.full_name}</h4>
                  <p style={{ margin: '3px 0', fontSize: '0.75rem', color: 'var(--color-secondary)', fontFamily: 'monospace' }}>GUID: #{st.id}</p>
                </div>
                <div style={{ width: '100%', margin: '10px 0' }}>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', background: 'var(--color-accent-light)', color: 'var(--color-accent)', border: '1px solid var(--color-border)' }}>
                    {st.role.replace('_', ' ')}
                  </span>
                  {showClassroomColumn && (
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.78rem', color: 'var(--color-secondary)' }}>Class: {st.class_name || 'N/A'}</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', width: '100%', marginTop: '6px' }}>
                  <button onClick={() => handleOpenDetailsModal(st)} style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--color-primary)' }}>
                    View
                  </button>
                  {st.role === 'subject_teacher' && (
                    <button onClick={() => { setSelectedTeacherForAssignments(st); setSelectedSubjectIds(teacherData.subjectIds); setSelectedClassIds(teacherData.classIds); setIsAssignmentModalOpen(true); }} style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, background: 'var(--color-accent-light)', color: 'var(--color-accent)', border: '1px solid var(--color-border)', borderRadius: '6px', cursor: 'pointer' }}>
                      Assign
                    </button>
                  )}
                  <button onClick={() => handleOpenEditModal(st)} style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--color-primary)' }}>
                    Edit
                  </button>
                  <button onClick={() => handleDeleteUser(st.id)} disabled={st.role === 'admin'} style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--color-destructive)' }}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const navTabs = [
    { path: '/admin', label: 'Overview Analytics', key: 'dashboard' },
    { path: '/admin/students', label: 'Students Registry', key: 'students' },
    { path: '/admin/staff', label: 'Staff Directory', key: 'staff' },
    { path: '/admin/classes', label: 'Classrooms', key: 'classes' },
    { path: '/admin/subjects', label: 'Curriculum Subjects', key: 'subjects' },
    { path: '/admin/results', label: 'Student Results', key: 'results' },
    { path: '/admin/finance', label: 'Financial Ledger', key: 'finance' },
    { path: '/admin/reports', label: 'Audit Reports', key: 'reports' },
    { path: '/admin/settings', label: 'System Settings', key: 'settings' },
  ];

  return (
    <DashboardLayout title="Administration Console" role="admin" studentCount={users.filter(u => u.role === 'student').length}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', paddingBottom: '40px' }}>

        {/* ── Welcome Banner (Signature Sky-Blue Theme) ── */}
        <div style={{
          background: 'linear-gradient(135deg, var(--color-accent) 0%, #38bdf8 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '20px',
          boxShadow: 'var(--shadow-glow-md)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-20px', right: '100px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Administration Console</p>
            <h2 style={{ margin: 0, fontFamily: 'Sora, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              System Administration &amp; Control Center
            </h2>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>
              Bichi Academy Administration Center · {academicSession} · {academicTerm}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <button onClick={handleForceSync} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw className="w-4 h-4" /> Sync Data
            </button>
            <button onClick={exportToCSV} style={{ background: '#fff', color: '#0c1a2e', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download className="w-4 h-4" /> Export Data
            </button>
          </div>
        </div>

        {/* ── Sub-Tab Navigation Bar ── */}
        <div style={{ display: 'flex', gap: '6px', borderBottom: '1.5px solid var(--color-border)', paddingBottom: '4px', overflowX: 'auto' }} className="no-print">
          {navTabs.map((tab) => (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              style={{
                padding: '10px 20px',
                background: activeTab === tab.key ? 'var(--color-accent-light)' : 'transparent',
                color: activeTab === tab.key ? 'var(--color-accent)' : 'var(--color-secondary)',
                fontWeight: activeTab === tab.key ? 800 : 600,
                cursor: 'pointer',
                fontSize: '0.88rem',
                border: 'none',
                borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                transition: 'all 0.15s ease',
                borderBottom: activeTab === tab.key ? '2.5px solid var(--color-accent)' : '2.5px solid transparent',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ padding: '14px 18px', borderRadius: '8px', background: 'var(--color-destructive-light)', color: 'var(--color-destructive)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* ==================== 1. DASHBOARD OVERVIEW ==================== */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

            {/* 4 KPI Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
              <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Students</span>
                  <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--color-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GraduationCap className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800, fontFamily: 'Sora, sans-serif', color: 'var(--color-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {stats.students}
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-secondary)' }}>Enrolled this session</p>
              </div>

              <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Staff</span>
                  <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800, fontFamily: 'Sora, sans-serif', color: 'var(--color-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {stats.classMasters + stats.classTeachers + stats.examOfficers + stats.principals + stats.bursars}
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-secondary)' }}>{stats.classMasters + stats.classTeachers} Teachers · {stats.principals + stats.bursars} Admin</p>
              </div>

              <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active Classes</span>
                  <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--color-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800, fontFamily: 'Sora, sans-serif', color: 'var(--color-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {stats.classes}
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-secondary)' }}>{stats.subjects} subjects in curriculum</p>
              </div>

              <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Academic Session</span>
                  <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--color-warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Sora, sans-serif', color: 'var(--color-primary)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                  {academicSession}
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-secondary)' }}>{academicTerm} · Active</p>
              </div>
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
              <div className="dashboard-card" style={{ padding: '28px 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-primary)' }}>Enrollment Trends</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--color-secondary)' }}>Monthly student intake — this session</p>
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--color-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                  </div>
                </div>
                <div style={{ height: 260, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={enrollmentData}>
                      <defs>
                        <linearGradient id="gradP" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gradS" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="var(--color-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--color-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-primary)', borderRadius: '8px', fontSize: '12px' }} />
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <Area type="monotone" dataKey="Primary" stroke="var(--color-accent)" strokeWidth={2.5} fill="url(#gradP)" name="Primary" dot={false} />
                      <Area type="monotone" dataKey="Secondary" stroke="var(--color-success)" strokeWidth={2.5} fill="url(#gradS)" name="Secondary" dot={false} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="dashboard-card" style={{ padding: '28px 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-primary)' }}>Fee Collections</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--color-secondary)' }}>Expected vs Collected (NGN)</p>
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                  </div>
                </div>
                <div style={{ height: 260, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={feeCollectionData} barGap={8}>
                      <XAxis dataKey="month" stroke="var(--color-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--color-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-primary)', borderRadius: '8px', fontSize: '12px' }} />
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <Bar dataKey="Collected" fill="var(--color-success)" radius={[4, 4, 0, 0]} name="Collected" />
                      <Bar dataKey="Expected" fill="var(--color-accent)" opacity={0.5} radius={[4, 4, 0, 0]} name="Expected" />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dashboard-card" style={{ padding: '28px 32px' }}>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-primary)' }}>Quick Actions</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--color-secondary)' }}>Common administrative operations and shortcuts</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
                {[
                  { label: 'Add Student', icon: UserPlus, action: () => { setFormData({ full_name: '', username: '', password: '', role: 'student', class_id: '' }); setIsAddModalOpen(true); } },
                  { label: 'Add Staff', icon: Users, action: () => { setFormData({ full_name: '', username: '', password: '', role: 'class_master', class_id: '' }); setIsAddModalOpen(true); } },
                  { label: 'New Class', icon: Building, action: handleCreateClassAlert },
                  { label: 'Subjects', icon: BookOpen, action: () => navigate('/admin/subjects') },
                  { label: 'Results', icon: FileSpreadsheet, action: () => navigate('/admin/results') },
                  { label: 'Audit Reports', icon: FileText, action: () => navigate('/admin/reports') },
                ].map(({ label, icon: Icon, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="action-tile"
                    style={{ padding: '20px 16px' }}
                  >
                    <div className="action-tile-icon" style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)', width: '48px', height: '48px' }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent System Activities */}
            <div className="dashboard-card" style={{ padding: '28px 32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                  Recent System Activities
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-secondary)' }}>Live system journal</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '320px', overflowY: 'auto' }}>
                {recentActivities.slice(0, 10).map((act: any) => (
                  <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 18px', borderRadius: '10px', background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-accent-light)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0 }}>
                      {act.type ? act.type[0].toUpperCase() : 'S'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-primary)' }}>{act.message}</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary)' }}>
                        {act.timestamp ? getRelativeTime(act.timestamp) : act.time} • actor: {act.user}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--color-border)', fontSize: '0.78rem', color: 'var(--color-secondary)' }}>
                <span>Audit Logs Active</span>
                <button 
                  onClick={() => {
                    localStorage.setItem('admin_audit_logs', JSON.stringify([]));
                    setRecentActivities([]);
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-destructive)', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}
                >
                  Clear History
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ==================== 2. STUDENTS REGISTRY ==================== */}
        {activeTab === 'students' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div className="dashboard-card" style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  Student Registry Catalog
                  <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '6px', background: 'var(--color-accent-light)', color: 'var(--color-accent)', fontWeight: 800 }}>
                    {users.filter(u => u.role === 'student').length} pupils
                  </span>
                </h2>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: 'var(--color-secondary)' }}>
                  Manage student records, assigned classrooms, and access folders.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={exportToCSV} style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--color-muted)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileSpreadsheet className="w-4 h-4" /> Export CSV
                </button>
                <button onClick={() => { setFormData({ full_name: '', username: '', password: '', role: 'student', class_id: '' }); setIsAddModalOpen(true); }} style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--color-accent)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus className="w-4 h-4" /> Add Student
                </button>
              </div>
            </div>

            <div className="dashboard-card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ position: 'relative', width: 320 }}>
                <Search className="w-4 h-4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', paddingLeft: '36px', paddingRight: '14px', paddingTop: '10px', paddingBottom: '10px', borderRadius: '8px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-secondary)', textTransform: 'uppercase' }}>Class:</span>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  style={{ padding: '8px 14px', borderRadius: '8px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  <option value="all">All Classes</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {(() => {
              const studentsList = users.filter(u => u.role === 'student' && (classFilter === 'all' || u.class_name === classFilter) && (u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || u.username.toLowerCase().includes(searchQuery.toLowerCase())));
              const indexOfLastStudent = currentPage * 12;
              const indexOfFirstStudent = indexOfLastStudent - 12;
              const currentStudents = studentsList.slice(indexOfFirstStudent, indexOfLastStudent);
              const totalPages = Math.ceil(studentsList.length / 12);

              if (studentsList.length === 0) {
                return (
                  <div className="dashboard-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--color-secondary)' }}>
                    No student records found matching selected filter.
                  </div>
                );
              }

              return (
                <div className="dashboard-card" style={{ padding: '28px 32px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                    {currentStudents.map((stud) => (
                      <div key={stud.id} style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'center', alignItems: 'center', minHeight: '190px' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-accent-light)', color: 'var(--color-accent)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem', marginBottom: '10px' }}>
                          {getInitials(stud.full_name)}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)' }}>{stud.full_name}</h4>
                          <p style={{ margin: '3px 0', fontSize: '0.75rem', color: 'var(--color-secondary)', fontFamily: 'monospace' }}>ID: {stud.username}</p>
                        </div>
                        <div style={{ margin: '8px 0' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
                            {stud.class_name || 'Unassigned'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', width: '100%', marginTop: '6px' }}>
                          <button onClick={() => handleOpenDetailsModal(stud)} style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--color-primary)' }}>
                            View
                          </button>
                          <button onClick={() => handleOpenEditModal(stud)} style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--color-primary)' }}>
                            Edit
                          </button>
                          <button onClick={() => handleDeleteUser(stud.id)} style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--color-destructive)' }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-secondary)' }}>
                        Showing {indexOfFirstStudent + 1} to {Math.min(indexOfLastStudent, studentsList.length)} of {studentsList.length} students
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} style={{ padding: '8px 14px', borderRadius: '6px', background: 'var(--color-muted)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
                          Prev
                        </button>
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} style={{ padding: '8px 14px', borderRadius: '6px', background: 'var(--color-muted)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ==================== 3. STAFF REGISTRY ==================== */}
        {activeTab === 'staff' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div className="dashboard-card" style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  Academic &amp; Staff Directory
                  <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '6px', background: 'var(--color-success-light)', color: 'var(--color-success)', fontWeight: 800 }}>
                    {users.filter(u => u.role !== 'student').length} staff
                  </span>
                </h2>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: 'var(--color-secondary)' }}>
                  Manage teaching staff, class master assignments, and admin accounts.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setFormData({ full_name: '', username: '', password: '', role: 'class_master', class_id: '' }); setIsAddModalOpen(true); }} style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--color-success)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus className="w-4 h-4" /> Add Staff Member
                </button>
              </div>
            </div>

            {(() => {
              const classMasters = users.filter(u => u.role === 'class_master' && (u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || u.username.toLowerCase().includes(searchQuery.toLowerCase())));
              const subjectTeachers = users.filter(u => u.role === 'subject_teacher' && (u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || u.username.toLowerCase().includes(searchQuery.toLowerCase())));
              const adminStaff = users.filter(u => u.role !== 'student' && u.role !== 'class_master' && u.role !== 'subject_teacher' && (roleFilter === 'all' || u.role === roleFilter) && (u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || u.username.toLowerCase().includes(searchQuery.toLowerCase())));

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  {renderStaffSection("Class Masters Roster", "Form teachers assigned to academic classrooms", classMasters, true, "Classroom", classMastersPage, setClassMastersPage)}
                  {renderStaffSection("Subject Teachers Roster", "Specialist educators teaching syllabus subjects", subjectTeachers, false, "Assigned", subjectTeachersPage, setSubjectTeachersPage)}
                  {renderStaffSection("Administrative Staff", "Principals, Exam Officers, Bursars, and System Admins", adminStaff, false, "Role", adminStaffPage, setAdminStaffPage)}
                </div>
              );
            })()}
          </div>
        )}

        {/* ==================== 4. CLASSES & CURRICULUM ==================== */}
        {activeTab === 'classes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div className="dashboard-card" style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>Classrooms Directory</h2>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: 'var(--color-secondary)' }}>
                  Manage academic grades, student enrollments, and form master assignments.
                </p>
              </div>
              <button onClick={handleCreateClassAlert} style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--color-accent)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus className="w-4 h-4" /> Create Class
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {classes.map((cls: any) => {
                const studentCount = users.filter((u: any) => u.role === 'student' && u.class_name === cls.name).length;
                const teacherCount = users.filter((u: any) => u.role === 'class_master' && u.class_name === cls.name).length;
                return (
                  <div key={cls.id} className="dashboard-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '8px', background: 'var(--color-accent-light)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building className="w-5 h-5" />
                      </div>
                      <button onClick={() => handleDeleteClass(cls.id, cls.name)} style={{ background: 'none', border: 'none', color: 'var(--color-destructive)', cursor: 'pointer', padding: '6px' }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div style={{ marginTop: '16px' }}>
                      <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)' }}>{cls.name}</h4>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '4px', background: 'var(--color-muted)', color: 'var(--color-secondary)', fontWeight: 700 }}>
                          {studentCount} Students
                        </span>
                        {teacherCount > 0 && (
                          <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '4px', background: 'var(--color-success-light)', color: 'var(--color-success)', fontWeight: 700 }}>
                            Master Assigned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== 5. SUBJECTS ==================== */}
        {activeTab === 'subjects' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div className="dashboard-card" style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>Curriculum Subjects</h2>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: 'var(--color-secondary)' }}>
                  Registered academic syllabus courses and departmental subjects.
                </p>
              </div>
              <button onClick={() => setIsAddSubjectModalOpen(true)} style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--color-accent)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus className="w-4 h-4" /> Register Subject
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {subjects.map((sub: any) => (
                <div key={sub.id || sub.code} className="dashboard-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '150px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '8px', background: 'var(--color-accent-light)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen className="w-5 h-5" />
                    </div>
                    {sub.id && (
                      <button onClick={() => handleDeleteSubject(sub.id, sub.name)} style={{ background: 'none', border: 'none', color: 'var(--color-destructive)', cursor: 'pointer', padding: '6px' }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>{sub.name}</h4>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.78rem', color: 'var(--color-secondary)' }}>Department: {sub.dept || 'General'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== 6. RESULTS RECORDING SHEET ==================== */}
        {activeTab === 'results' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div className="dashboard-card" style={{ padding: '28px 32px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>Terminal Results Directory</h2>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: 'var(--color-secondary)' }}>
                Select a classroom below to inspect finalized student report cards.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
              {classes.map((cls: any) => {
                const studentCount = users.filter(u => u.class_name === cls.name && u.role === 'student').length;
                return (
                  <div key={cls.id} className="dashboard-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>{cls.name}</h4>
                      <p style={{ margin: '6px 0 0 0', fontSize: '0.82rem', color: 'var(--color-secondary)' }}>{studentCount} Enrolled Pupils</p>
                    </div>
                    <button onClick={() => setSelectedClassForResults(cls)} style={{ marginTop: '16px', padding: '10px', borderRadius: '6px', background: 'var(--color-accent-light)', color: 'var(--color-accent)', border: '1px solid var(--color-border)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                      View Class Results
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== 7. FINANCE & BILLING ==================== */}
        {activeTab === 'finance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div className="dashboard-card" style={{ padding: '28px 32px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>Financial Ledger &amp; Billing Console</h2>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: 'var(--color-secondary)' }}>
                Track school fees collection, Paystack settlement ledgers, and billing reconciliation.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
              <div className="stat-card" style={{ padding: '24px 28px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>Target Invoices</span>
                <p style={{ margin: '10px 0 0 0', fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary)' }}>₦1,500,000.00</p>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-secondary)' }}>Expected for this term</span>
              </div>
              <div className="stat-card" style={{ padding: '24px 28px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>Collected Revenue</span>
                <p style={{ margin: '10px 0 0 0', fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-success)' }}>₦1,200,000.00</p>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-secondary)' }}>Verified payments</span>
              </div>
              <div className="stat-card" style={{ padding: '24px 28px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>Deficit Arrears</span>
                <p style={{ margin: '10px 0 0 0', fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-destructive)' }}>₦300,000.00</p>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-secondary)' }}>Outstanding receipts</span>
              </div>
            </div>

            <div className="dashboard-card" style={{ padding: '28px 32px' }}>
              <h3 style={{ margin: '0 0 20px 0', color: 'var(--color-primary)', fontSize: '1.15rem' }}>Recent Paystack Receipts</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                {recentPayments.map((p) => (
                  <div key={p.id} style={{ padding: '16px 20px', background: 'var(--color-muted)', border: '1px solid var(--color-border)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)' }}>{p.student}</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>{p.class}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-secondary)', display: 'block', fontFamily: 'monospace' }}>{p.ref}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary)' }}>₦{p.amount}</p>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: p.status === 'success' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== 8. AUDIT REPORTS ==================== */}
        {activeTab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div className="dashboard-card" style={{ padding: '28px 32px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>System Audit Journal</h2>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: 'var(--color-secondary)' }}>
                Chronological log of administrative actions, account registrations, and grade publishing.
              </p>
            </div>

            <div className="dashboard-card" style={{ padding: '28px 32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {recentActivities.map((act: any) => (
                  <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px 20px', borderRadius: '10px', background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-accent-light)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, flexShrink: 0 }}>
                      {act.type ? act.type[0].toUpperCase() : 'A'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-primary)' }}>{act.message}</p>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-secondary)' }}>
                        {act.timestamp ? getRelativeTime(act.timestamp) : act.time} • actor: {act.user}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== 9. SETTINGS ==================== */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div className="dashboard-card" style={{ padding: '28px 32px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>System Configuration &amp; Settings</h2>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: 'var(--color-secondary)' }}>
                Configure academic session terms, portal security options, and database caches.
              </p>
            </div>

            <div className="dashboard-card" style={{ padding: '28px 32px' }}>
              <h3 style={{ margin: '0 0 20px 0', color: 'var(--color-primary)', fontSize: '1.15rem' }}>Academic Session Settings</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Current Session</label>
                  <input type="text" value={academicSession} onChange={(e) => setAcademicSession(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontSize: '0.88rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Current Term</label>
                  <select value={academicTerm} onChange={(e) => setAcademicTerm(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontSize: '0.88rem' }}>
                    <option value="1st Term">1st Term</option>
                    <option value="2nd Term">2nd Term</option>
                    <option value="3rd Term">3rd Term</option>
                  </select>
                </div>
              </div>
              <button onClick={handleForceSync} style={{ marginTop: '24px', padding: '12px 22px', borderRadius: '8px', background: 'var(--color-accent)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>
                Save Configuration
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ==================== MODALS ==================== */}

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '440px', overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)' }}>Create New Account</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: 'var(--color-secondary)', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleAddUser}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>Full Name</label>
                  <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontSize: '0.88rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>Username / Admission ID</label>
                  <input type="text" name="username" value={formData.username} onChange={handleInputChange} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontSize: '0.88rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontSize: '0.88rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>Role</label>
                  <select name="role" value={formData.role} onChange={handleInputChange} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontSize: '0.88rem' }}>
                    <option value="student">Student</option>
                    <option value="class_master">Class Master</option>
                    <option value="subject_teacher">Subject Teacher</option>
                    <option value="exam_officer">Exam Officer</option>
                    <option value="principal">Principal</option>
                    <option value="bursar">Bursar</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                {(formData.role === 'student' || formData.role === 'class_master' || formData.role === 'subject_teacher') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>Classroom</label>
                    <select name="class_id" value={formData.class_id} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontSize: '0.88rem' }}>
                      <option value="">-- No Class Assigned --</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--color-muted)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 18px', borderRadius: '8px', background: 'var(--color-accent)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '440px', overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)' }}>Edit Account Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: 'var(--color-secondary)', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleEditUser}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>Full Name</label>
                  <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontSize: '0.88rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>Username / ID</label>
                  <input type="text" name="username" value={formData.username} onChange={handleInputChange} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontSize: '0.88rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>New Password (optional)</label>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Leave blank to keep current" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontSize: '0.88rem' }} />
                </div>
                {selectedUser?.role !== 'student' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>Role</label>
                    <select name="role" value={formData.role} onChange={handleInputChange} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontSize: '0.88rem' }}>
                      <option value="class_master">Class Master</option>
                      <option value="subject_teacher">Subject Teacher</option>
                      <option value="exam_officer">Exam Officer</option>
                      <option value="principal">Principal</option>
                      <option value="bursar">Bursar</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                )}
                {(formData.role === 'student' || formData.role === 'class_master' || formData.role === 'subject_teacher') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>Classroom</label>
                    <select name="class_id" value={formData.class_id} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontSize: '0.88rem' }}>
                      <option value="">-- No Class Assigned --</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--color-muted)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 18px', borderRadius: '8px', background: 'var(--color-accent)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {isDetailsModalOpen && viewedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '400px', overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)' }}>Profile Details</h3>
              <button onClick={() => setIsDetailsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: 'var(--color-secondary)', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--color-accent-light)', color: 'var(--color-accent)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', marginBottom: '14px' }}>
                {getInitials(viewedUser.full_name)}
              </div>
              <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)' }}>{viewedUser.full_name}</h4>
              <span style={{ marginTop: '8px', padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
                {viewedUser.role.replace('_', ' ')}
              </span>

              <div style={{ width: '100%', marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', background: 'var(--color-muted)', padding: '18px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--color-secondary)', fontWeight: 700 }}>Username:</span>
                  <span style={{ color: 'var(--color-primary)', fontFamily: 'monospace' }}>{viewedUser.username}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--color-secondary)', fontWeight: 700 }}>Classroom:</span>
                  <span style={{ color: 'var(--color-primary)' }}>{viewedUser.class_name || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--color-secondary)', fontWeight: 700 }}>Database ID:</span>
                  <span style={{ color: 'var(--color-primary)', fontFamily: 'monospace' }}>#{viewedUser.id}</span>
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsDetailsModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--color-muted)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Class Modal */}
      {isAddClassModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '400px', overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)' }}>Create New Class</h3>
              <button onClick={() => setIsAddClassModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: 'var(--color-secondary)', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleAddClass}>
              <div style={{ padding: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Class Name</label>
                <input type="text" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="e.g. JSS 1, SS 3 Science" required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontSize: '0.88rem' }} />
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsAddClassModalOpen(false)} style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--color-muted)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={addingClass} style={{ padding: '10px 18px', borderRadius: '8px', background: 'var(--color-accent)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>{addingClass ? 'Creating...' : 'Create Class'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Subject Modal */}
      {isAddSubjectModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '400px', overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)' }}>Register Subject</h3>
              <button onClick={() => setIsAddSubjectModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: 'var(--color-secondary)', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleAddSubject}>
              <div style={{ padding: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Subject Name</label>
                <input type="text" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="e.g. Further Mathematics" required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontSize: '0.88rem' }} />
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsAddSubjectModalOpen(false)} style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--color-muted)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={addingSubject} style={{ padding: '10px 18px', borderRadius: '8px', background: 'var(--color-accent)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>{addingSubject ? 'Registering...' : 'Add Subject'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Subject Assignments Modal */}
      {isAssignmentModalOpen && selectedTeacherForAssignments && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '460px', overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)' }}>Manage: {selectedTeacherForAssignments.full_name}</h3>
              <button onClick={() => setIsAssignmentModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: 'var(--color-secondary)', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSaveAssignments}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh', overflowY: 'auto' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Select Subjects</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'var(--color-muted)', padding: '14px', borderRadius: '8px', border: '1px solid var(--color-border)', maxHeight: '180px', overflowY: 'auto' }}>
                    {subjects.map(sub => (
                      <label key={sub.id || sub.code} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--color-primary)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedSubjectIds.includes(sub.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedSubjectIds([...selectedSubjectIds, sub.id]);
                            else setSelectedSubjectIds(selectedSubjectIds.filter(id => id !== sub.id));
                          }}
                        />
                        {sub.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Select Classrooms</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'var(--color-muted)', padding: '14px', borderRadius: '8px', border: '1px solid var(--color-border)', maxHeight: '180px', overflowY: 'auto' }}>
                    {classes.map(cls => (
                      <label key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--color-primary)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedClassIds.includes(cls.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedClassIds([...selectedClassIds, cls.id]);
                            else setSelectedClassIds(selectedClassIds.filter(id => id !== cls.id));
                          }}
                        />
                        {cls.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsAssignmentModalOpen(false)} style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--color-muted)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={savingAssignments} style={{ padding: '10px 18px', borderRadius: '8px', background: 'var(--color-accent)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>{savingAssignments ? 'Saving...' : 'Save Assignments'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
