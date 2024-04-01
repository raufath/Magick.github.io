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
          showEditGuestModal: false,
          editedGuest: {
              id: '',
              tableNumber: '',
              name: '',
              numberOfPax: 0,
              villaNumber: '',
              remarks: '',
              section: '',
              timestamp: ''
          },
          notes: '',
          showNotesModal: false,
          editingNotes: false,
          dataTable: null
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
          return this.filteredGuests;
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
      async addGuest() {
          if (this.validateGuest(this.newGuest)) {
              this.newGuest.id = Date.now();
              this.newGuest.timestamp = new Date().toISOString();
              this.guests.push({ ...this.newGuest });
              this.resetNewGuest();
              await this.saveGuests();
              this.closeAddGuestModal();
              this.showSuccessMessage('Guest added successfully.');
              this.refreshDataTable();
          }
      },
      openEditGuestModal(guest) {
          this.editedGuest = { ...guest };
          this.showEditGuestModal = true;
      },
      closeEditGuestModal() {
          this.showEditGuestModal = false;
          this.editedGuest = {
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
      async saveEditedGuest() {
          if (this.validateGuest(this.editedGuest)) {
              const index = this.guests.findIndex(guest => guest.id === this.editedGuest.id);
              if (index !== -1) {
                  this.guests.splice(index, 1, { ...this.editedGuest });
                  await this.saveGuests();
                  this.closeEditGuestModal();
                  this.showSuccessMessage('Guest updated successfully.');
                  this.refreshDataTable();
              }
          }
      },
      async deleteGuest(guest) {
          if (confirm('Are you sure you want to delete this guest?')) {
              const index = this.guests.findIndex(g => g.id === guest.id);
              if (index !== -1) {
                  this.guests.splice(index, 1);
                  await this.saveGuests();
                  this.showSuccessMessage('Guest deleted successfully.');
                  this.refreshDataTable();
              }
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
      async saveGuests() {
          try {
              console.log('Sending data to server:', {
                  action: 'saveGuests',
                  guests: this.guests,
                  notes: this.notes,
              });

              const response = await fetch('server.php', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                      action: 'saveGuests',
                      guests: this.guests,
                      notes: this.notes,
                  }),
              });
              const data = await response.json();
              if (data.success) {
                  console.log('Data saved successfully');
                  localStorage.setItem('guestData', JSON.stringify({
                      guests: this.guests,
                      notes: this.notes
                  }));
              } else {
                  console.error('Error saving data:', data.error);
              }
          } catch (error) {
              console.error('Error saving data:', error);
          }
      },
      async loadGuests() {
          try {
              const timestamp = new Date().getTime();
              const response = await fetch(`server.php?action=loadGuests&t=${timestamp}`);
              const data = await response.json();
              this.guests = data.guests || [];
              this.notes = data.notes || '';
          } catch (error) {
              console.error('Error loading data:', error);
              throw error;
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
                  0: { cellWidth: 25 }, // Set width of first column table number
                  1: { cellWidth: 40 }, // Set width of second column guest name
                  2: { cellWidth: 20 }, // Set width of third column
                  3: { cellWidth: 20 }, // Set width of fourth column
                  4: { cellWidth: 50 }, // Set width of fifth column
                  5: { cellWidth: 15 }, // Set width of sixth column
                  6: { cellWidth: 25 }, // Set width of seventh column
              },
              margin: { left: 7 }, // Adjust left margin
          });

          doc.save('guest_list.pdf');
      },
      formatTimestamp(timestamp) {
          if (timestamp) {
              const date = new Date(timestamp);
              const hours = date.getHours().toString().padStart(2, '0');
              const minutes = date.getMinutes().toString().padStart(2, '0');
              return `${hours}:${minutes}`;
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
      async resetAll() {
          if (confirm('Are you sure you want to reset all data?')) {
              this.guests = [];
              this.notes = '';
              await this.saveGuests();
              this.showSuccessMessage('All data has been reset.');
              this.refreshDataTable();
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
      async saveNotes() {
          await this.saveGuests();
          this.editingNotes = false;
      },
      showSuccessMessage(message) {
          // Implement your success message functionality here
          console.log(message);
      },
      initializeDataTable() {
          this.dataTable = $('#guestTable').DataTable({
              data: this.sortedGuests,
              columns: [
                  { data: 'tableNumber' },
                  { data: 'name' },
                  { data: 'numberOfPax' },
                  { data: 'villaNumber' },
                  { data: 'remarks' },
                  { data: 'section' },
                  {
                      data: 'timestamp',
                      render: (data) => this.formatTimestamp(data),
                  },
                  {
                      data: null,
                      orderable: false,
                      render: (data, type, row, meta) => {
                          return `
                              <button class="btn btn-primary btn-sm me-2" data-action="edit" data-index="${meta.row}">
                                  <i class="fas fa-edit"></i>
                              </button>
                              <button class="btn btn-danger btn-sm" data-action="delete" data-index="${meta.row}">
                                  <i class="fas fa-trash-alt"></i>
                              </button>
                          `;
                      },
                  },
              ],
              searching: false,
              drawCallback: () => {
                  const self = this;
                  $('#guestTable tbody').on('click', 'button', function () {
                      const action = $(this).data('action');
                      const index = $(this).data('index');
                      const guest = self.sortedGuests[index];
                      if (action === 'edit') {
                          self.openEditGuestModal(guest);
                      } else if (action === 'delete') {
                          self.deleteGuest(guest);
                      }
                  });
              },
          });
      },
      refreshDataTable() {
          if (this.dataTable) {
              this.dataTable.clear();
              this.dataTable.rows.add(this.sortedGuests);
              this.dataTable.draw();
          }
      },
  },
  async mounted() {
      try {
          await this.loadGuests();
          this.initializeDataTable();
      } catch (error) {
          console.error('Error loading data from server:', error);
          const storedData = localStorage.getItem('guestData');
          if (storedData) {
              console.log('Loading data from localStorage');
              const { guests, notes } = JSON.parse(storedData);
              this.guests = guests;
              this.notes = notes;
              this.initializeDataTable();
          }
      }
  }
});

app.mount('#app');