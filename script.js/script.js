let serviceNumber = 1; // Initialize service number

// Tambahkan fungsi untuk menghitung sisa hari
function hitungSisaHariGaransi(tanggalGaransi) {
    const today = new Date();
    const warranty = new Date(tanggalGaransi);
    const diffTime = warranty - today;
    const sisaHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return sisaHari;
}

// Konstanta untuk API endpoint
const API_URL = 'api/services.php';

// Fungsi helper untuk memanggil API
async function callApi(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(endpoint, options);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Fungsi untuk mendapatkan nomor servis
async function fetchServiceNumber() {
    try {
        const response = await callApi(`${API_URL}?action=get_next_number`);
        if (response.status === 'success') {
            document.getElementById('serviceNumber').value = response.data.next_number;
        } else {
            throw new Error(response.error);
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Gagal mendapatkan nomor servis',
            text: error.message
        });
    }
}

// Ganti localStorage dengan API calls
async function loadServices() {
    try {
        const response = await fetch('api/services.php');
        const data = await response.json();
        displayServices(data);
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Gagal memuat data',
            text: 'Terjadi kesalahan saat mengambil data dari server'
        });
    }
}

// Fungsi untuk menambah data baru
async function addService(serviceData) {
    try {
        const response = await fetch('api/services.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(serviceData)
        });
        
        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                text: 'Data servis berhasil disimpan'
            });
            loadServices();
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Gagal menyimpan',
            text: 'Terjadi kesalahan saat menyimpan data'
        });
    }
}

// Fungsi untuk menghapus data
async function deleteService(serviceNumber) {
    try {
        const response = await fetch(`api/services.php?service_number=${serviceNumber}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadServices();
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Gagal menghapus',
            text: 'Terjadi kesalahan saat menghapus data'
        });
    }
}

// Fungsi untuk menyimpan data pelanggan
async function saveCustomerData(customerName, phoneNumber, whatsappNumber) {
    try {
        const response = await fetch('api/services.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'add_customer',
                customerName: customerName,
                phoneNumber: phoneNumber,
                whatsappNumber: whatsappNumber
            })
        });
        
        if (response.ok) {
            console.log('Customer data saved successfully');
        } else {
            console.error('Failed to save customer data');
        }
    } catch (error) {
        console.error('Error saving customer data:', error);
    }
}

// Fungsi untuk mengisi datalist dengan data pelanggan yang tersimpan
async function loadCustomerData() {
    try {
        const response = await fetch('api/services.php?action=get_customers');
        const customers = await response.json();
        const datalist = document.getElementById('customerList');
        datalist.innerHTML = ''; // Clear existing options
        
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.name;
            datalist.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading customer data:', error);
        Swal.fire({
            icon: 'error',
            title: 'Gagal memuat data pelanggan',
            text: 'Terjadi kesalahan saat mengambil data pelanggan dari server'
        });
    }
}

// Event listener untuk mengisi data otomatis saat nama dipilih
document.getElementById('customerName').addEventListener('change', function() {
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const selectedCustomer = customers.find(c => c.name === this.value);
    
    if (selectedCustomer) {
        document.getElementById('phoneNumber').value = selectedCustomer.phone;
        document.getElementById('whatsappNumber').value = selectedCustomer.whatsapp;
    }
});

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load initial data
    loadServices();
    
    // Form submission
    document.getElementById('serviceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            // Show loading
            Swal.showLoading();
            
            // Submit form
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            const response = await callApi(API_URL, 'POST', data);
            if (response.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Data servis berhasil disimpan'
                });
                modal.style.display = 'none';
                loadServices();
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal menyimpan data',
                text: error.message
            });
        }
    });
});

document.getElementById('whatsappNumber').addEventListener('blur', function() {
    let whatsappNumber = this.value.trim();
    if (!whatsappNumber.startsWith('62')) {
        // Remove leading zero if present
        if (whatsappNumber.startsWith('0')) {
            whatsappNumber = whatsappNumber.substring(1);
        }
        // Add country code 62
        this.value = '62' + whatsappNumber;
    }
});

function copyPhoneNumber() {
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    if (phoneNumber) {
        document.getElementById('whatsappNumber').value = phoneNumber;
    }
}

// Get modal elements
const modal = document.getElementById('serviceModal');
const btn = document.getElementById('newServiceButton');
const span = document.getElementsByClassName('close')[0];
const cancelButton = document.getElementById('cancelButton'); // Get the cancel button

// When the user clicks the button, open the modal 
btn.onclick = function() {
    modal.style.display = 'block';
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = 'none';
}

// When the user clicks on the cancel button, close the modal and show alert
cancelButton.onclick = function() {
    modal.style.display = 'none';
    Swal.fire({
        icon: 'info',
        title: 'Batal',
        text: 'Data tidak ditambahkan',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        toast: true,
        position: 'top-end',
        background: '#f9f9f9',
        customClass: {
            popup: 'swal2-custom-popup',
            title: 'swal2-custom-title',
            content: 'swal2-custom-content'
        }
    });
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Panggil loadCustomerData saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    loadCustomerData();
    updateServiceNumber(); // Initialize the service number
});

function searchService() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toUpperCase();
    const table = document.getElementById('list');
    const tr = table.getElementsByTagName('tr');

    for (let i = 0; i < tr.length; i++) {
        const td = tr[i].getElementsByTagName('td')[0]; // Nomor Servis ada di kolom pertama
        if (td) {
            const txtValue = td.textContent || td.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = '';
            } else {
                tr[i].style.display = 'none';
            }
        }
    }
}

// Toggle search input visibility
const toggleSearchButton = document.getElementById('toggleSearchButton');
const searchContainer = document.getElementById('searchContainer');
const searchIcon = document.querySelector('.search-icon i');

document.addEventListener('DOMContentLoaded', function() {
    toggleSearchButton.onclick = function() {
        if (searchContainer.style.maxWidth === '0px' || searchContainer.style.maxWidth === '') {
            searchContainer.style.maxWidth = '250px'; // Animate width
            searchIcon.style.transform = 'rotate(90deg)'; // Rotate icon
            toggleSearchButton.style.display = 'none'; // Hide the toggle button
        }
    }

    document.addEventListener('click', function(event) {
        const isClickInside = searchContainer.contains(event.target) || toggleSearchButton.contains(event.target);

        if (!isClickInside) {
            searchContainer.style.maxWidth = '0'; // Animate width
            searchIcon.style.transform = 'rotate(0deg)'; // Reset icon rotation
            toggleSearchButton.style.display = 'flex'; // Show the toggle button
        }
    });
});

// Fungsi untuk inisialisasi form modal
function initializeModalForm() {
    // Reset form
    document.getElementById('serviceForm').reset();
    
    // Ambil nomor servis baru
    fetchServiceNumber();
    
    // Load data pelanggan untuk datalist
    loadCustomerData();
    
    // Tampilkan modal
    modal.style.display = 'block';
}

// Event listener untuk tombol "Servis Baru"
document.getElementById('newServiceButton').addEventListener('click', initializeModalForm);

// Event listener untuk copy nomor HP ke WhatsApp
document.querySelector('.copy-icon').addEventListener('click', function() {
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    if (phoneNumber) {
        document.getElementById('whatsappNumber').value = phoneNumber;
    }
});

// Format WhatsApp number
document.getElementById('whatsappNumber').addEventListener('blur', function() {
    let number = this.value.trim();
    if (number) {
        // Hapus non-digit
        number = number.replace(/\D/g, '');
        // Hapus awalan 0
        number = number.replace(/^0+/, '');
        // Tambah 62 jika belum ada
        if (!number.startsWith('62')) {
            number = '62' + number;
        }
        this.value = number;
    }
});

// Auto-fill customer data saat nama dipilih
document.getElementById('customerName').addEventListener('change', function() {
    const selectedName = this.value;
    if (selectedName) {
        // Cari data pelanggan
        fetch(`api/services.php?action=get_customer&name=${encodeURIComponent(selectedName)}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success' && data.data) {
                    document.getElementById('phoneNumber').value = data.data.phone_number;
                    document.getElementById('whatsappNumber').value = data.data.whatsapp_number;
                }
            })
            .catch(error => console.error('Error:', error));
    }
});
