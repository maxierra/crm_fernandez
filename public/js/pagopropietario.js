// Código de búsqueda del propietario
document.getElementById('searchForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const propietario = document.getElementById('propietario').value;

    fetch('/buscar-propietario', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ propietario: propietario })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => {
                throw new Error(error.message || 'Error desconocido');
            });
        }
        return response.json();
    })
    .then(data => {
        const resultadoDiv = document.getElementById('resultado');
        resultadoDiv.innerHTML = ''; // Limpiar el contenido antes de agregar nuevos elementos

        let resultHtml = '';

        if (data.error) {
            resultHtml += `<p class="text-danger">Error: ${data.error}</p>`;
        } else {
            resultHtml += `<div class="section payment-details animate" style="animation-delay: 0.2s;">`;
            resultHtml += `<h2>Detalle de Pagos</h2>`;
            resultHtml += `<div class="detail-row">`;
            resultHtml += `<span>Importe del periodo:</span><span>$${(data.importePeriodo || 0).toFixed(2)}</span>`;
            resultHtml += `</div>`;
            resultHtml += `<div class="detail-row deduction">`;
            resultHtml += `<span>Monto ABL:</span><span class="amount">-$${(data.montoABL || 0).toFixed(2)}</span>`;
            resultHtml += `</div>`;
            resultHtml += `<div class="detail-row deduction">`;
            resultHtml += `<span>Administración (Comisión):</span><span class="amount">-$${(data.administracion || 0).toFixed(2)}</span>`;
            resultHtml += `</div>`;
            resultHtml += `<div class="detail-row total">`;
            resultHtml += `<span>Total:</span><span>$${(data.total || 0).toFixed(2)}</span>`;
            resultHtml += `</div>`;
            resultHtml += `</div>`;

            // Crear y mostrar el dropdown para seleccionar el período
            let periodosHtml = '<select id="periodo" class="form-control">';
            periodosHtml += '<option value="">Seleccione un período</option>';
            data.periodos.forEach(periodo => {
                periodosHtml += `<option value="${periodo}">${periodo}</option>`;
            });
            periodosHtml += '</select>';
            periodosHtml += '<button id="cargarPeriodo" class="btn btn-secondary mt-2">Cargar Período</button>';

            resultadoDiv.innerHTML += periodosHtml;
        }

        resultadoDiv.innerHTML += resultHtml;
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('resultado').innerHTML = `<p class="text-danger">Error en la respuesta del servidor: ${error.message}</p>`;
    });
});

// Manejo de los métodos de pago
document.querySelectorAll('.payment-option').forEach(option => {
    option.addEventListener('click', function () {
        document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('active'));
        this.classList.add('active');
        document.getElementById('cbu').style.display = this.dataset.method === 'transferencia' ? 'block' : 'none';
    });
});

// Manejo de la carga del período seleccionado
document.getElementById('resultado').addEventListener('click', function (event) {
    if (event.target && event.target.id === 'cargarPeriodo') {
        const periodo = document.getElementById('periodo').value;
        const propietario = document.getElementById('propietario').value;

        if (!periodo) {
            alert('Por favor, seleccione un período.');
            return;
        }

        fetch('/cargar-periodo-abl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ propietario: propietario, periodo: periodo })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(error => {
                    throw new Error(error.message || 'Error desconocido');
                });
            }
            return response.json();
        })
        .then(data => {
            const resultadoDiv = document.getElementById('resultado');
            resultadoDiv.innerHTML = ''; // Limpiar el contenido antes de agregar nuevos elementos

            let resultHtml = '';
        
            if (data.error) {
                resultHtml += `<p class="text-danger">Error: ${data.error}</p>`;
            } else {
                const importePeriodo = data.importePeriodo || 0;
                const montoABL = data.montoABL || 0;
                const administracion = data.administracion || 0;
                const total = data.total || 0;
        
                resultHtml += `<div class="section payment-details animate" style="animation-delay: 0.2s;">`;
                resultHtml += `<h2>Detalle de Pagos</h2>`;
                resultHtml += `<div class="detail-row">`;
                resultHtml += `<span>Importe del periodo:</span><span>$${importePeriodo.toFixed(2)}</span>`;
                resultHtml += `</div>`;
                resultHtml += `<div class="detail-row deduction">`;
                resultHtml += `<span>Monto ABL:</span><span class="amount">-$${montoABL.toFixed(2)}</span>`;
                resultHtml += `</div>`;
                resultHtml += `<div class="detail-row deduction">`;
                resultHtml += `<span>Administración (Comisión):</span><span class="amount">-$${administracion.toFixed(2)}</span>`;
                resultHtml += `</div>`;
                resultHtml += `<div class="detail-row total">`;
                resultHtml += `<span>Total:</span><span>$${total.toFixed(2)}</span>`;
                resultHtml += `</div>`;
                resultHtml += `</div>`;
            }
        
            resultadoDiv.innerHTML = resultHtml;
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('resultado').innerHTML = `<p class="text-danger">Error en la respuesta del servidor: ${error.message}</p>`;
        });
    }
});

// Manejo del botón de procesar pago
document.getElementById('processPayment').addEventListener('click', function () {
    const method = document.querySelector('.payment-option.active').dataset.method;

    fetch('/procesar-pago', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ method: method })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => {
                throw new Error(error.message || 'Error desconocido');
            });
        }
        return response.json();
    })
    .then(data => {
        alert(`Pago procesado exitosamente. ID de transacción: ${data.transactionId}`);
    })
    .catch(error => {
        console.error('Error:', error);
        alert(`Error al procesar el pago: ${error.message}`);
    });
});