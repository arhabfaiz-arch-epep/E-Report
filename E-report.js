const form = document.getElementById('reportForm')
const tableBody = document.querySelector('#reportTable tbody')
const toggleMode = document.getElementById('toggleMode')

let reports = JSON.parse(localStorage.getItem('reports')) || [];
let isDarkMode = localStorage.getItem('darkMode') === 'true';

function renderReports() {
    tableBody.innerHTML = '';
    reports.forEach((r, i) => {
        const row = `
      <tr>
        <td>${i + 1}</td>
        <td>${r.judul}</td>
        <td>${r.isi}</td>
        <td><button class="btn btn-danger btn-sm" onclick="hapusReport(${i})">Hapus</button></td>
      </tr>`;
    tableBody.innerHTML += row;
    });
}

function simpanReport(e) {
    e.preventDefault();
    const judul = document.getElementById('judul').value;
    const isi = document.getElementById('Isi').value;
    reports.push({ judul, isi});
    localStorage.setItem('reports', JSON.stringify(reports));
    form.reset()
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
renderReports();
