// --- OOP Class Definitions ---

// --- Helper Utilities ---

/**
 * Converts "HH:MM" time string to minutes since midnight.
 */
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Converts a day index (0-4) to a string.
 */
function dayFromIndex(index) {
    return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][index];
}

/**
 * Converts a time slot index (0-8) to an "HH:MM" string.
 * 0 -> "09:00", 1 -> "10:00", ..., 8 -> "17:00"
 */
function timeFromIndex(index) {
    const hour = 9 + index;
    return `${hour.toString().padStart(2, '0')}:00`;
}

/**
 * 1. Base Class: Period
 * Represents a single class period.
 */
class Period {
    constructor(subjectName, startTime, endTime, dayOfWeek) {
        if (!subjectName || !startTime || !endTime || !dayOfWeek) {
            throw new Error("Missing required fields for Period.");
        }
        this.subjectName = subjectName;
        this.startTime = startTime;
        this.endTime = endTime;
        this.dayOfWeek = dayOfWeek;
        this.roomNumber = "TBD";
        
        this.startMinutes = timeToMinutes(startTime);
        this.endMinutes = timeToMinutes(endTime);
        
        if (this.endMinutes <= this.startMinutes) {
            throw new Error("End time must be after start time.");
        }
    }

    /**
     * Returns details for rendering. This is the base version.
     */
    displayDetails() {
        if (this.subjectName === "LUNCH") {
            return {
                subject: "LUNCH",
                details: "Break",
                bgColor: "bg-gray-100",
                type: "Break"
            };
        }
        if (this.subjectName === "BREAK") {
            return {
                subject: "Break",
                details: "---",
                bgColor: "bg-gray-50",
                type: "Break"
            };
        }
        return {
            subject: this.subjectName,
            details: `Room: ${this.roomNumber}`,
            bgColor: 'bg-gray-200',
            type: "Period"
        };
    }
}

/**
 * 2. Inheritance: Lecture Class
 * Inherits from Period, 1 hour duration.
 */
class Lecture extends Period {
    constructor(subjectName, professorName, dayOfWeek, startTime) {
        const startHour = parseInt(startTime.split(':')[0], 10);
        const startIndex = startHour - 9;
        const endIndex = startIndex + 1;
        const endTime = timeFromIndex(endIndex);
        super(subjectName, startTime, endTime, dayOfWeek);
        this.professorName = professorName || 'TBD';
    }

    /**
     * 3. Polymorphism (Method Overriding)
     */
    displayDetails() {
        return {
            subject: this.subjectName,
            details: `<strong>Prof:</strong> ${this.professorName}`,
            bgColor: 'bg-blue-100',
            type: "Lecture"
        };
    }
}

/**
 * 2. Inheritance: Lab Class
 * Inherits from Period, 2 hour duration.
 */
class Lab extends Period {
    constructor(subjectName, labAssistantName, dayOfWeek, startTime) {
        const startHour = parseInt(startTime.split(':')[0], 10);
        const startIndex = startHour - 9;
        const endIndex = startIndex + 2;
        const endTime = timeFromIndex(endIndex);
        super(subjectName, startTime, endTime, dayOfWeek);
        this.labAssistantName = labAssistantName || 'TBD';
    }

    /**
     * 3. Polymorphism (Method Overriding)
     */
    displayDetails() {
        return {
            subject: this.subjectName,
            details: `<strong>Asst:</strong> ${this.labAssistantName}`,
            bgColor: 'bg-green-100',
            type: "Lab"
        };
    }
}

/**
 * 5. Exception Handling: Custom Exception
 */
class ScheduleConflictException extends Error {
    constructor(message) {
        super(message);
        this.name = "ScheduleConflictException";
    }
}

/**
 * 4. TimeTableGenerator Class
 * This class contains the logic to build the schedule.
 */
class TimeTableGenerator {
    constructor() {
        this.DAYS = 5;
        this.HOURS = 9;
        this.LUNCH_SLOT = 4;
        this.BREAK_SLOT = 5;
        this.grid = [];
        this.finalSchedule = [];
        this.initGrid();
    }

    initGrid() {
        this.grid = Array(this.DAYS).fill(null).map(() => Array(this.HOURS).fill(null));
        for (let d = 0; d < this.DAYS; d++) {
            const lunchPeriod = new Period("LUNCH", "13:00", "14:00", dayFromIndex(d));
            this.grid[d][this.LUNCH_SLOT] = lunchPeriod;

            const breakPeriod = new Period("BREAK", "14:00", "15:00", dayFromIndex(d));
            this.grid[d][this.BREAK_SLOT] = breakPeriod;
        }
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    isSubjectOnDay(subjectName, dayIndex) {
        for (let h = 0; h < this.HOURS; h++) {
            const period = this.grid[dayIndex][h];
            if (period && period.subjectName === subjectName) {
                return true;
            }
        }
        return false;
    }

    generate(lecturesToSchedule, labsToSchedule) {
        this.initGrid();
        this.finalSchedule = [];
        let periodsToPlace = [];

        // Validate input
        if (!Array.isArray(lecturesToSchedule) || !Array.isArray(labsToSchedule)) {
            throw new Error("Invalid input: lectures and labs must be arrays");
        }

        // Calculate total periods needed
        let totalPeriods = 0;
        for (const lect of lecturesToSchedule) {
            if (!lect.name || !lect.professor || !lect.count) {
                throw new Error("Invalid lecture data");
            }
            totalPeriods += lect.count;
        }
        for (const lab of labsToSchedule) {
            if (!lab.name || !lab.assistant || !lab.count) {
                throw new Error("Invalid lab data");
            }
            totalPeriods += lab.count * 2; // Labs take 2 slots
        }

        // Check if schedule is possible
        const availableSlots = this.DAYS * (this.HOURS - 2); // Minus lunch and break
        if (totalPeriods > availableSlots) {
            throw new ScheduleConflictException(
                `Too many classes to schedule! You need ${totalPeriods} slots but only ${availableSlots} are available. Please reduce the number of classes.`
            );
        }

        for (const lect of lecturesToSchedule) {
            for (let i = 0; i < lect.count; i++) {
                periodsToPlace.push({
                    type: 'lecture',
                    name: lect.name,
                    professor: lect.professor
                });
            }
        }
        for (const lab of labsToSchedule) {
            for (let i = 0; i < lab.count; i++) {
                periodsToPlace.push({
                    type: 'lab',
                    name: lab.name,
                    assistant: lab.assistant
                });
            }
        }

        this.shuffle(periodsToPlace);

        for (const periodInfo of periodsToPlace) {
            let isPlaced = false;
            
            // Increased attempts for better placement
            for (let attempt = 0; attempt < 200; attempt++) {
                const d = Math.floor(Math.random() * this.DAYS);
                const h = Math.floor(Math.random() * this.HOURS);
                
                if (this.isSubjectOnDay(periodInfo.name, d)) {
                    continue;
                }

                if (periodInfo.type === 'lab') {
                    if (h < this.HOURS - 1 && this.grid[d][h] === null && this.grid[d][h+1] === null) {
                        const startTime = timeFromIndex(h);
                        const newLab = new Lab(periodInfo.name, periodInfo.assistant, dayFromIndex(d), startTime);
                        
                        this.grid[d][h] = newLab;
                        this.grid[d][h+1] = newLab;
                        this.finalSchedule.push(newLab);
                        isPlaced = true;
                        break;
                    }
                } else if (periodInfo.type === 'lecture') {
                    if (this.grid[d][h] === null) {
                        const startTime = timeFromIndex(h);
                        const newLecture = new Lecture(periodInfo.name, periodInfo.professor, dayFromIndex(d), startTime);
                        
                        this.grid[d][h] = newLecture;
                        this.finalSchedule.push(newLecture);
                        isPlaced = true;
                        break;
                    }
                }
            }

            if (!isPlaced) {
                throw new ScheduleConflictException(
                    `Could not find a spot for "${periodInfo.name}". The schedule might be too full. Please try generating again or reduce the number of classes.`
                );
            }
        }
        
        return this.grid;
    }
}

// --- Application Logic ---
const generator = new TimeTableGenerator();
let subjects = [];
let labs = [];

// DOM Element References
const lectureForm = document.getElementById('add-lecture-form');
const labForm = document.getElementById('add-lab-form');
const subjectsList = document.getElementById('subjects-list');
const emptySubjectsMsg = document.getElementById('empty-subjects-msg');
const generateBtn = document.getElementById('generate-btn');
const timetableGrid = document.getElementById('timetable-grid');
const emptyScheduleMsg = document.getElementById('empty-schedule-msg');
const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');
const downloadPdfBtn = document.getElementById('download-pdf-btn');

/**
 * Renders the list of subjects and labs to be scheduled.
 */
function renderSubjectsList() {
    subjectsList.innerHTML = '';
    
    subjects.forEach((item, index) => {
        const itemHtml = `
            <div class="bg-blue-50 border-blue-200 border p-2 rounded-md flex justify-between items-center">
                <span class="text-sm font-medium">${item.name} (${item.count}/week)</span>
                <button class="delete-item-btn text-red-500 hover:text-red-700 text-lg font-bold" data-index="${index}" data-type="lecture" title="Remove">&times;</button>
            </div>
        `;
        subjectsList.insertAdjacentHTML('beforeend', itemHtml);
    });

    labs.forEach((item, index) => {
        const itemHtml = `
            <div class="bg-green-50 border-green-200 border p-2 rounded-md flex justify-between items-center">
                <span class="text-sm font-medium">${item.name} (${item.count}/week)</span>
                <button class="delete-item-btn text-red-500 hover:text-red-700 text-lg font-bold" data-index="${index}" data-type="lab" title="Remove">&times;</button>
            </div>
        `;
        subjectsList.insertAdjacentHTML('beforeend', itemHtml);
    });

    if (subjects.length === 0 && labs.length === 0) {
        subjectsList.innerHTML = '<p id="empty-subjects-msg" class="text-gray-500 text-sm">No subjects added yet.</p>';
    }
}

/**
 * Renders the final timetable grid.
 */
function renderTimetable(grid) {
    try {
        timetableGrid.innerHTML = '';

        if (!grid || !Array.isArray(grid)) {
            throw new Error("Invalid grid data");
        }

        const table = document.createElement('table');

        const thead = document.createElement('thead');
        let headerRow = '<tr><th class="time-slot">Time</th>';
        for (let d = 0; d < generator.DAYS; d++) {
            headerRow += `<th>${dayFromIndex(d)}</th>`;
        }
        headerRow += '</tr>';
        thead.innerHTML = headerRow;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        for (let h = 0; h < generator.HOURS; h++) {
            const tr = document.createElement('tr');

            const timeSlot = `${timeFromIndex(h)} - ${timeFromIndex(h + 1)}`;
            const timeTd = document.createElement('td');
            timeTd.className = 'time-slot';
            timeTd.textContent = timeSlot;
            tr.appendChild(timeTd);

            for (let d = 0; d < generator.DAYS; d++) {
                const period = grid[d][h];

                if (h > 0 && grid[d][h - 1] === period && period instanceof Lab) {
                    const emptyTd = document.createElement('td');
                    emptyTd.style.display = 'none';
                    tr.appendChild(emptyTd);
                    continue;
                }

                if (period) {
                    const details = period.displayDetails();
                    const td = document.createElement('td');
                    td.className = `period-cell ${details.bgColor}`;
                    td.innerHTML = `
                        <strong>${escapeHtml(details.subject)}</strong>
                        <span>${details.details}</span>
                    `;
                    if (period instanceof Lab) {
                        td.rowSpan = 2;
                    }
                    tr.appendChild(td);
                } else {
                    const emptyTd = document.createElement('td');
                    tr.appendChild(emptyTd);
                }
            }
            tbody.appendChild(tr);
        }

        table.appendChild(tbody);
        timetableGrid.appendChild(table);

        if (emptyScheduleMsg) {
            emptyScheduleMsg.style.display = 'none';
        }
    } catch (error) {
        console.error("Error rendering timetable:", error);
        showMessage("Failed to render timetable. Please try again.", 'error');
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showMessage(message, type) {
    messageText.textContent = message;
    messageBox.className = `fixed top-5 left-1/2 -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg w-11/12 max-w-lg text-center text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} visible`;
    
    setTimeout(() => {
        messageBox.classList.remove('visible');
    }, 4000);
}

function downloadPDF() {
    try {
        const jsPDFConstructor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        if (!jsPDFConstructor) {
            console.error("jsPDF not found on window. Make sure you included jsPDF.");
            showMessage("PDF export failed: jsPDF not loaded.", 'error');
            return;
        }
        const doc = new jsPDFConstructor({ orientation: 'landscape' });

        if (typeof doc.autoTable !== 'function') {
            console.error("autoTable plugin not found on jsPDF instance.");
            showMessage("PDF export failed: autoTable plugin not loaded.", 'error');
            return;
        }

        const table = document.querySelector('#timetable-grid table');
        if (!table) {
            showMessage("No timetable found to export.", 'error');
            return;
        }

        // Disable button during export
        downloadPdfBtn.disabled = true;
        downloadPdfBtn.textContent = 'Exporting...';

        const thead = table.querySelector('thead');
        const headers = thead
            ? Array.from(thead.querySelectorAll('th')).map(th => th.innerText.trim())
            : [];

        const tbody = table.querySelector('tbody');
        const rows = [];
        if (tbody) {
            for (const tr of Array.from(tbody.querySelectorAll('tr'))) {
                const cells = Array.from(tr.querySelectorAll('th, td'));
                const row = cells.map(cell => {
                    if (cell.style && cell.style.display === 'none') return '';
                    return (cell.innerText || '').trim();
                });
                rows.push(row);
            }
        }

        doc.setFontSize(12);
        doc.text("University Weekly Timetable", 14, 16);

        doc.autoTable({
            head: headers.length ? [headers] : [],
            body: rows,
            startY: 20,
            theme: 'grid',
            styles: { fontSize: 6, cellPadding: 1, minCellHeight: 10, halign: 'center', valign: 'middle' },
            headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 28 }
            },
            overflow: 'linebreak'
        });

        doc.save('university-timetable.pdf');
        showMessage("PDF downloaded successfully!", 'success');

    } catch (e) {
        console.error("Error generating PDF:", e);
        showMessage("Could not generate PDF. Please try again.", 'error');
    } finally {
        // Re-enable button
        downloadPdfBtn.disabled = false;
        downloadPdfBtn.textContent = 'Download PDF';
    }
}

lectureForm.addEventListener('submit', (e) => {
    e.preventDefault();
    try {
        const name = document.getElementById('lecture-name').value.trim();
        const professor = document.getElementById('professor-name').value.trim();
        const count = parseInt(document.getElementById('lecture-count').value, 10);

        // Validation
        if (!name || name.length > 50) {
            showMessage("Subject name must be between 1-50 characters.", 'error');
            return;
        }
        if (!professor || professor.length > 50) {
            showMessage("Professor name must be between 1-50 characters.", 'error');
            return;
        }
        if (isNaN(count) || count < 1 || count > 5) {
            showMessage("Classes per week must be between 1-5.", 'error');
            return;
        }

        // Check for duplicates
        if (subjects.some(s => s.name.toLowerCase() === name.toLowerCase())) {
            showMessage("This lecture subject already exists.", 'error');
            return;
        }

        subjects.push({ name, professor, count });
        renderSubjectsList();
        lectureForm.reset();
        document.getElementById('lecture-count').value = 3;
    } catch (error) {
        console.error("Error adding lecture:", error);
        showMessage("Failed to add lecture. Please try again.", 'error');
    }
});

labForm.addEventListener('submit', (e) => {
    e.preventDefault();
    try {
        const name = document.getElementById('lab-name').value.trim();
        const assistant = document.getElementById('lab-assistant').value.trim();
        const count = parseInt(document.getElementById('lab-count').value, 10);

        // Validation
        if (!name || name.length > 50) {
            showMessage("Lab name must be between 1-50 characters.", 'error');
            return;
        }
        if (!assistant || assistant.length > 50) {
            showMessage("Assistant name must be between 1-50 characters.", 'error');
            return;
        }
        if (isNaN(count) || count < 1 || count > 5) {
            showMessage("Labs per week must be between 1-5.", 'error');
            return;
        }

        // Check for duplicates
        if (labs.some(l => l.name.toLowerCase() === name.toLowerCase())) {
            showMessage("This lab subject already exists.", 'error');
            return;
        }

        labs.push({ name, assistant, count });
        renderSubjectsList();
        labForm.reset();
        document.getElementById('lab-count').value = 1;
    } catch (error) {
        console.error("Error adding lab:", error);
        showMessage("Failed to add lab. Please try again.", 'error');
    }
});

subjectsList.addEventListener('click', (e) => {
    try {
        const deleteButton = e.target.closest('.delete-item-btn');
        if (deleteButton) {
            const type = deleteButton.dataset.type;
            const index = parseInt(deleteButton.dataset.index, 10);
           
            if (isNaN(index) || index < 0) {
                throw new Error("Invalid index");
            }

            if (type === 'lecture' && index < subjects.length) {
                subjects.splice(index, 1);
            } else if (type === 'lab' && index < labs.length) {
                labs.splice(index, 1);
            }
            
            renderSubjectsList();
        }
    } catch (error) {
        console.error("Error deleting subject:", error);
        showMessage("Failed to delete subject. Please try again.", 'error');
    }
});

generateBtn.addEventListener('click', () => {
    if (subjects.length === 0 && labs.length === 0) {
        showMessage("Please add at least one subject or lab to schedule.", 'error');
        return;
    }
    
    // Disable button to prevent multiple clicks
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
        try {
            const generatedGrid = generator.generate(subjects, labs);
            renderTimetable(generatedGrid);
            showMessage("Timetable generated successfully!", 'success');
            downloadPdfBtn.classList.remove('hidden');

            // Scroll to timetable on mobile
            if (window.innerWidth < 1024) {
                setTimeout(() => {
                    const timetableContainer = document.getElementById('timetable-container');
                    if (timetableContainer) {
                        timetableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 500);
            }
        } catch (e) {
            if (e instanceof ScheduleConflictException) {
                console.warn(e.message);
                showMessage(e.message, 'error');
            } else {
                console.error(e);
                showMessage("An unexpected error occurred. Please try again.", 'error');
            }
        } finally {
            // Re-enable button
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Timetable';
        }
    }, 100);
});

downloadPdfBtn.addEventListener('click', downloadPDF);

document.addEventListener('DOMContentLoaded', () => {
    renderSubjectsList();
});
