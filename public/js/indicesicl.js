
let globalData = {};
let currentYear = new Date().getFullYear();

document.getElementById('iclForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const iclData = document.getElementById('iclData').value;

    try {
        const response = await fetch('/cargar-indices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ iclData })
        });

        if (response.ok) {
            const result = await response.json();
            showMessage(result.message, 'success');
            fetchIndices();
        } else {
            const error = await response.json();
            showMessage(error.message || 'Error desconocido', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error en la solicitud', 'danger');
    }
});

function showMessage(message, type) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = message;
    messageElement.className = `alert alert-${type}`;
    messageElement.style.display = 'block';
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000);
}

async function fetchIndices() {
    try {
        const response = await fetch('/indices');
        const data = await response.json();
        organizeDataByYear(data);
        updateYearSelector();
        displayDataForYear(currentYear);
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al obtener los índices', 'danger');
    }
}

function organizeDataByYear(data) {
    globalData = {};
    data.forEach(item => {
        const [day, month, year] = item.fecha.split('/');
        if (!globalData[year]) {
            globalData[year] = {};
        }
        if (!globalData[year][month]) {
            globalData[year][month] = {};
        }
        globalData[year][month][day] = item.valor_ICL;
    });
}

function updateYearSelector() {
    const yearSelect = document.getElementById('yearSelect');
    yearSelect.innerHTML = '';
    Object.keys(globalData).sort().forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });
    yearSelect.value = currentYear;
    yearSelect.addEventListener('change', (e) => {
        currentYear = e.target.value;
        displayDataForYear(currentYear);
    });
}

function displayDataForYear(year) {
    document.getElementById('currentYear').textContent = year;
    const tbody = document.querySelector('#iclTable tbody');
    tbody.innerHTML = '';

    for (let day = 1; day <= 31; day++) {
        const row = document.createElement('tr');
        row.innerHTML = `<th scope="row">${day}</th>`;
        for (let month = 1; month <= 12; month++) {
            const monthStr = month.toString().padStart(2, '0');
            const dayStr = day.toString().padStart(2, '0');
            const value = globalData[year] && globalData[year][monthStr] && globalData[year][monthStr][dayStr] 
                ? globalData[year][monthStr][dayStr] 
                : '';
            row.innerHTML += `<td>${value}</td>`;
        }
        tbody.appendChild(row);
    }
}

window.onload = fetchIndices;
