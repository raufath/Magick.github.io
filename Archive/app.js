
const app = Vue.createApp({
    data() {
        return {
            guests: [],
            newGuest: {
                id: '',
                tableNumber: '',
                name: '',
                numberOfPax: 0,
                villaNumber: '',
                remarks: '',
                section: '',
                timestamp: ''
            },
            searchTerm: '',
            sectionFilter: '',
            sortColumn: '',
            sortDirection: 'asc',
            editing: null,
            openDropdownIndex: null,
            expandedRemarksIndex: null,
            showAddGuestModal: false,
            notes: '',
            showNotesModal: false,
            editingNotes: false
        };
    },
    computed: {
        filteredGuests() {
            let result = this.guests;
            if (this.searchTerm) {
                const term = this.searchTerm.toLowerCase();
                result = result.filter(guest =>
                    guest.name.toLowerCase().includes(term) ||
                    guest.tableNumber.toLowerCase().includes(term) ||
                    guest.villaNumber.toLowerCase().includes(term)
                );
            }
            if (this.sectionFilter) {
                result = result.filter(guest => guest.section === this.sectionFilter);
            }
            return result;
        },
        sortedGuests() {
            return this.filteredGuests.sort((a, b) => {
                const valA = a[this.sortColumn] ? a[this.sortColumn].toString().toLowerCase() : '';
                const valB = b[this.sortColumn] ? b[this.sortColumn].toString().toLowerCase() : '';
                if (this.sortDirection === 'asc') {
                    return valA.localeCompare(valB);
                }
                return valB.localeCompare(valA);
            });
        },
        totalGuests() {
            return this.filteredGuests.reduce((total, guest) => total + guest.numberOfPax, 0);
        },
        totalRooms() {
            const roomNumbers = new Set(this.filteredGuests.map(guest => guest.tableNumber));
            return roomNumbers.size;
        }
    },
    methods: {
        addGuest() {
            if (this.validateGuest(this.newGuest)) {
                this.newGuest.id = Date.now();
                this.newGuest.timestamp = new Date().toISOString();
                this.guests.push({ ...this.newGuest });
                this.resetNewGuest();
                this.saveGuests();
                this.closeAddGuestModal();
                this.showSuccessMessage('Guest added successfully.');
            }
        },
        editGuest(index) {
            this.editing = index;
            this.expandedRemarksIndex = index;
        },
        saveGuest(index) {
            if (this.validateGuest(this.sortedGuests[index])) {
                this.editing = null;
                this.openDropdownIndex = null;
                this.expandedRemarksIndex = null;
                this.saveGuests();
                this.showSuccessMessage('Guest updated successfully.');
            }
        },
        deleteGuest(index) {
            if (confirm('Are you sure you want to delete this guest?')) {
                this.guests.splice(index, 1);
                this.openDropdownIndex = null;
                this.expandedRemarksIndex = null;
                this.saveGuests();
                this.showSuccessMessage('Guest deleted successfully.');
            }
        },
        resetNewGuest() {
            this.newGuest = {
                id: '',
                tableNumber: '',
                name: '',
                numberOfPax: 0,
                villaNumber: '',
                remarks: '',
                section: '',
                timestamp: ''
            };
        },
        validateGuest(guest) {
            return (
                guest.name.trim() !== '' &&
                guest.tableNumber.trim() !== '' &&
                guest.numberOfPax > 0
            );
        },
        saveGuests() {
            localStorage.setItem('guests', JSON.stringify(this.guests));
            localStorage.setItem('notes', this.notes);
        },
        loadGuests() {
            const data = localStorage.getItem('guests');
            if (data) {
                this.guests = JSON.parse(data);
            }
            const notesData = localStorage.getItem('notes');
            if (notesData) {
                this.notes = notesData;
            }
        },
        exportToPDF() {
            window.jsPDF = window.jspdf.jsPDF;

            const doc = new jsPDF();
        
            // Add guest list table to the PDF
            const tableHeaders = ['Table Number', 'Guest Name', 'Number of Pax', 'Villa Number', 'Remarks', 'Section', 'Timestamp'];
            const tableData = this.guests.map(guest => [
                guest.tableNumber,
                guest.name,
                guest.numberOfPax,
                guest.villaNumber,
                guest.remarks,
                guest.section,
                this.formatTimestamp(guest.timestamp)
            ]);

            let today = new Date();
            let dateStr = (today.getMonth() + 1) + '/' + today.getDate() + '/' + today.getFullYear();

            doc.text('Tasting Table Guest Tracker', doc.internal.pageSize.getWidth() / 2, 10, { align: 'center' });
            doc.text('Date: ' + dateStr, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
            doc.text('Guest Count: ' + tableData.length, doc.internal.pageSize.getWidth() / 3, 20, { align: 'center' });
            let imgData = 'data:images/jpeg;base64,...'; // Base64 Data of your logo
            doc.addImage(imgData, 'JPEG', 160, 10, 40, 40); // Adjust the coordinates and size as needed

        
            doc.autoTable({
                head: [tableHeaders],
                body: tableData,
                styles: {
                    fontSize: 7,
                    cellPadding: 1,
                },
                headStyles: {
                    fillColor: [41, 128, 185],
                    textColor: 255,
                    fontStyle: 'bold',
                },
                columnStyles: {
                    0: {cellWidth: 25}, // Set width of first column table number
                    1: {cellWidth: 40}, // Set width of second column guest name
                    2: {cellWidth: 20}, // Set width of third column
                    3: {cellWidth: 20}, // Set width of fourth column
                    4: {cellWidth: 50}, // Set width of fifth column
                    5: {cellWidth: 15}, // Set width of sixth column
                    6: {cellWidth: 25}, // Set width of seventh column
                },
                margin: {left: 7}, // Adjust left margin
            });
        
            doc.save('guest_list.pdf');
        },
        formatTimestamp(timestamp) {
            if (timestamp) {
                return new Date(timestamp).toLocaleString();
            }
            return '';
        },
        toggleDropdown(index) {
            if (this.openDropdownIndex === index) {
                this.openDropdownIndex = null;
            } else {
                this.openDropdownIndex = index;
            }
        },
        expandRemarksCell(index) {
            if (this.expandedRemarksIndex === index) {
                this.expandedRemarksIndex = null;
            } else {
                this.expandedRemarksIndex = index;
            }
        },
        openAddGuestModal() {
            this.showAddGuestModal = true;
        },
        closeAddGuestModal() {
            this.showAddGuestModal = false;
            this.resetNewGuest();
        },
        resetAll() {
            if (confirm('Are you sure you want to reset all data?')) {
                this.guests = [];
                this.notes = '';
                this.saveGuests();
                this.showSuccessMessage('All data has been reset.');
            }
        },
        toggleNotesModal() {
            this.showNotesModal = !this.showNotesModal;
            this.editingNotes = false;

            if (this.showNotesModal) {
                // Replace asterisk marks with bold spans when showing notes
                this.notes = this.notes.replace(/\*([^*]*)\*/g, '<span class="bold">$1</span>');

                // Convert HTML markup to actual elements
                const notesContainer = document.createElement('div');
                notesContainer.innerHTML = this.notes;
                this.notes = notesContainer.textContent;
            } else {
                // Remove bold spans when editing notes
                this.notes = this.notes.replace(/<span class="bold">(.*?)<\/span>/g, '$1');
            }

            if (this.showNotesModal) {
                this.$nextTick(() => {
                    this.$refs.notesTextarea.style.height = 'auto';
                    this.$refs.notesTextarea.style.height = this.$refs.notesTextarea.scrollHeight + 'px';
                });
            }
        },
        editNotes() {
            this.editingNotes = true;
        },
        saveNotes() {
            this.saveGuests();
            this.editingNotes = false;
        },
        showSuccessMessage(message) {
            // Implement your success message functionality here
            console.log(message);
        }
    },
    mounted() {
        this.loadGuests();
    }
});

app.mount('#app');