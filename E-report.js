const form = document.getElementById('reportForm')
const tableBody = document.querySelector('#reportTable tbody')
const toggleMode = document.getElementById('toggleMode')

let reports = JSON.parse(localStorage.getItem('reports')) || [];
let isDarkMode = localStorage.getItem('darkMode') === 'true';


let selectedPhoto = null;
let currentStream = null;
let currentFacing = 'environment'; // try back camera first on mobile

const photoPreview = document.getElementById('photoPreview');
const clearPhotoBtn = document.getElementById('clearPhoto');
const openCameraBtn = document.getElementById('openCamera');
const video = document.getElementById('videoPreview');
const canvas = document.getElementById('captureCanvas');
const captureBtn = document.getElementById('captureBtn');
const switchCameraBtn = document.getElementById('switchCamera');
const cameraError = document.getElementById('cameraError');
const cameraModalEl = document.getElementById('cameraModal');
const cameraModal = new bootstrap.Modal(cameraModalEl, { backdrop: 'static' });

function renderReports() {
    tableBody.innerHTML = '';
    reports.forEach((r, i) => {
        const photoCell = r.photo ? `<td><img src="${r.photo}" alt="Foto" class="img-thumbnail" style="max-width:80px; max-height:60px;"></td>` : '<td></td>';
        const row = `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(r.judul)}</td>
        <td>${escapeHtml(r.isi)}</td>
        ${photoCell}
        <td><button class="btn btn-danger btn-sm" onclick="hapusReport(${i})">Hapus</button></td>
      </tr>`;
        tableBody.innerHTML += row;
    });
}

function simpanReport(e) {
    e.preventDefault();
    const judul = document.getElementById('judul').value;
    const isi = document.getElementById('Isi').value;
    reports.push({ judul, isi, photo: selectedPhoto || null });
    localStorage.setItem('reports', JSON.stringify(reports));
    form.reset();
    selectedPhoto = null;
    photoPreview.style.display = 'none';
    clearPhotoBtn.style.display = 'none';
    renderReports();
}

function hapusReport(index) {
    reports.splice(index, 1);
    localStorage.setItem('reports', JSON.stringify(reports));
    renderReports();
}

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
    toggleMode.textContent = isDarkMode ? 'Mode Terang' : 'Mode Gelap';
}

if (isDarkMode) {
    document.body.classList.add('dark-mode');
    toggleMode.textContent = 'Mode Terang';
} else {
    toggleMode.textContent = 'Mode Gelap';
}

form.addEventListener('submit', simpanReport);
toggleMode.addEventListener('click', toggleDarkMode);

// Camera logic
async function startStream(facingMode = 'environment') {
    stopStream();
    cameraError.style.display = 'none';
    try {
        const constraints = { video: { facingMode } };
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
        await video.play();
    } catch (err) {
        console.error('Gagal mengakses kamera', err);
        cameraError.textContent = 'Kamera tidak ditemukan atau akses ditolak.';
        cameraError.style.display = 'block';
    }
}

function stopStream() {
    if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
        currentStream = null;
    }
    if (video) video.srcObject = null;
}

captureBtn.addEventListener('click', () => {
    if (!video || video.readyState < 2) {
        cameraError.textContent = 'Kamera belum siap.';
        cameraError.style.display = 'block';
        return;
    }
    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/png');
    selectedPhoto = dataUrl;
    photoPreview.src = dataUrl;
    photoPreview.style.display = 'inline-block';
    clearPhotoBtn.style.display = 'inline-block';
    cameraModal.hide();
    stopStream();
});

openCameraBtn.addEventListener('click', async () => {
    // Open modal and start camera
    cameraError.style.display = 'none';
    cameraModal.show();
    // give modal a tick to render
    setTimeout(() => startStream(currentFacing), 200);
});

switchCameraBtn.addEventListener('click', () => {
    currentFacing = currentFacing === 'environment' ? 'user' : 'environment';
    startStream(currentFacing);
});

clearPhotoBtn.addEventListener('click', () => {
    selectedPhoto = null;
    photoPreview.src = '';
    photoPreview.style.display = 'none';
    clearPhotoBtn.style.display = 'none';
});

// Stop camera when modal closes
cameraModalEl.addEventListener('hidden.bs.modal', () => {
    stopStream();
});

// escape HTML to avoid injection in table
function escapeHtml(unsafe) {
    if (!unsafe && unsafe !== 0) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Initialize photo preview if editing existing unsaved photo (none currently)
if (selectedPhoto) {
    photoPreview.src = selectedPhoto;
    photoPreview.style.display = 'inline-block';
    clearPhotoBtn.style.display = 'inline-block';
}

renderReports();
