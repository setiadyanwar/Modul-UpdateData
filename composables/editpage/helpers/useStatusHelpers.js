/**
 * Edit Page Status & UI Helpers
 * 
 * Helper functions for status steps, breadcrumbs, and UI-related computations
 * Extracted from pages/update-data/edit/[id].vue
 */

import { formatDate } from './useEditPageHelpers'

/**
 * Get status steps for progress indicator
 * @param {Object} requestDetail - Request detail object
 * @returns {Array} Array of status step objects
 */
export const getStatusSteps = (requestDetail) => {
    if (!requestDetail) {
        return [
            { label: "Draft", icon: "pi pi-file", status: "current" },
            { label: "Submitted", icon: "pi pi-user", status: "pending" },
            { label: "Waiting Approval", icon: "pi pi-calendar", status: "pending" },
            { label: "Approved", icon: "pi pi-check", status: "pending" },
        ];
    }

    const currentStatus = requestDetail.status || "pending";

    if (currentStatus === "rejected" || currentStatus === "3") {
        return [
            { label: "Draft", icon: "pi pi-file", status: "completed" },
            { label: "Submitted", icon: "pi pi-user", status: "completed" },
            { label: "Needs Revision", icon: "pi pi-exclamation-triangle", status: "current" },
            { label: "Approved", icon: "pi pi-check", status: "pending" },
        ];
    } else if (currentStatus === "draft" || currentStatus === "1") {
        return [
            { label: "Draft", icon: "pi pi-file", status: "current" },
            { label: "Submitted", icon: "pi pi-user", status: "pending" },
            { label: "Waiting Approval", icon: "pi pi-calendar", status: "pending" },
            { label: "Approved", icon: "pi pi-check", status: "pending" },
        ];
    } else if (currentStatus === "in-review" || currentStatus === "waiting_approval" || currentStatus === "2") {
        return [
            { label: "Draft", icon: "pi pi-file", status: "completed" },
            { label: "Submitted", icon: "pi pi-user", status: "completed" },
            { label: "Waiting Approval", icon: "pi pi-calendar", status: "current" },
            { label: "Approved", icon: "pi pi-check", status: "pending" },
        ];
    } else if (currentStatus === "approved" || currentStatus === "completed" || currentStatus === "4") {
        return [
            { label: "Draft", icon: "pi pi-file", status: "completed" },
            { label: "Submitted", icon: "pi pi-user", status: "completed" },
            { label: "Waiting Approval", icon: "pi pi-calendar", status: "completed" },
            { label: "Approved", icon: "pi pi-check", status: "current" },
        ];
    } else {
        return [
            { label: "Draft", icon: "pi pi-file", status: "completed" },
            { label: "Submitted", icon: "pi pi-user", status: "completed" },
            { label: "Waiting Approval", icon: "pi pi-calendar", status: "current" },
            { label: "Approved", icon: "pi pi-check", status: "pending" },
        ];
    }
}

/**
 * Format category name for display
 * @param {string} cat - Category identifier
 * @returns {string} Formatted category name
 */
export const formatCategoryName = (cat) => {
    if (!cat) return 'Unknown';

    // If it's already a formatted label from API (like "Basic Information"), return as is
    if (cat === 'Basic Information' || cat === 'Address' || cat === 'Emergency Contact' ||
        cat === 'Payroll Account' || cat === 'Family' || cat === 'Education' ||
        cat === 'Benefit' || cat === 'Medical Record' || cat === 'Employment Information') {
        return cat;
    }

    const categoryMap = {
        'basic-information': 'Basic Information',
        'BSC': 'Basic Information',
        'employment_info': 'Employment Information',
        'employment_information': 'Employment Information',
        'EMP': 'Employment Information',
        'emergency_contact': 'Emergency Contact',
        'emergency-contact': 'Emergency Contact',
        'EMC': 'Emergency Contact',
        'payroll_account': 'Payroll Account',
        'payroll-account': 'Payroll Account',
        'PYR': 'Payroll Account',
        'social_security': 'Benefit',
        'social-security': 'Benefit',
        'SSI': 'Benefit',
        'medical_record': 'Medical Record',
        'medical-record': 'Medical Record',
        'MDR': 'Medical Record',
        'data_employee': 'Employee Data',
        'address': 'Address',
        'ADR': 'Address',
        'family': 'Family',
        'FMY': 'Family',
        'education': 'Education',
        'EDC': 'Education'
    };

    return categoryMap[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get breadcrumb items for navigation
 * @param {Object} requestDetail - Request detail object
 * @param {string} requestId - Request ID
 * @returns {Array} Array of breadcrumb items
 */
export const getBreadcrumbItems = (requestDetail, requestId) => {
    const items = [
        { label: "Dashboard", href: "/" },
        { label: "Update Data", href: "/update-data" },
        { label: "Request History", href: "/update-data/history" },
    ];

    if (requestDetail) {
        const status = requestDetail.status || 'draft';
        const category = requestDetail.request_type_label || requestDetail.update || requestDetail.category || 'Unknown';
        const currentRequestId = requestDetail.request_id || requestDetail.id || requestId;

        const formattedCategory = formatCategoryName(category);

        let editLabel = `Edit ${formattedCategory}`;
        if (status === 'draft') {
            editLabel = `Edit Draft - ${formattedCategory}`;
        } else if (status === 'rejected') {
            editLabel = `Revise Rejected - ${formattedCategory}`;
        } else if (status === 'waiting_approval') {
            editLabel = `Edit Pending - ${formattedCategory}`;
        }

        editLabel += ` (${currentRequestId})`;

        const finalItem = {
            label: editLabel,
            href: null,
            current: true
        };

        items.push(finalItem);
    } else {
        items.push({
            label: `Edit Request (${requestId})`,
            href: null,
            current: true
        });
    }

    return items;
}

/**
 * Get reviewer name from request detail
 * @param {Object} requestDetail - Request detail object
 * @returns {string} Reviewer name
 */
export const getReviewerName = (requestDetail) => {
    if (!requestDetail) return "System";

    // Priority: request_approver.name_approver (for Need Revision status)
    const approverName = requestDetail?.request_approver?.name_approver;
    if (approverName) return approverName;

    // Fallback to reviewer field
    const reviewer = requestDetail?.reviewer;
    if (!reviewer) return "System";
    if (typeof reviewer === "string") return reviewer;
    if (typeof reviewer === "object" && reviewer.name) return reviewer.name;
    return "System";
}

/**
 * Get reviewer avatar URL
 * @param {Object} requestDetail - Request detail object
 * @returns {string} Avatar URL
 */
export const getReviewerAvatar = (requestDetail) => {
    if (!requestDetail) return "https://i.pravatar.cc/120?u=system";

    const reviewer = requestDetail?.reviewer;
    if (!reviewer) return "https://i.pravatar.cc/120?u=system";
    if (typeof reviewer === "object" && reviewer.avatar) return reviewer.avatar;
    if (typeof reviewer === "string") return `https://i.pravatar.cc/120?u=${reviewer}`;
    return "https://i.pravatar.cc/120?u=reviewer";
}

/**
 * Get last updated date
 * @param {Object} requestDetail - Request detail object
 * @returns {string} Formatted date
 */
export const getLastUpdatedDate = (requestDetail) => {
    if (!requestDetail) return "-";
    const dateString = requestDetail?.date_change || requestDetail?.approved_at;
    return formatDate(dateString);
}

/**
 * Get review notes for need revision status
 * @param {Object} requestDetail - Request detail object
 * @returns {Array} Array of review notes
 */
export const getReviewNotesForNeedRevision = (requestDetail) => {
    const detail = requestDetail || {};

    // Determine need-revision context
    const raw = (detail.status_label || detail.status_alias || detail.status || '').toString().toLowerCase();
    const isNeedRevision = detail.status === '3' || detail.status === 3 || raw.includes('revision') || raw === 'need_revision';

    // If not in need revision, return any provided notes as-is
    const existingArr = detail.review_notes || detail.change_history || [];
    if (!isNeedRevision) return existingArr;

    const notes = [];

    // 1) Prefer direct note_hc from detail payload (latest)
    if (detail.note_hc) {
        notes.push({
            title: 'HC Review',
            content: detail.note_hc,
            reviewer: detail.request_approver?.name_approver || 'HC Team'
        });
    }

    // 2) If not available, use the most recent entry from history/review notes that has content
    const historyArr = Array.isArray(detail.change_history) ? detail.change_history
        : (Array.isArray(detail.review_notes) ? detail.review_notes : []);
    if (notes.length === 0 && Array.isArray(historyArr) && historyArr.length > 0) {
        const latest = [...historyArr].reverse().find(n => n?.note_hc || n?.note || n?.content);
        if (latest) {
            notes.push({
                title: latest.title || 'HC Review',
                content: latest.note_hc || latest.note || latest.content,
                reviewer: latest.request_approver?.name_approver || latest.reviewed_by || latest.reviewer_name || latest.reviewer || 'HC Team'
            });
        }
    }

    if (notes.length > 0) return notes;
    if (Array.isArray(existingArr) && existingArr.length > 0) return existingArr;

    // Safe fallback so section tetap muncul saat Need Revision dan ada note_hc
    if (isNeedRevision && detail.note_hc) {
        return [{ title: 'HC Review', content: detail.note_hc, reviewer: detail.request_approver?.name_approver || 'HC Team' }];
    }

    return [];
}

/**
 * Check if current request is in Need Revision status
 * @param {Object} requestDetail - Request detail object
 * @returns {boolean} True if need revision
 */
export const isNeedRevisionStatus = (requestDetail) => {
    const detail = requestDetail || {};
    const raw = (detail.status_label || detail.status_alias || detail.status || '').toString().toLowerCase();
    return detail.status === '3' || detail.status === 3 || raw.includes('revision') || raw === 'need_revision' || raw === 'rejected';
}
