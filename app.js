const app = Vue.createApp({
  data() {
      return {
          guests: [],
          newGuest: {
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
          notes: '',
          showNotesModal: false,
          editingNotes: false,
          currentDate: new Date().toLocaleDateString()
      };
  },
  computed: {
      truncatedNotes() {
          if (this.notes.length > 100) {
              return this.notes.slice(0, 100) + '...';
          }
          return this.notes;
      },
      filteredGuests() {
          let filtered = this.guests;
          if (this.searchTerm) {
              const term = this.searchTerm.toLowerCase();
              filtered = filtered.filter(guest =>
                  guest.name.toLowerCase().includes(term) ||
                  guest.tableNumber.toLowerCase().includes(term) ||
                  guest.villaNumber.toLowerCase().includes(term)
              );
          }
          if (this.sectionFilter) {
              filtered = filtered.filter(guest => guest.section === this.sectionFilter);
          }
          return filtered;
      },
      totalGuests() {
          return this.guests.reduce((total, guest) => total + guest.numberOfPax, 0);
      }
  },
  methods: {
      formatTimestamp(timestamp) {
          const date = new Date(timestamp);
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          return `${hours}:${minutes}`;
      },
      openAddGuestModal() {
          this.resetNewGuest();
          const modal = new bootstrap.Modal(document.getElementById('addGuestModal'));
          modal.show();
      },
      async addGuest() {
          if (this.validateGuest()) {
              const newGuest = {
                  ...this.newGuest,
                  id: Date.now(),
                  timestamp: new Date().toISOString()
              };
              this.guests.push(newGuest);
              await this.saveGuests();
              const modal = bootstrap.Modal.getInstance(document.getElementById('addGuestModal'));
              modal.hide();
              this.resetNewGuest();
              this.reloadDataTable();
          }
      },
      resetNewGuest() {
          this.newGuest = {
              tableNumber: '',
              name: '',
              numberOfPax: 0,
              villaNumber: '',
              remarks: '',
              section: '',
              timestamp: ''
          };
      },
      validateGuest() {
          return (
              this.newGuest.tableNumber.trim() !== '' &&
              this.newGuest.name.trim() !== '' &&
              this.newGuest.numberOfPax > 0
          );
      },
      async editGuest(index) {
          const guest = this.guests[index];
          this.newGuest = { ...guest };
          const modal = new bootstrap.Modal(document.getElementById('addGuestModal'));
          modal.show();
      },
      async deleteGuest(index) {
          if (confirm('Are you sure you want to delete this guest?')) {
              this.guests.splice(index, 1);
              await this.saveGuests();
              this.reloadDataTable();
          }
      },
      reloadDataTable() {
          const table = $('#guestTable').DataTable();
          table.clear().rows.add(this.filteredGuests).draw();
      },
      async saveGuests() {
          // Save data to data.json using an API call or server-side script
      },
      async loadGuests() {
          try {
              const response = await fetch('data.json');
              const data = await response.json();
              this.guests = data.guests || [];
              this.notes = data.notes || '';
          } catch (error) {
              console.error('Error loading data:', error);
          }
      },
      exportToPDF() {
          const element = document.getElementById('pdf-content');
          html2pdf().from(element).save('guest-list.pdf');
      },
      async resetAll() {
          if (confirm('Are you sure you want to reset all data?')) {
              this.guests = [];
              this.notes = '';
              await this.saveGuests();
              this.reloadDataTable();
          }
      },
      toggleNotesModal() {
          this.showNotesModal = !this.showNotesModal;
      },
      editNotes() {
          this.editingNotes = true;
      },
      async saveNotes() {
          this.editingNotes = false;
          await this.saveGuests();
      }
  },
  mounted() {
      this.loadGuests();
      $('#guestTable').DataTable({
          responsive: true,
          data: this.filteredGuests,
          columns: [
              { data: 'tableNumber' },
              { data: 'name' },
              { data: 'numberOfPax' },
              { data: 'villaNumber' },
              { data: 'remarks' },
              { data: 'section' },
              {
                  data: 'timestamp',
                  render: (data) => this.formatTimestamp(data)
              },
              {
                  data: null,
                  orderable: false,
                  searchable: false,
                  render: (data, type, row, meta) => {
                      return `
                          <div class="d-flex justify-content-center">
                              <button class="btn btn-primary btn-sm me-2" onclick="app.editGuest(${meta.row})">
                                  <i class="fas fa-edit"></i>
                              </button>
                              <button class="btn btn-danger btn-sm" onclick="app.deleteGuest(${meta.row})">
                                  <i class="fas fa-trash"></i>
                              </button>
                          </div>
                      `;
                  }
              }
          ]
      });
  },
  watch: {
      filteredGuests() {
          this.reloadDataTable();
      }
  }
});

app.mount('#app');