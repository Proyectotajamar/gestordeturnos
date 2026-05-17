// Configuración Base
const OPERATORS = ["PARISI", "ANTONELLO", "POWELL"];

const SHIFTS = {
    weekday: [
        { name: "Mañana", time: "06:00 - 12:00", id: "morning" },
        { name: "Tarde", time: "12:00 - 18:00", id: "afternoon" },
        { name: "Noche", time: "18:00 - 00:00", id: "night" }
    ],
    sunday: [
        { name: "Único", time: "13:00 - 19:00", id: "sun_unified" }
    ]
};

const ROTATION_CYCLE = [
    { weekdays: ["PARISI", "ANTONELLO", "POWELL"] },
    { weekdays: ["ANTONELLO", "POWELL", "PARISI"] },
    { weekdays: ["POWELL", "PARISI", "ANTONELLO"] }
];

const HOLIDAYS = {
    "01-01": "Año Nuevo", "02-16": "Carnaval", "02-17": "Carnaval",
    "03-24": "Día de la Memoria", "04-02": "Día de Malvinas", "04-03": "Viernes Santo",
    "05-01": "Día del Trabajador", "05-25": "Revolución de Mayo", "06-17": "Gral. Güemes",
    "06-20": "Día de la Bandera", "07-09": "Día de la Independencia",
    "08-12": "Día del Trabajador de TV", "08-17": "Paso a la Inmortalidad San Martín",
    "09-24": "Virgen de la Merced", "10-12": "Diversidad Cultural",
    "11-20": "Soberanía Nacional", "12-08": "Inmaculada Concepción", "12-25": "Navidad"
};

let PREDEFINED_EXCEPTIONS = {};
const ANCHOR_DATE = new Date(2026, 4, 11);

function getInitialWeekOffset() {
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const anchorDateZero = new Date(ANCHOR_DATE.getFullYear(), ANCHOR_DATE.getMonth(), ANCHOR_DATE.getDate());
    const diffTime = todayDate.getTime() - anchorDateZero.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7);
}

let currentWeekOffset = getInitialWeekOffset();
let exceptionsData = {};
let currentEditingShiftId = null;

function getOperatorClass(operatorName) {
    if (!operatorName) return 'operator-free';
    const n = operatorName.toLowerCase();
    if (n === 'parisi') return 'operator-parisi';
    if (n === 'antonello') return 'operator-antonello';
    if (n === 'powell') return 'operator-powell';
    return 'operator-free';
}

function createShiftCard(shiftName, time, defaultOperator, shiftId, dayName, isAutoFranco, francoNote) {
    isAutoFranco = isAutoFranco || false;
    francoNote = francoNote || "Devolución por Domingo";
    const exceptionObj = exceptionsData[shiftId];
    let opName = defaultOperator;
    let displayType = '';
    let noteHtml = '';
    let cardClasses = '';
    let topBarHtml = '<div class="flex justify-between items-start mb-1"><span class="font-bold text-[10px] uppercase tracking-wider opacity-80">' + shiftName + '</span><span class="text-[10px] font-medium opacity-75">' + time + '</span></div>';

    if (exceptionObj) {
        opName = exceptionObj.operator;
        if (exceptionObj.type !== 'NORMAL') {
            displayType = '<div class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/60 inline-block mb-1 shadow-sm w-fit">' + exceptionObj.type + '</div>';
            if (exceptionObj.note) {
                noteHtml = '<div class="text-[10px] italic opacity-90 truncate mt-1" title="' + exceptionObj.note + '">📝 ' + exceptionObj.note + '</div>';
            }
            if (exceptionObj.type === 'VACACIONES') cardClasses = 'bg-orange-100 text-orange-900 border border-orange-300';
            else if (exceptionObj.type === 'MÉDICA') cardClasses = 'bg-red-100 text-red-900 border border-red-300';
            else if (exceptionObj.type === 'DEV' || exceptionObj.type === 'CUBRE') cardClasses = 'bg-teal-100 text-teal-900 border border-teal-300';
            else if (exceptionObj.type === 'FRANCO') cardClasses = 'bg-purple-100 text-purple-900 border border-purple-300';
            else cardClasses = getOperatorClass(opName);
        } else {
            cardClasses = getOperatorClass(opName);
        }
    } else if (isAutoFranco) {
        displayType = '<div class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 inline-block mb-1 shadow-sm w-fit">FRANCO COMP.</div>';
        noteHtml = '<div class="text-[10px] font-medium text-gray-500 mt-1">' + francoNote + '</div>';
        cardClasses = 'bg-gray-50 text-gray-400 border border-dashed border-gray-300';
        topBarHtml = '';
    } else {
        cardClasses = getOperatorClass(opName);
    }

    const opText = opName || "LIBRE";
    const safeShiftName = shiftName.replace(/"/g, '&quot;');

    return '<div onclick="openExceptionModal(\'' + shiftId + '\', \'' + (defaultOperator || '') + '\', \'' + safeShiftName + '\', \'' + dayName + '\')" class="mb-2 p-2 rounded-lg text-sm flex flex-col ' + cardClasses + ' shadow-sm transition-all hover:scale-[1.02] cursor-pointer ring-2 ring-transparent hover:ring-blue-400">' + topBarHtml + displayType + '<span class="font-bold leading-tight">' + opText + '</span>' + noteHtml + '</div>';
}

function renderCalendar() {
    let cycleIndex = ((currentWeekOffset % 3) + 3) % 3;
    const currentRotation = ROTATION_CYCLE[cycleIndex];

    const weekStartDate = new Date(ANCHOR_DATE);
    weekStartDate.setDate(ANCHOR_DATE.getDate() + (currentWeekOffset * 7));
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);

    const formatOpts = { day: 'numeric', month: 'short' };
    document.getElementById('weekDisplay').textContent = weekStartDate.toLocaleDateString('es-ES', formatOpts) + ' - ' + weekEndDate.toLocaleDateString('es-ES', formatOpts);
    document.getElementById('cycleDisplay').textContent = 'Rotación: Semana ' + (cycleIndex === 0 ? 'A' : (cycleIndex === 1 ? 'B' : 'C'));

    const grid = document.getElementById('calendarGrid');
    const desktopHeaders = document.getElementById('desktopHeaders');
    grid.innerHTML = '';
    desktopHeaders.innerHTML = '';

    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    days.forEach(function(day, index) {
        const currentDate = new Date(weekStartDate);
        currentDate.setDate(weekStartDate.getDate() + index);
        const dateString = currentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric' });
        const dayNameWithDate = day + ' ' + dateString;

        const monthKey = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dayKey = String(currentDate.getDate()).padStart(2, '0');
        const holidayName = HOLIDAYS[monthKey + '-' + dayKey];

        let headerExtraClasses = index > 0 ? "border-l border-gray-200" : "";
        let headerTextColors = index === 5 ? "text-indigo-600 bg-indigo-50/50" : (index === 6 ? "text-rose-600 bg-rose-50/50" : "text-gray-700");
        let holidayBadge = "";

        if (holidayName) {
            headerTextColors = "text-red-700 bg-red-100/90";
            holidayBadge = '<div class="text-[10px] uppercase font-bold text-red-600 mt-1 flex flex-col items-center justify-center gap-0.5"><span class="flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>' + holidayName + '</span><span class="text-[8px] bg-red-200/50 px-1 rounded text-red-700 border border-red-300">FERIADO</span></div>';
        }

        desktopHeaders.innerHTML += '<div class="p-3 text-center font-semibold hidden md:block ' + headerTextColors + ' ' + headerExtraClasses + '">' + dayNameWithDate + holidayBadge + '</div>';

        const dayCol = document.createElement('div');
        let extraClasses = index > 0 ? "border-t md:border-t-0 md:border-l border-gray-200" : "";
        let bgClasses = index === 5 ? "bg-indigo-50/30" : (index === 6 ? "bg-rose-50/30" : "bg-white");
        if (holidayName) bgClasses = "bg-red-50/60 border-red-200 shadow-inner";
        dayCol.className = 'p-3 flex flex-col ' + extraClasses + ' ' + bgClasses;

        const titleMargin = holidayName ? 'mb-1' : 'mb-3';
        const mobileTitle = document.createElement('div');
        mobileTitle.className = 'font-bold text-lg ' + titleMargin + ' md:hidden ' + (holidayName ? 'text-red-700' : (index === 5 ? 'text-indigo-600' : (index === 6 ? 'text-rose-600' : 'text-gray-800')));
        mobileTitle.textContent = dayNameWithDate;
        dayCol.appendChild(mobileTitle);

        if (holidayName) {
            const mobileHoliday = document.createElement('div');
            mobileHoliday.className = "text-[11px] font-bold text-red-600 mb-3 md:hidden uppercase flex flex-col items-start gap-0.5";
            mobileHoliday.innerHTML = '<span class="flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>' + holidayName + '</span><span class="text-[9px] bg-red-200/50 px-1 rounded text-red-700 border border-red-300 ml-5">FERIADO</span>';
            dayCol.appendChild(mobileHoliday);
        }

        let shiftsToRender = [];
        let operatorsForDay = [];
        
        let isDevDay = false;
        let devOp = null;
        let devNote = "";

        if (index >= 2 && index <= 4) {
            const dateKey = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + String(currentDate.getDate()).padStart(2, '0');
            if (PREDEFINED_EXCEPTIONS[dateKey] && (PREDEFINED_EXCEPTIONS[dateKey].type === 'DEV' || PREDEFINED_EXCEPTIONS[dateKey].type === 'FRANCO')) {
                isDevDay = true;
                devOp = PREDEFINED_EXCEPTIONS[dateKey].originalOp;
                devNote = PREDEFINED_EXCEPTIONS[dateKey].note || "Devolución";
            } else {
                const dayPrefix = 'w' + currentWeekOffset + '-d' + index + '-';
                for (let key in exceptionsData) {
                    if (key.startsWith(dayPrefix) && (exceptionsData[key].type === 'DEV' || exceptionsData[key].type === 'FRANCO')) {
                        isDevDay = true;
                        devOp = exceptionsData[key].operator;
                        devNote = exceptionsData[key].note || "Devolución manual";
                        if (!key.endsWith('dev_franco')) {
                            exceptionsData[dayPrefix + 'dev_franco'] = exceptionsData[key];
                            delete exceptionsData[key];
                        }
                        break;
                    }
                }
            }
        }

        if (holidayName) {
            let opWorking = null;
            const dateKey = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + String(currentDate.getDate()).padStart(2, '0');
            
            const dayPrefix = 'w' + currentWeekOffset + '-d' + index + '-';
            for (let key in exceptionsData) {
                if (key.startsWith(dayPrefix) && (exceptionsData[key].type === 'TRABAJA_FERIADO' || exceptionsData[key].type === 'NORMAL')) {
                    opWorking = exceptionsData[key].operator;
                    break;
                }
            }
            
            if (!opWorking && PREDEFINED_EXCEPTIONS[dateKey]) {
                if (PREDEFINED_EXCEPTIONS[dateKey].type === 'TRABAJA_FERIADO' || PREDEFINED_EXCEPTIONS[dateKey].type === 'NORMAL') {
                    opWorking = PREDEFINED_EXCEPTIONS[dateKey].originalOp;
                }
            }
            
            shiftsToRender = [
                { name: "Único", time: "13:00 - 19:00", id: "holiday_unified", isAutoFranco: false }
            ];
            operatorsForDay = [opWorking];
        } else if (isDevDay) {
            const workingOps = currentRotation.weekdays.filter(function(op) { return op !== devOp; });
            if (workingOps.length === 3) workingOps.pop();
            shiftsToRender = [
                { name: "Mañana", time: "08:00 - 14:00", id: "dev_morning", isAutoFranco: false },
                { name: "Tarde", time: "14:00 - 20:00", id: "dev_afternoon", isAutoFranco: false },
                { name: "Franco", time: "", id: "dev_franco", isAutoFranco: true, francoNote: devNote }
            ];
            operatorsForDay = [workingOps[0], workingOps[1], devOp];
        } else if (index < 5) {
            shiftsToRender = SHIFTS.weekday;
            operatorsForDay = currentRotation.weekdays;
        } else if (index === 5) {
            const isDividedSaturday = Math.abs(currentWeekOffset % 2) === 1;
            const nightOp = currentRotation.weekdays[2];
            const morningOp = currentRotation.weekdays[0];
            if (isDividedSaturday) {
                shiftsToRender = [
                    { name: "Mañana", time: "08:00 - 14:00", id: "sat_morning" },
                    { name: "Tarde", time: "14:00 - 20:00", id: "sat_afternoon" }
                ];
                operatorsForDay = [morningOp, nightOp];
            } else {
                shiftsToRender = [
                    { name: "Tarde (Único)", time: "14:00 - 20:00", id: "sat_unified" }
                ];
                operatorsForDay = [nightOp];
            }
        } else {
            shiftsToRender = SHIFTS.sunday;
            operatorsForDay = [currentRotation.weekdays[0]];
        }

        if (shiftsToRender.length > 0) {
            shiftsToRender.forEach(function(shift, shiftIndex) {
                const operator = operatorsForDay[shiftIndex] || null;
                const shiftId = 'w' + currentWeekOffset + '-d' + index + '-' + shift.id;
                const isAutoFranco = shift.isAutoFranco || false;

                const dateKey = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + String(currentDate.getDate()).padStart(2, '0');
                if (PREDEFINED_EXCEPTIONS[dateKey] && operator === PREDEFINED_EXCEPTIONS[dateKey].originalOp) {
                    if (!exceptionsData[shiftId]) {
                        exceptionsData[shiftId] = {
                            operator: "",
                            type: PREDEFINED_EXCEPTIONS[dateKey].type,
                            note: PREDEFINED_EXCEPTIONS[dateKey].note
                        };
                    }
                }

                dayCol.innerHTML += createShiftCard(shift.name, shift.time, operator, shiftId, dayNameWithDate, isAutoFranco, shift.francoNote);
            });
        } else {
            dayCol.innerHTML += '<div class="h-full flex items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50"><span class="text-gray-400 font-medium text-sm text-center">Jornada<br>Libre</span></div>';
        }

        grid.appendChild(dayCol);
    });
}

// Navigation
document.getElementById('prevWeek').addEventListener('click', function() {
    currentWeekOffset--;
    renderCalendar();
});
document.getElementById('todayWeek').addEventListener('click', function() {
    currentWeekOffset = getInitialWeekOffset();
    renderCalendar();
});
document.getElementById('nextWeek').addEventListener('click', function() {
    currentWeekOffset++;
    renderCalendar();
});

// CSV Import
function openImportModal() {
    document.getElementById('fileNameDisplay').textContent = "Ningún archivo seleccionado";
    document.getElementById('csvFileInput').value = "";
    document.getElementById('importModal').classList.remove('hidden');
}
function closeImportModal() {
    document.getElementById('importModal').classList.add('hidden');
}

function processCSVFile() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];
    if (!file) return;
    document.getElementById('fileNameDisplay').textContent = 'Procesando: ' + file.name + '...';

    const reader = new FileReader();
    reader.readAsText(file, 'ISO-8859-1');
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).map(function(l) { return l.split(/[,;]/); });
        let count = 0;
        const cutoffDate = new Date(2026, 4, 11);
        PREDEFINED_EXCEPTIONS = {};

        for (let i = 0; i < lines.length; i++) {
            const row = lines[i];
            let dateMap = {};
            let hasDates = false;

            for (let j = 0; j < row.length; j++) {
                const cell = (row[j] || '').replace(/"/g, '').trim();
                const dateMatch = cell.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                const dateMatchIso = cell.match(/^(\d{4})-(\d{2})-(\d{2})/);

                if (dateMatch) {
                    const d = parseInt(dateMatch[1], 10), m = parseInt(dateMatch[2], 10), y = parseInt(dateMatch[3], 10);
                    const dateObj = new Date(y, m - 1, d);
                    if (dateObj >= cutoffDate) {
                        dateMap[j] = y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
                        hasDates = true;
                    }
                } else if (dateMatchIso) {
                    const y = parseInt(dateMatchIso[1], 10), m = parseInt(dateMatchIso[2], 10), d = parseInt(dateMatchIso[3], 10);
                    const dateObj = new Date(y, m - 1, d);
                    if (dateObj >= cutoffDate) {
                        dateMap[j] = y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
                        hasDates = true;
                    }
                }
            }

            if (hasDates) {
                let k = i + 1, shiftRows = 0;
                while (k < lines.length && shiftRows < 15) {
                    const shiftRow = lines[k];
                    if (!shiftRow) { k++; continue; }
                    const firstCell = (shiftRow[0] || '').replace(/"/g, '').trim().toUpperCase();
                    if (firstCell === 'HORARIO' || firstCell === 'FECHA') break;

                    for (const colIndex in dateMap) {
                        const cellValue = (shiftRow[colIndex] || '').replace(/"/g, '').trim().toUpperCase();
                        
                        let op = null;
                        if (cellValue.includes('PARISI')) op = 'PARISI';
                        else if (cellValue.includes('ANTO')) op = 'ANTONELLO';
                        else if (cellValue.includes('POWELL')) op = 'POWELL';

                        let isHolidayDate = false;
                        if (dateMap[colIndex]) {
                            const dp = dateMap[colIndex].split('-');
                            isHolidayDate = !!HOLIDAYS[dp[1] + '-' + dp[2]];
                        }

                        // Robust Holiday Operator Detection
                        if (isHolidayDate && op) {
                            if (!cellValue.includes('FRANCO') && !cellValue.includes('DEV') && !cellValue.includes('VACACION') && !cellValue.includes('MÉDICA') && !cellValue.includes('MEDICA') && !cellValue.includes('LIBRE')) {
                                PREDEFINED_EXCEPTIONS[dateMap[colIndex]] = { originalOp: op, type: 'TRABAJA_FERIADO', note: cellValue };
                                count++;
                                continue;
                            }
                        }

                        if (cellValue.includes('DEV') || cellValue.includes('VACACION') || cellValue.includes('MÉDICA') || cellValue.includes('MEDICA') || cellValue.includes('TRABAJA') || cellValue.includes('13 A 19') || cellValue.includes('13A19') || cellValue.includes('FERIADO')) {
                            let type = 'NORMAL';
                            if (cellValue.includes('DEV')) type = 'DEV';
                            else if (cellValue.includes('VACACION')) type = 'VACACIONES';
                            else if (cellValue.includes('MEDICA') || cellValue.includes('MÉDICA')) type = 'MÉDICA';
                            else if (cellValue.includes('TRABAJA') || cellValue.includes('13 A 19') || cellValue.includes('13A19')) type = 'TRABAJA_FERIADO';
                            else if (cellValue.includes('FERIADO')) type = 'FERIADO';

                            if (type && op) {
                                PREDEFINED_EXCEPTIONS[dateMap[colIndex]] = { originalOp: op, type: type, note: cellValue };
                                count++;
                            }
                        }
                    }
                    k++;
                    shiftRows++;
                }
            }
        }

        alert('¡Importación CSV Exitosa!\n\nSe detectaron y cargaron ' + count + ' novedades y devoluciones en tu ciclo.');
        renderCalendar();
        closeImportModal();
    };
    reader.onerror = function() {
        alert("Hubo un error al intentar leer el archivo CSV.");
        closeImportModal();
    };
}

// Exception Modal
function openExceptionModal(shiftId, defaultOp, shiftName, dayName) {
    currentEditingShiftId = shiftId;
    const ex = exceptionsData[shiftId] || {};
    document.getElementById('modalShiftInfo').textContent = dayName + ' - Turno ' + shiftName;
    document.getElementById('excOperator').value = ex.operator !== undefined ? ex.operator : defaultOp;
    document.getElementById('excType').value = ex.type || 'NORMAL';
    document.getElementById('excNote').value = ex.note || '';
    document.getElementById('exceptionModal').classList.remove('hidden');
}
function closeExceptionModal() {
    document.getElementById('exceptionModal').classList.add('hidden');
    currentEditingShiftId = null;
}
function saveException() {
    if (!currentEditingShiftId) return;
    const op = document.getElementById('excOperator').value;
    const type = document.getElementById('excType').value;
    const note = document.getElementById('excNote').value;
    exceptionsData[currentEditingShiftId] = { operator: op, type: type, note: note };
    closeExceptionModal();
    renderCalendar();
}

// Close modals on backdrop click
document.getElementById('exceptionModal').addEventListener('click', function(e) { if (e.target === this) closeExceptionModal(); });
document.getElementById('importModal').addEventListener('click', function(e) { if (e.target === this) closeImportModal(); });

// Init
renderCalendar();
