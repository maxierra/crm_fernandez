$(document).ready(function() {
    function showAlert(message) {
        $('#alertModalBody').text(message);
        $('#alertModal').modal('show');
    }

    // Enviar formulario para agregar o editar contrato usando AJAX
    $('#form-add-contrato').on('submit', function(event) {
        event.preventDefault();

        const contratoId = $('#contrato-id').val();
        const formData = {
            id: contratoId,
            calle: $('#calle').val(),
            nro: $('#nro').val(),
            dto: $('#dto').val(),
            propietario: $('#propietario').val(),
            cbu: $('#cbu').val(),
            inquilino: $('#inquilino').val(),
            comision: $('#comision').val(),
            importe: $('#importe').val(),
            observaciones: $('#observaciones').val(),
            inicio_contrato: $('#inicio_contrato').val(),
            duracion_contrato: $('#duracion_contrato').val(),
            tipo_incremento: $('#tipo_incremento').val(),
            finalizacion_contrato: $('#finalizacion_contrato').val(),
            metodo_pago: $('#metodo_pago').val(),
            monto_deposito: $('#monto_deposito').val(),
            estado: $('#estado').val() // Agregado estado
        };
        const url = contratoId ? `/contratos/update/${contratoId}` : '/contratos/add';

        $.post(url, formData, function(response) {
            if (response.success) {
                location.reload();
            } else {
                showAlert('Error al guardar el contrato');
            }
        });
    });

    // Editar contrato
    $('.btn-edit').on('click', function() {
        const contratoId = $(this).data('id');

        $.get(`/contratos/${contratoId}`, function(contrato) {
            $('#contrato-id').val(contrato.id);
            $('#calle').val(contrato.calle);
            $('#nro').val(contrato.nro);
            $('#dto').val(contrato.dto);
            $('#propietario').val(contrato.propietario);
            $('#cbu').val(contrato.cbu);
            $('#inquilino').val(contrato.inquilino);
            $('#comision').val(contrato.comision);
            $('#importe').val(contrato.importe);
            $('#observaciones').val(contrato.observaciones);
            $('#inicio_contrato').val(contrato.inicio_contrato);
            $('#duracion_contrato').val(contrato.duracion_contrato);
            $('#tipo_incremento').val(contrato.tipo_incremento);
            $('#finalizacion_contrato').val(contrato.finalizacion_contrato);
            $('#metodo_pago').val(contrato.metodo_pago);
            $('#monto_deposito').val(contrato.monto_deposito);
        });
    });

    // Eliminar contrato
    $('.btn-delete').on('click', function() {
        const contratoId = $(this).data('id');
        if (confirm('¿Estás seguro de eliminar este contrato?')) {
            $.post(`/contratos/delete/${contratoId}`, function(response) {
                if (response.success) {
                    location.reload();
                } else {
                    showAlert('Error al eliminar el contrato');
                }
            });
        }
    });
});
