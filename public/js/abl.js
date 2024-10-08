document.addEventListener('DOMContentLoaded', obtenerPagosABL);

function buscarInquilino() {
    const search = document.getElementById('search').value;

    fetch(`/api/pagos-abl/buscar-inquilino?search=${encodeURIComponent(search)}`)
        .then(response => response.json())
        .then(data => {
            console.log(data); // Asegúrate de que estás recibiendo los datos correctos
            if (data) {
                document.getElementById('calle').value = data.calle;
                document.getElementById('numero').value = data.nro;
                document.getElementById('nombre').value = data.nombre; // Almacena el nombre en un campo oculto
            } else {
                alert('No se encontró ningún propietario.');
            }
        })
        .catch(error => console.error('Error al buscar inquilino:', error));
}

function limpiarFormulario() {
    document.getElementById('cargarPagoABLForm').reset(); // Limpia todos los campos del formulario de carga de pago
    document.getElementById('id_pago').value = ''; // Limpia el ID del pago
}

function guardarPagoABL() {
    const id_pago = document.getElementById('id_pago').value;
    const calle = document.getElementById('calle').value;
    const numero = document.getElementById('numero').value;
    const nombre = document.getElementById('nombre').value; // Recupera el nombre del campo oculto
    const monto_abl = document.getElementById('monto_abl').value;
    const periodo = document.getElementById('periodo').value;
    const metodo_pago = document.getElementById('metodo_pago').value; // Obtener el método de pago

    const method = id_pago ? 'PUT' : 'POST'; // Usa PUT si id_pago existe, de lo contrario usa POST
    const url = id_pago ? `/api/pagos-abl/editar-pago-abl/${id_pago}` : '/api/pagos-abl/guardar-pago-abl';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ calle, numero, nombre, monto_abl, periodo, metodo_pago }) // Incluye método de pago
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Pago ABL guardado/actualizado con éxito');
            obtenerPagosABL();
            limpiarFormulario(); // Limpia el formulario de carga de pago
        }
    })
    .catch(error => console.error('Error:', error));
}

function obtenerPagosABL() {
    fetch('/api/pagos-abl/obtener-pagos-abl')
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector('#tablaPagosABL tbody');
            tbody.innerHTML = '';
            data.forEach(pago => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${pago.id}</td>
                    <td>${pago.calle}</td>
                    <td>${pago.numero}</td>
                    <td>${pago.nombre}</td>
                    <td>${pago.monto_abl}</td>
                    <td>${pago.periodo}</td>
                    <td>${pago.metodo_pago}</td> <!-- Mostrar método de pago en la tabla -->
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="cargarDatosParaEdicion(${pago.id})">Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="eliminarPagoABL(${pago.id})">Eliminar</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error('Error:', error));
}

function cargarDatosParaEdicion(id) {
    fetch(`/api/pagos-abl/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data) {
                document.getElementById('id_pago').value = data.id;
                document.getElementById('calle').value = data.calle;
                document.getElementById('numero').value = data.numero;
                document.getElementById('nombre').value = data.nombre;
                document.getElementById('monto_abl').value = data.monto_abl;
                document.getElementById('periodo').value = data.periodo;
                document.getElementById('metodo_pago').value = data.metodo_pago; // Cargar método de pago en la edición
            } else {
                alert('No se encontró el pago ABL.');
            }
        })
        .catch(error => console.error('Error al cargar datos para edición:', error));
}

function eliminarPagoABL(id) {
    fetch(`/api/pagos-abl/eliminar-pago-abl/${id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Pago ABL eliminado con éxito');
            obtenerPagosABL();
        }
    })
    .catch(error => console.error('Error:', error));
}
