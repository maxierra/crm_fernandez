
    // Llenar automáticamente el selector de años con opciones
    const currentYear = new Date().getFullYear();
    const selectAnio = document.getElementById('anio');
    for (let i = currentYear; i >= currentYear - 10; i--) {
        const option = document.createElement('option');
        option.value = i;
        option.text = i;
        selectAnio.appendChild(option);
    }

    function buscarInquilino() {
        const search = document.getElementById('buscar').value;
        fetch(`/buscar-inquilino?search=${search}`)
        .then(response => response.json())
        .then(data => {
            console.log(data); // Para asegurarte de que estás recibiendo los datos correctos
            document.getElementById('calle').value = data.calle;
            document.getElementById('numero').value = data.nro;
            document.getElementById('nombrePropietario').value = data.propietario;
        })
        .catch(error => console.error('Error al buscar inquilino:', error));
    }
    
    function guardarExpensas() {
        const expensasComunes = document.getElementById('expensasComunes').value;
        const expensasExtraordinarias = document.getElementById('expensasExtraordinarias').value;
        const mes = document.getElementById('mes').value;
        const anio = document.getElementById('anio').value;
        const periodo = `${mes}/${anio}`;
        const calle = document.getElementById('calle').value;
        const numero = document.getElementById('numero').value;
        const nombrePropietario = document.getElementById('nombrePropietario').value;
        const estado = document.getElementById('estado').value;
    
        fetch('/guardar-expensas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ calle, numero, nombrePropietario, expensasComunes, expensasExtraordinarias, periodo, estado })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('modalSuccess').style.display = 'block';
               
                // Ocultar el mensaje después de 3 segundos
            setTimeout(() => {
                modalSuccess.style.display = 'none';
            }, 3000);
               
                // Actualizar la tabla de expensas
                obtenerExpensas();
                // Limpiar el formulario después de guardar
                limpiarFormulario();
            }
        })
        .catch(error => console.error('Error al guardar expensas:', error));
    }
    
    function limpiarFormulario() {
        document.getElementById('cargarExpensasForm').reset(); // Limpia todos los campos del formulario
        document.getElementById('calle').disabled = true; // Vuelve a deshabilitar campos que deberían estar deshabilitados
        document.getElementById('numero').disabled = true;
        document.getElementById('nombrePropietario').disabled = true;
    }

    function obtenerExpensas() {
        fetch('/obtener-expensas')
        .then(response => response.json())
        .then(data => {
            // Función para convertir "MM/YYYY" a un objeto Date
            function periodoAFecha(periodo) {
                const [mes, anio] = periodo.split('/');
                return new Date(anio, mes - 1, 1); // El mes en Date es 0-indexado
            }
    
            // Ordenar los datos por periodo
            data.sort((a, b) => periodoAFecha(b.periodo) - periodoAFecha(a.periodo));
    
            const tbody = document.querySelector('#tablaExpensas tbody');
            tbody.innerHTML = '';
            data.forEach(expensa => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${expensa.id}</td>
                    <td>${expensa.calle}</td>
                    <td>${expensa.numero}</td>
                    <td>${expensa.nombre_propietario || 'No definido'}</td>
                    <td>${expensa.expensas_comunes}</td>
                    <td>${expensa.expensas_extraordinarias}</td>
                    <td>${expensa.periodo}</td>
                    <td>${expensa.estado}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="editarExpensas(${expensa.id})">Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="eliminarExpensas(${expensa.id})">Eliminar</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error('Error al obtener expensas:', error));
    }
    function editarExpensas(id) {
        fetch(`/obtener-expensas/${id}`)
        .then(response => response.json())
        .then(expensa => {
            document.getElementById('calle').value = expensa.calle;
            document.getElementById('numero').value = expensa.numero;
            document.getElementById('nombrePropietario').value = expensa.nombre_propietario;
            document.getElementById('expensasComunes').value = expensa.expensas_comunes;
            document.getElementById('expensasExtraordinarias').value = expensa.expensas_extraordinarias;
            document.getElementById('mes').value = expensa.periodo.split('/')[0];
            document.getElementById('anio').value = expensa.periodo.split('/')[1];
            document.getElementById('estado').value = expensa.estado;
    
            // Cambiar el botón de guardar a un botón de actualización
            const botonGuardar = document.querySelector('#cargarExpensasForm button');
            botonGuardar.textContent = 'Actualizar';
            botonGuardar.setAttribute('onclick', `actualizarExpensas(${id})`);
        })
        .catch(error => console.error('Error al obtener expensa:', error));
    }
    
    function actualizarExpensas(id) {
        const expensasComunes = document.getElementById('expensasComunes').value;
        const expensasExtraordinarias = document.getElementById('expensasExtraordinarias').value;
        const mes = document.getElementById('mes').value;
        const anio = document.getElementById('anio').value;
        const periodo = `${mes}/${anio}`;
        const calle = document.getElementById('calle').value;
        const numero = document.getElementById('numero').value;
        const nombrePropietario = document.getElementById('nombrePropietario').value;
        const estado = document.getElementById('estado').value;
    
        fetch(`/actualizar-expensas/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ calle, numero, nombrePropietario, expensasComunes, expensasExtraordinarias, periodo, estado })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('modalSuccess').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('modalSuccess').style.display = 'none';
                }, 3000);
                obtenerExpensas();
    
                // Cambiar el botón de vuelta a "Guardar"
                const botonGuardar = document.querySelector('#cargarExpensasForm button');
                botonGuardar.textContent = 'Guardar';
                botonGuardar.setAttribute('onclick', 'guardarExpensas()');
    
                // Limpiar el formulario después de actualizar
                limpiarFormulario();
            }
        })
        .catch(error => console.error('Error al actualizar expensas:', error));
    }
    
    function limpiarFormulario() {
        document.getElementById('calle').value = '';
        document.getElementById('numero').value = '';
        document.getElementById('nombrePropietario').value = '';
        document.getElementById('expensasComunes').value = '';
        document.getElementById('expensasExtraordinarias').value = '';
        document.getElementById('mes').value = '';
        document.getElementById('anio').value = '';
        document.getElementById('estado').value = '';
    }
    
 
    function eliminarExpensas(id) {
        fetch(`/eliminar-expensas/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                obtenerExpensas(); // Actualiza la tabla después de eliminar
            }
        })
        .catch(error => console.error('Error al eliminar expensas:', error));
    }

    // Cargar expensas al iniciar la página
    obtenerExpensas();
