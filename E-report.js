const form = document.getElementById('reportForm')
const tableBody = document.querySelector('#reportTable tbody')
const toggleMode = document.getElementById('toggleMode')

let reports = JSON.parse(localStorage.getItem('reports')) || [];
let isDarkMode = localStorage.getItem('darkMode') === 'true';

// Auth (client-side, localStorage)
let users = JSON.parse(localStorage.getItem('users')) || [{ username: 'admin', password: 'admin' }];

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const currentUserSpan = document.getElementById('currentUser');
const loginModalEl = document.getElementById('loginModal');
const loginModal = new bootstrap.Modal(loginModalEl, { backdrop: 'static' });
const loginForm = document.getElementById('loginForm');
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');
const registerBtn = document.getElementById('registerBtn');

let selectedPhoto = null;
let currentStream = null;
let currentFacing = 'environment'; 

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
                const downloadBtn = r.photo ? `<button class="btn btn-success btn-sm me-1" onclick="downloadPhoto(${i})">Unduh Foto</button>` : '';
                const row = `
            <tr>
                <td>${i + 1}</td>
                <td>${escapeHtml(r.judul)}</td>
                <td>${escapeHtml(r.isi)}</td>
                ${photoCell}
                <td>${downloadBtn}<button class="btn btn-danger btn-sm" onclick="hapusReport(${i})">Hapus</button></td>
            </tr>`;
        tableBody.innerHTML += row;
    });
}

function simpanReport(e) {
    e.preventDefault();
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        
        loginModal.show();
        return;
    }
    const judul = document.getElementById('judul').value;
    const isi = document.getElementById('Isi').value;
    reports.push({ judul, isi, photo: selectedPhoto || null, author: currentUser, createdAt: new Date().toISOString() });
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


function updateAuthUI() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        currentUserSpan.textContent = `Halo, ${currentUser}`;
        currentUserSpan.style.display = 'inline-block';
        logoutBtn.style.display = 'inline-block';
        loginBtn.style.display = 'none';
      
        document.querySelectorAll('#reportForm input, #reportForm textarea, #reportForm button').forEach(el => el.disabled = false);
    } else {
        currentUserSpan.style.display = 'none';
        logoutBtn.style.display = 'none';
        loginBtn.style.display = 'inline-block';
        
        document.querySelectorAll('#reportForm input, #reportForm textarea, #reportForm button').forEach(el => el.disabled = true);
        
    }
}

loginBtn.addEventListener('click', () => {
    loginError.style.display = 'none';
    loginForm.reset();
    loginModal.show();
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    updateAuthUI();
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = loginUsername.value.trim();
    const p = loginPassword.value;
    const found = users.find(x => x.username === u && x.password === p);
    if (found) {
        localStorage.setItem('currentUser', u);
        loginModal.hide();
        updateAuthUI();
    } else {
        loginError.textContent = 'Username atau password salah.';
        loginError.style.display = 'block';
    }
});

registerBtn.addEventListener('click', () => {
    const u = loginUsername.value.trim();
    const p = loginPassword.value;
    if (!u || !p) {
        loginError.textContent = 'Masukkan username dan password untuk daftar.';
        loginError.style.display = 'block';
        return;
    }
    if (users.find(x => x.username === u)) {
        loginError.textContent = 'Username sudah terdaftar.';
        loginError.style.display = 'block';
        return;
    }
    users.push({ username: u, password: p });
    localStorage.setItem('users', JSON.stringify(users));
   
    localStorage.setItem('currentUser', u);
    loginModal.hide();
    updateAuthUI();
});


updateAuthUI();


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
    
    cameraError.style.display = 'none';
    cameraModal.show();
    
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


cameraModalEl.addEventListener('hidden.bs.modal', () => {
    stopStream();
});


function escapeHtml(unsafe) {
    if (!unsafe && unsafe !== 0) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


if (selectedPhoto) {
    photoPreview.src = selectedPhoto;
    photoPreview.style.display = 'inline-block';
    clearPhotoBtn.style.display = 'inline-block';
}

renderReports();


function downloadPhoto(index) {
    const r = reports[index];
    if (!r || !r.photo) {
        alert('Tidak ada foto untuk diunduh.');
        return;
    }
    const dataUrl = r.photo;
   
    const a = document.createElement('a');
    a.href = dataUrl;
    
    const safeTitle = (r.judul || `laporan-${index+1}`).replace(/[^a-z0-9\-\_ ]/gi, '').replace(/\s+/g, '_');
    a.download = `${safeTitle || 'foto'}_${index+1}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
}
