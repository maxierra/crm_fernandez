document
  .getElementById("search-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const searchValue = document.getElementById("search-input").value.trim();

    if (searchValue) {
      fetch(`/api/cobro-alquileres?nombre=${encodeURIComponent(searchValue)}`)
        .then((response) => response.json())
        .then((data) => {
          const tableContainer = document.getElementById("table-container");
          const tableBody = document.getElementById("table-body");
          const totalAmountElement = document.getElementById("total-amount");

          tableBody.innerHTML = "";

          let totalAmount = 0;

          data.forEach((item) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.inquilino}</td>
                <td>${item.propietario}</td>
                <td>${item.calle}</td>
                <td>${item.nro}</td>
                <td>${item.dto}</td>
                <td>$ ${item.importe_periodo}</td>
                <td>$ ${item.expensas_comunes}</td>
                <td>$ ${item.expensas_extraordinarias}</td>
            `;
            tableBody.appendChild(row);

            totalAmount += parseFloat(item.total_a_cobrar);
          });

          totalAmountElement.textContent = totalAmount.toFixed(2);
          tableContainer.style.display = "block";
        })
        .catch((error) => console.error("Error fetching data:", error));
    } else {
      const tableContainer = document.getElementById("table-container");
      tableContainer.style.display = "none";
    }
  });

window.addEventListener("load", function () {
  fetch("/users/api/users")
    .then((response) => response.json())
    .then((users) => {
      const userSelect = document.getElementById("user-select");

      userSelect.innerHTML = "";

      users.forEach((user) => {
        const option = document.createElement("option");
        option.value = user.id;
        option.textContent = user.username;
        userSelect.appendChild(option);
      });
    })
    .catch((error) => console.error("Error fetching users:", error));
});

document
  .getElementById("preferential-treatment")
  .addEventListener("change", function () {
    const manualInputs = document.getElementById("manual-inputs");
    if (this.checked) {
      manualInputs.style.display = "block";
    } else {
      manualInputs.style.display = "none";
    }
  });

  document
  .getElementById("submit-cobro")
  .addEventListener("click", function () {
    const selectedUser = document.getElementById("user-select").value;
    const paymentMethod = document.querySelector(
      'input[name="payment-method"]:checked'
    )?.value;

    // Calcula la fecha actual en formato 'YYYY-MM'
    let fechaActual = new Date();
    let año = fechaActual.getFullYear();
    let mes = String(fechaActual.getMonth() + 1).padStart(2, '0'); // Mes en formato 01, 02, etc.
    let periodoActual = `${año}-${mes}`; // Formato 'YYYY-MM'

    // Construcción del objeto cobroData
    let cobroData = {
      inquilino: document
        .querySelector("#table-body tr:first-child td:nth-child(1)")
        .textContent.trim(),
      propietario: document
        .querySelector("#table-body tr:first-child td:nth-child(2)")
        .textContent.trim(),
      calle: document
        .querySelector("#table-body tr:first-child td:nth-child(3)")
        .textContent.trim(),
      nro: document
        .querySelector("#table-body tr:first-child td:nth-child(4)")
        .textContent.trim(),
      dto: document
        .querySelector("#table-body tr:first-child td:nth-child(5)")
        .textContent.trim(),
      periodo: periodoActual, // Asigna la fecha actual calculada al periodo
      user_id: selectedUser,
      payment_method: paymentMethod,
    };

    const isPreferential = document.getElementById(
      "preferential-treatment"
    ).checked;

    if (isPreferential) {
      cobroData = {
        ...cobroData,
        importe_periodo: document
          .getElementById("manual-importe-periodo")
          .value.trim(),
        expensas_comunes: document
          .getElementById("manual-expensas-comunes")
          .value.trim(),
        expensas_extraordinarias: document
          .getElementById("manual-expensas-extraordinarias")
          .value.trim(),
        estado1: "cobrado",
        estado2: "pendiente de rendición",
      };
    } else {
      cobroData = {
        ...cobroData,
        importe_periodo: document
          .querySelector("#table-body tr:first-child td:nth-child(6)")
          .textContent.replace("$", "")
          .trim(),
        expensas_comunes: document
          .querySelector("#table-body tr:first-child td:nth-child(7)")
          .textContent.replace("$", "")
          .trim(),
        expensas_extraordinarias: document
          .querySelector("#table-body tr:first-child td:nth-child(8)")
          .textContent.replace("$", "")
          .trim(),
        estado1: "cobrado",
        estado2: "pendiente de rendición",
      };
    }

    fetch("/api/cobro-alquileres", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cobroData),
    })
      .then((response) => response.json())
      .then((result) => {
        const confirmModal = new bootstrap.Modal(
          document.getElementById("confirmModal")
        );
        const modalMessage = document.getElementById("modal-message");

        if (result.error) {
          // Si hay un error, muestra el mensaje de error
          modalMessage.textContent = result.error;
          modalMessage.style.color = "red";
        } else {
          // Si el cobro es exitoso, muestra el mensaje de éxito
          modalMessage.textContent = result.message;
          modalMessage.style.color = "green";
        }

        confirmModal.show();
      })
      .catch((error) => console.error("Error al registrar el cobro:", error));
  });

document
  .getElementById("print-confirmation")
  .addEventListener("click", function () {
    generatePDF();
    const confirmModal = bootstrap.Modal.getInstance(
      document.getElementById("confirmModal")
    );
    confirmModal.hide();
  });


  function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
  
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
  
    // Colores
    const textColor = [80, 80, 80];
    const lightGrey = [200, 200, 200];
    const logoRed = [255, 69, 0]; // Rojo para el logo FL
  
    // Funciones auxiliares
    function addText(
      text,
      x,
      y,
      fontSize = 10,
      fontStyle = "normal",
      options = {}
    ) {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", fontStyle);
      doc.setTextColor(...textColor);
      doc.text(text, x, y, options);
    }
  
    // Encabezado
    addText("Inmobiliaria Fernández López", 10, 20, 16, "bold");
    addText("Dirección: Congreso 4015, CABA, Coghan", 10, 30, 10);
    addText("Email: flpropiedades@yahoo.com.ar", 10, 35, 10);
  
    // Logo FL en rojo
    doc.setFillColor(...logoRed);
    doc.circle(pageWidth - 25, 20, 10, "F");
    doc.setTextColor(255, 255, 255); // Texto blanco para contraste
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("FL", pageWidth - 25, 20, { align: "center", baseline: "middle" });
  
    // Información del cliente
    addText("Información del Cliente", 10, 60, 12, "bold");
    const inquilino = document.querySelector("#table-body tr td:nth-child(1)").innerText;
    addText(`Inquilino: ${inquilino}`, 10, 70);
    addText(
      `Propietario: ${
        document.querySelector("#table-body tr td:nth-child(2)").innerText
      }`,
      10,
      75
    );
    addText(
      `Dirección: ${
        document.querySelector("#table-body tr td:nth-child(3)").innerText
      } ${document.querySelector("#table-body tr td:nth-child(4)").innerText}, ${
        document.querySelector("#table-body tr td:nth-child(5)").innerText
      }`,
      10,
      80
    );
  
    // Detalles del comprobante
    addText("Detalles del Comprobante", 10, 95, 12, "bold");
    const today = new Date();
    const month = today.toLocaleString("default", { month: "long" }); // Obtiene el nombre del mes
    const year = today.getFullYear();
    addText(`Fecha: ${today.toLocaleDateString()}`, 10, 105);
    addText(`Período Liquidado: ${month} ${year}`, 10, 110);
  
    // Tabla de conceptos
    const startY = 120;
    const rowHeight = 10;
    doc.setFillColor(...lightGrey);
    doc.rect(10, startY, pageWidth - 20, rowHeight, "F");
    addText("Concepto", 15, startY + 7, 10, "bold");
    addText("Importe", pageWidth - 25, startY + 7, 10, "bold", {
      align: "right",
    });
  
    function addTableRow(concept, amount, y) {
      addText(concept, 15, y);
      addText(amount, pageWidth - 25, y, 10, "normal", { align: "right" });
      doc.setDrawColor(...lightGrey);
      doc.line(10, y + 3, pageWidth - 10, y + 3);
    }
  
    addTableRow(
      "Importe del Periodo",
      document.querySelector("#table-body tr td:nth-child(6)").innerText,
      startY + rowHeight + 7
    );
    addTableRow(
      "Expensas Comunes",
      document.querySelector("#table-body tr td:nth-child(7)").innerText,
      startY + rowHeight * 2 + 7
    );
    addTableRow(
      "Expensas Extraordinarias",
      document.querySelector("#table-body tr td:nth-child(8)").innerText,
      startY + rowHeight * 3 + 7
    );
  
    // Total
    const totalY = startY + rowHeight * 4 + 15;
    addText("Total a Cobrar:", 15, totalY, 12, "bold");
    addText(
      document.getElementById("total-amount").innerText,
      pageWidth - 25,
      totalY,
      12,
      "bold",
      { align: "right" }
    );
  
    // Sello "PAGADO"
    doc.setTextColor(0, 150, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("PAGADO", pageWidth - 30, totalY + 20, { angle: 45 });
  
    // Firma
    const signatureY = pageHeight - 30;
    doc.line(10, signatureY, 80, signatureY);
    addText("Carlos Fernández López", 10, signatureY + 10, 10);
  
    // Nota al pie
    addText(
      "Gracias por su pago. Este comprobante es válido como recibo de pago.",
      pageWidth / 2,
      pageHeight - 10,
      8,
      "normal",
      { align: "center" }
    );
  
    // Formatear la fecha actual
    const formattedDate = today.toISOString().slice(0, 10).replace(/-/g, "_");
  
    // Nombre del archivo
    const fileName = `recibo_cobro_alquiler_${inquilino}_${formattedDate}.pdf`;
  
    // Guardar el PDF con el nombre personalizado
    doc.save(fileName);
  }
  
