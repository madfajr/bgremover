// =================================================================================
// API KEY SEKARANG AMAN!
// API Key disimpan di environment variable Netlify dan hanya bisa diakses dari server.
// Frontend sekarang memanggil Netlify Function yang aman.
// =================================================================================

// Ambil elemen DOM
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const loadingIndicator = document.getElementById('loading');
const originalImage = document.getElementById('originalImage');
const resultImage = document.getElementById('resultImage');
const originalContainer = document.getElementById('originalContainer');
const resultContainer = document.getElementById('resultContainer');
const resultActions = document.getElementById('resultActions');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');

// Event listener untuk input file
imageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        handleFileUpload(file);
    }
});

// Event listener untuk area upload (drag & drop, klik)
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleFileUpload(file);
    } else {
        showNotification('Harap pilih file gambar yang valid (JPG, PNG, WebP)', 'error');
    }
});

uploadArea.addEventListener('click', () => {
    imageInput.click();
});

// Event listener untuk tombol reset
resetBtn.addEventListener('click', resetApplication);

// Fungsi untuk menangani upload file
function handleFileUpload(file) {
    if (file.size > 10 * 1024 * 1024) { // Validasi ukuran file (maks 10MB)
        showNotification('Ukuran file terlalu besar. Maksimal 10MB.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        originalImage.src = e.target.result;
        originalImage.style.display = 'block';
        originalContainer.querySelector('.placeholder').style.display = 'none';
        originalContainer.classList.add('has-image');
        uploadArea.style.display = 'none'; // Sembunyikan area upload
    };
    reader.readAsDataURL(file);

    removeBackground(file);
}

// Fungsi untuk memanggil Netlify Function (backend aman)
function removeBackground(imageFile) {
    loadingIndicator.style.display = 'block';
    resultContainer.querySelector('.placeholder').style.display = 'block';
    resultImage.style.display = 'none';
    resultActions.classList.remove('show');

    // Convert file ke base64
    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Image = e.target.result;
        
        try {
            // Panggil Netlify Function
            const response = await fetch('/.netlify/functions/remove-bg', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: base64Image
                }),
            });

            const result = await response.json();

            if (result.success) {
                // Tampilkan hasil
                resultImage.src = result.image;
                resultImage.style.display = 'block';
                resultContainer.querySelector('.placeholder').style.display = 'none';
                resultContainer.classList.add('has-image');
                
                // Tampilkan tombol unduh dan reset
                resultActions.classList.add('show');
                
                // Fungsionalitas tombol unduh
                downloadBtn.onclick = () => {
                    const link = document.createElement('a');
                    link.href = result.image;
                    link.download = 'hasil-tanpa-background.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showNotification('Gambar berhasil diunduh!', 'success');
                };
                
                showNotification('Gambar berhasil diproses!', 'success');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Processing failed:', error);
            const errorMessage = getErrorMessageByStatus(error.status || 500);
            showNotification(errorMessage, 'error');
            resetApplication();
        } finally {
            loadingIndicator.style.display = 'none';
        }
    };
    
    reader.readAsDataURL(imageFile);
}

// Fungsi untuk mendapatkan pesan error berdasarkan status code
function getErrorMessageByStatus(status) {
    switch (status) {
        case 401:
            return 'API Key tidak valid. Silakan periksa kembali.';
        case 402:
            return 'Kredit API telah habis. Silakan upgrade akun Anda.';
        case 403:
            return 'Izin ditolak. Mungkin format gambar tidak didukung.';
        case 429:
            return 'Terlalu banyak permintaan. Silakan coba lagi nanti.';
        default:
            return 'Gagal memproses gambar. Periksa koneksi internet Anda.';
    }
}

// Fungsi untuk mereset seluruh tampilan aplikasi
function resetApplication() {
    originalImage.style.display = 'none';
    originalImage.src = '';
    originalContainer.querySelector('.placeholder').style.display = 'block';
    originalContainer.classList.remove('has-image');

    resultImage.style.display = 'none';
    resultImage.src = '';
    resultContainer.querySelector('.placeholder').style.display = 'block';
    resultContainer.classList.remove('has-image');
    
    resultActions.classList.remove('show');
    uploadArea.style.display = 'block';
    imageInput.value = ''; // Reset nilai input file
    loadingIndicator.style.display = 'none';
}

// Fungsi untuk menampilkan notifikasi
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()">×</button>`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Menambahkan style untuk notifikasi ke dalam head
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 1rem;
        font-weight: 500;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    }
    .notification.success { background: #28a745; }
    .notification.error { background: #dc3545; }
    .notification.info { background: #17a2b8; }
    .notification button {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);