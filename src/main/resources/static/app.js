const API_URL = '/api/students';

// State
let allStudents = [];
let editMode = false;

// DOM Elements
const studentsTableBody = document.getElementById('students-table-body');
const tableContainer = document.querySelector('.data-table-container');
const searchInput = document.getElementById('search-input');
const addStudentBtn = document.getElementById('add-student-btn');
const studentModal = document.getElementById('student-modal');
const modalTitle = document.getElementById('modal-title');
const studentForm = document.getElementById('student-form');
const studentIdInput = document.getElementById('student-id');
const studentNameInput = document.getElementById('student-name');
const studentEmailInput = document.getElementById('student-email');
const modalCancelBtn = document.getElementById('modal-cancel');
const modalCloseBtn = document.getElementById('modal-close');
const toastContainer = document.getElementById('toast-container');
const loadingSpinner = document.getElementById('loading-spinner');
const emptyState = document.getElementById('empty-state');
const totalStudentsStat = document.getElementById('total-students-stat');
const uniqueDomainsStat = document.getElementById('unique-domains-stat');
const lastUpdatedStat = document.getElementById('last-updated-stat');

// Event Listeners
document.addEventListener('DOMContentLoaded', fetchStudents);
addStudentBtn.addEventListener('click', () => openModal());
modalCancelBtn.addEventListener('click', closeModal);
modalCloseBtn.addEventListener('click', closeModal);
studentForm.addEventListener('submit', handleFormSubmit);
searchInput.addEventListener('input', handleSearch);

// Close modal if clicked outside container
studentModal.addEventListener('click', (e) => {
    if (e.target === studentModal) {
        closeModal();
    }
});

// Toast Notifications Helper
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-circle-check';
    if (type === 'danger') iconClass = 'fa-circle-xmark';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';

    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <div class="toast-message">${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Trigger transition
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Show/Hide Loading Spinner
function toggleLoading(show) {
    if (show) {
        loadingSpinner.style.display = 'flex';
        tableContainer.style.display = 'none';
        emptyState.style.display = 'none';
    } else {
        loadingSpinner.style.display = 'none';
        tableContainer.style.display = 'block';
    }
}

// Fetch Students from API
async function fetchStudents() {
    toggleLoading(true);
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Could not retrieve students');
        
        allStudents = await response.json();
        renderStudents(allStudents);
        updateStats();
    } catch (error) {
        console.error('Error fetching students:', error);
        showToast(error.message || 'Failed to fetch student data', 'danger');
        renderStudents([]);
    } finally {
        toggleLoading(false);
    }
}

// Get Initials from Name for Avatar
function getInitials(name) {
    if (!name) return 'S';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
}

// Render Students to Table
function renderStudents(studentsList) {
    studentsTableBody.innerHTML = '';
    
    if (studentsList.length === 0) {
        emptyState.style.display = 'block';
        tableContainer.style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    tableContainer.style.display = 'block';
    
    studentsList.forEach(student => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="student-profile">
                    <div class="student-avatar">${getInitials(student.name)}</div>
                    <div class="student-info">
                        <span class="student-name">${escapeHtml(student.name)}</span>
                        <span class="student-id-badge">ID: #${student.id}</span>
                    </div>
                </div>
            </td>
            <td>
                <span class="student-email">
                    <i class="fa-regular fa-envelope"></i>
                    ${escapeHtml(student.email)}
                </span>
            </td>
            <td>
                <div class="actions-cell">
                    <button class="btn-icon edit" onclick="editStudent(${student.id})" title="Edit Student">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteStudent(${student.id})" title="Delete Student">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        `;
        studentsTableBody.appendChild(tr);
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Search and Filter Students
function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    const filtered = allStudents.filter(student => {
        return student.name.toLowerCase().includes(query) || 
               student.email.toLowerCase().includes(query) || 
               student.id.toString().includes(query);
    });
    renderStudents(filtered);
}

// Open Modal for Add or Edit
function openModal(student = null) {
    studentModal.classList.add('active');
    studentNameInput.focus();
    
    if (student) {
        editMode = true;
        modalTitle.textContent = 'Edit Student Details';
        studentIdInput.value = student.id;
        studentNameInput.value = student.name;
        studentEmailInput.value = student.email;
    } else {
        editMode = false;
        modalTitle.textContent = 'Register New Student';
        studentIdInput.value = '';
        studentForm.reset();
    }
}

// Close Modal
function closeModal() {
    studentModal.classList.remove('active');
    setTimeout(() => {
        studentForm.reset();
        studentIdInput.value = '';
        editMode = false;
    }, 200);
}

// Handle Form Submission (Add or Update)
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const id = studentIdInput.value;
    const name = studentNameInput.value.trim();
    const email = studentEmailInput.value.trim();
    
    if (!name || !email) {
        showToast('Please fill in all required fields.', 'warning');
        return;
    }
    
    // Simple email validation regex
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        showToast('Please enter a valid email address.', 'warning');
        return;
    }
    
    const studentData = { name, email };
    
    try {
        let response;
        if (editMode) {
            response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentData)
            });
        } else {
            response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentData)
            });
        }
        
        if (!response.ok) throw new Error(editMode ? 'Failed to update student' : 'Failed to register student');
        
        showToast(editMode ? 'Student details updated successfully!' : 'Student registered successfully!', 'success');
        closeModal();
        fetchStudents();
    } catch (error) {
        console.error(error);
        showToast(error.message || 'An error occurred. Please try again.', 'danger');
    }
}

// Load Student Details into Edit Modal
async function editStudent(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error('Could not fetch student details');
        const student = await response.json();
        openModal(student);
    } catch (error) {
        console.error(error);
        showToast('Failed to load student data', 'danger');
    }
}

// Delete Student
async function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student profile? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete student');
        
        showToast('Student deleted successfully', 'success');
        fetchStudents();
    } catch (error) {
        console.error(error);
        showToast(error.message || 'Failed to delete student', 'danger');
    }
}

// Update Stats Cards
function updateStats() {
    totalStudentsStat.textContent = allStudents.length;
    
    // Count unique email domains
    const domains = new Set();
    allStudents.forEach(student => {
        if (student.email && student.email.includes('@')) {
            const domain = student.email.split('@')[1];
            if (domain) domains.add(domain.toLowerCase());
        }
    });
    uniqueDomainsStat.textContent = domains.size;
    
    // Last updated timestamp
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    lastUpdatedStat.textContent = `Today, ${timeString}`;
}
