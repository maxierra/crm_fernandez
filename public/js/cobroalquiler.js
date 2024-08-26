
      document
        .getElementById("search-form")
        .addEventListener("submit", function (event) {
          event.preventDefault();
          const searchValue = document
            .getElementById("search-input")
            .value.trim();

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
            periodo: "Periodo actual",
            user_id: selectedUser,
            payment_method: paymentMethod,
          };

          const isPreferential = document.getElementById(
            "preferential-treatment"
          ).checked;

          if (isPreferential) {
            cobroData = {
              ...cobroData,
              importe_periodo: document.getElementById("manual-importe-periodo").value.trim(),
              expensas_comunes: document.getElementById("manual-expensas-comunes").value.trim(),
              expensas_extraordinarias: document.getElementById("manual-expensas-extraordinarias").value.trim(),
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
              alert("Cobro registrado exitosamente.");
              console.log("Registro exitoso:", result);
            })
            .catch((error) => console.error("Error al registrar el cobro:", error));
        });
    