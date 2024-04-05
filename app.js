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
      showGuestNameModal: false,
      showRemarksModal: false,
      selectedGuest: {
        name: '',
        remarks: ''
      }
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
    openAddGuestModal() {
      this.showAddGuestModal = true;
    },
    closeAddGuestModal() {
      this.showAddGuestModal = false;
      this.resetNewGuest();
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
    async addGuest() {
      if (this.validateGuest(this.newGuest)) {
        this.newGuest.id = Date.now();
        this.newGuest.timestamp = new Date().toISOString();
        this.guests.push({ ...this.newGuest });
        this.resetNewGuest();
        await this.saveGuests();
        this.closeAddGuestModal();
        this.showSuccessMessage('Guest added successfully.');
      }
    },
    async saveEditedGuest() {
      if (this.validateGuest(this.editedGuest)) {
        const index = this.guests.findIndex(guest => guest.id === this.editedGuest.id);
        if (index !== -1) {
          this.guests.splice(index, 1, { ...this.editedGuest });
          await this.saveGuests();
          this.closeEditGuestModal();
          this.showSuccessMessage('Guest updated successfully.');
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
          notes: this.notes
        });

        const response = await fetch('server.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'saveGuests',
            guests: this.guests,
            notes: this.notes
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
    
      // Load the image
      let img = new Image();
      img.src = './images/TT.png';
    
      img.onload = function() {
        // Create a canvas and draw the image on it
        let canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
    
        // Get the Data URL of the image
        let imgData = canvas.toDataURL('image/png');
    
        // Function to insert logical line breaks
        function insertLogicalLineBreaks(str) {
          // Split the string into lines at each newline, comma, or '@' symbol
          let lines = str.split(/[\n,@]/);
    
          // Join the lines back together, inserting a newline between each one
          return lines.join('\n');
        }
    
        // Function to format remarks and notes
        function formatText(text) {
          // Replace asterisk marks with bold tags
          text = text.replace(/\*(.*?)\*/g, '$1');
    
          // Replace underscore marks with italic tags
          text = text.replace(/_(.*?)_/g, '<i>$1</i>');
    
          // Replace '~' with '@'
          text = text.replace(/~/g, '@');
    
          return text;
        }
    
        // Add guest list table to the PDF
        const tableHeaders = ['Table', 'Name', 'Pax', 'Villa', 'Remarks', 'Section', 'Time'];
        const tableData = this.guests.map(guest => [
          guest.tableNumber,
          guest.name,
          guest.numberOfPax,
          guest.villaNumber,
          formatText(insertLogicalLineBreaks(guest.remarks)),
          guest.section,
          this.formatTimestamp(guest.timestamp)
        ]);
    
        let today = new Date();
        let day = today.getDate();
        let month = today.toLocaleString('default', { month: 'long' });
        let year = today.getFullYear();
        let dateStr = `${day} ${month} ${year}`;
        let totalPax = this.totalGuests;
        let totalRooms = tableData.length;
    
        doc.setFont('Merienda', 'normal'); // Use Merienda font for header
        doc.setFontSize(19);
        doc.text('Tasting Table Guest Tracker', doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });
    
        // Container for date, total guests, and total pax
        doc.setFontSize(12);
        doc.setFont('times', 'normal'); // Use 'times' font, normal style
        let containerWidth = 197; // Adjust the width as needed
        let containerX = (doc.internal.pageSize.getWidth() - containerWidth) / 1.80; // Center the container
        let containerY = 32;
    
        doc.setDrawColor(41, 128, 185); // Set the container border color
        doc.setFillColor(255, 255, 255); // Set the container background color
        doc.rect(containerX, containerY, containerWidth, 8, 'FD'); // Draw the container
    
        doc.text('' + dateStr, containerX + 1, containerY + 5); // Date
        doc.text('Rooms: ' + totalRooms, containerX + 150, containerY + 5); // Total Rooms
        doc.text('Guests: ' + totalPax, containerX + 175, containerY + 5); // Total Guests
    
        // Add the image to the PDF
        doc.addImage(imgData, 'PNG', 90, 5, 30, 15); // Adjust the coordinates and size as needed
    
        // Add the table to the PDF
        doc.autoTable({
          head: [tableHeaders],
          body: tableData,
          startY: 39, // Adjust the startY value to position the table below the container
          styles: {
            fontSize: 9,
            cellPadding: 1,
            overflow: 'linebreak',
            cellWidth: 'wrap'
          },
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 50 },
            2: { cellWidth: 10 },
            3: { cellWidth: 20 },
            4: { cellWidth: 80 },
            5: { cellWidth: 15 },
            6: { cellWidth: 12 },
          },
          pageBreak: 'auto',
          margin: { top: 10, left: 7.23, right: 5.80, bottom: 40 },
        });
    
        doc.save('guest_list.pdf');
      }.bind(this);
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
    formatGuestName(name) {
      return name.replace(/\n/g, '<br>');
    },
    formatRemarks(remarks) {
      const lines = remarks.split('\n');
      const formattedLines = [];
    
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('*')) {
          formattedLines.push(`<b>${line.slice(1)}</b>`);
        } else {
          formattedLines.push(line);
        }
      }
    
      return formattedLines.join('<br>');
    },
    formatNotes(notes) {
      let formattedNotes = notes;
      formattedNotes = formattedNotes.replace(/\*(.*?)\*/g, '<b>$1</b>');
      formattedNotes = formattedNotes.replace(/\*(.*?)\*/g, '<em>$1</em>');
      formattedNotes = formattedNotes.replace(/\n/g, '<br>');
      return formattedNotes;
    },
    openNotesModal() {
      this.showNotesModal = true;
    },
    closeNotesModal() {
      if (!this.editingNotes) {
        this.showNotesModal = false;
        this.editingNotes = false;
      } else {
        this.editingNotes = false;
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
    openGuestNameModal(guest) {
      this.selectedGuest.name = guest.name;
      this.showGuestNameModal = true;
    },
    closeGuestNameModal() {
      this.showGuestNameModal = false;
    },
    openRemarksModal(guest) {
      this.selectedGuest.remarks = guest.remarks;
      this.showRemarksModal = true;
    },
    closeRemarksModal() {
      this.showRemarksModal = false;
    },
    async resetAll() {
      const password = prompt('Enter the password to reset all data:');
      if (password === 'raufath') {
        if (confirm('Are you sure you want to reset all data?')) {
          this.guests = [];
          this.notes = '';
          await this.saveGuests();
          this.showSuccessMessage('All data has been reset.');
        }
      } else {
        alert('Invalid password. Reset operation canceled.');
      }
    }
  },
  async mounted() {
    try {
      await this.loadGuests();
    } catch (error) {
      console.error('Error loading data from server:', error);
      const storedData = localStorage.getItem('guestData');
      if (storedData) {
        console.log('Loading data from localStorage');
        const { guests, notes } = JSON.parse(storedData);
        this.guests = guests;
        this.notes = notes;
      }
    }
  }
});

app.mount('#app');