const app = (function () {
    const employeeNameInput = document.getElementById("employeeName");
    const punchInButton = document.getElementById("punchInButton");
    const punchOutButton = document.getElementById("punchOutButton");
    const statusElement = document.getElementById("status");
    const workingHoursElement = document.getElementById("workingHours");
    const employeeListElement = document.getElementById("employeeList");
    const printHoursButton = document.getElementById("printHoursButton");
    const printHoursWrapper = document.getElementById("printHoursWrapper");
    const adminPasswordButton = document.getElementById("adminPasswordButton");

    let employeeData = JSON.parse(localStorage.getItem("employeeData")) || [];
    let currentEmployee = null;

    function calculateWorkingHours(punchIn, punchOut) {
        if (!punchIn || !punchOut) {
            return "N/A";
        }

        const timeDiff = punchOut.getTime() - punchIn.getTime();
        const hours = Math.floor(timeDiff / (1000 * 60 * 60))
            .toString()
            .padStart(2, "0");
        const minutes = Math.floor((timeDiff / (1000 * 60)) % 60)
            .toString()
            .padStart(2, "0");
        const seconds = Math.floor((timeDiff / 1000) % 60)
            .toString()
            .padStart(2, "0");

        return `${hours}:${minutes}:${seconds}`;
    }

    function updateLocalStorage() {
        try {
            localStorage.setItem("employeeData", JSON.stringify(employeeData));
        } catch (error) {
            console.error("Error saving data to local storage:", error);
            alert("An error occurred while saving data. Please try again later.");
        }
    }

    function loadFromLocalStorage() {
        try {
            const storedData = localStorage.getItem("employeeData");
            if (storedData) {
                employeeData = JSON.parse(storedData).filter(
                    (employee) => !employee.punchOut
                );
                employeeData.forEach((employee) => {
                    employee.punchIn = new Date(employee.punchIn);
                    employee.punchOut = employee.punchOut ? new Date(employee.punchOut) : null;
                });
            }
        } catch (error) {
            console.error("Error loading data from local storage:", error);
            alert("An error occurred while loading data. Please try again later.");
        }
    }

    function loadForReport() {
        try {
            const storedData = localStorage.getItem("employeeData");
            if (storedData) {
                employeeData = JSON.parse(storedData);
                employeeData.forEach((employee) => {
                    employee.punchIn = new Date(employee.punchIn);
                    employee.punchOut = employee.punchOut ? new Date(employee.punchOut) : null;
                });
            }
        } catch (error) {
            console.error("Error loading data from local storage:", error);
            alert("An error occurred while loading data. Please try again later.");
        }
    }

    function findEmployeeByName(name) {
        return employeeData.find(
            (employee) => employee.name.toLowerCase() === name.toLowerCase()
        );
    }

    function onPunchIn() {
        const employeeName = employeeNameInput.value.trim();

        if (employeeName === "") {
            statusElement.textContent = "Please enter employee name.";
            return;
        }

        const existingEmployee = findEmployeeByName(employeeName);

        if (existingEmployee && !existingEmployee.punchOut) {
            // Employee already punched in, reset the punchOut time
            existingEmployee.punchOut = null;
            currentEmployee = existingEmployee;
            statusElement.textContent = `Punched in as ${employeeName}`;
            updateLocalStorage();
        } else if (existingEmployee && existingEmployee.punchOut) {
            // Update existing employee's punch-in time
            existingEmployee.punchIn = new Date();
            existingEmployee.punchOut = null;
            currentEmployee = existingEmployee;
            statusElement.textContent = `Punched in as ${employeeName}`;
            updateLocalStorage();
        } else {
            const newEmployee = {
                name: employeeName,
                punchIn: new Date(),
                punchOut: null,
            };

            employeeData.push(newEmployee);
            currentEmployee = newEmployee;
            statusElement.textContent = `Punched in as ${employeeName}`;

            // Reset working hours
            workingHoursElement.textContent = "";

            updateLocalStorage();
            renderEmployeeList();
        }

        employeeNameInput.value = "";
    }

    function onPunchOut() {
        if (!currentEmployee) {
            statusElement.textContent = "No employee currently punched in.";
            return;
        }

        const employeeIndex = employeeData.findIndex(
            (employee) => employee.name === currentEmployee.name
        );

        employeeData[employeeIndex].punchOut = new Date();

        const workingHours = calculateWorkingHours(
            currentEmployee.punchIn,
            employeeData[employeeIndex].punchOut
        );

        statusElement.textContent = "Punched out";
        workingHoursElement.textContent = `Total working hours: ${workingHours}`;

        updateLocalStorage();

        employeeData.splice(employeeIndex, 1); // Remove the employee from the array

        currentEmployee = null;
        employeeNameInput.value = "";

        renderEmployeeList();
    }

    function renderEmployeeList() {
        employeeListElement.innerHTML = "";

        const activeEmployees = employeeData.filter(employee => !employee.punchOut);

        activeEmployees.forEach((employee) => {
            const listItem = document.createElement("li");
            listItem.textContent = employee.name;
            listItem.id = `employee-${employee.name}`; // Add id attribute
            if (employee.punchIn && !employee.punchOut) {
                listItem.classList.add("punched-in");
            }
            listItem.addEventListener("click", () => {
                selectEmployee(employee);
            });
            employeeListElement.appendChild(listItem);

            // Add outline to the currently selected employee
            if (currentEmployee && employee.name === currentEmployee.name) {
                listItem.classList.add("current-employee");
            }
        });

        if (activeEmployees.length === 0) {
            const listItem = document.createElement("li");
            listItem.textContent = "No employees recorded.";
            employeeListElement.appendChild(listItem);
        }
    }

    function selectEmployee(employee) {
        // Remove outline from previously selected employee
        const previouslySelected = document.querySelector(".current-employee");
        if (previouslySelected) {
            previouslySelected.classList.remove("current-employee");
        }

        // Add outline to newly selected employee
        const selectedEmployee = document.getElementById(`employee-${employee.name}`);
        selectedEmployee.classList.add("current-employee");

        // Update the currentEmployee variable
        currentEmployee = employee;

        // Update the employee list by re-rendering it
        renderEmployeeList();
    }

    function printHours() {
        loadForReport();

        const now = new Date();
        const printedDate = now.toLocaleDateString();
        const printedTime = now.toLocaleTimeString();

        let hoursReport = `
    <table>
      <caption>Employee Hours (Printed on ${printedDate} at ${printedTime})</caption>
      <thead>
        <tr>
          <th>Employee</th>
          <th>Punch In</th>
          <th>Punch Out</th>
          <th>Total Hours</th>
        </tr>
      </thead>
      <tbody>
  `;

        employeeData.forEach((employee) => {
            if (employee.punchOut) {
                const punchInTime = employee.punchIn instanceof Date ? employee.punchIn.toLocaleTimeString() : "N/A";
                const punchOutTime = employee.punchOut instanceof Date ? employee.punchOut.toLocaleTimeString() : "N/A";
                const workingHours = calculateWorkingHours(employee.punchIn, employee.punchOut);

                hoursReport += `
        <tr>
          <td>${employee.name}</td>
          <td>${punchInTime}</td>
          <td>${punchOutTime}</td>
          <td>${workingHours}</td>
        </tr>
      `;
            }
        });

        hoursReport += `
      </tbody>
    </table>
  `;

        const printWindow = window.open("", "_blank");
        printWindow.document.open();
        printWindow.document.write(`
    <html>
      <head>
        <title>Employee Hours Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
          }
          th {
            background-color: #f2f2f2;
          }
          caption {
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 10px;
          }
          .selected-employee {
            outline: 2px solid blue;
          }
        </style>
      </head>
      <body>
        ${hoursReport}
      </body>
    </html>
  `);
        printWindow.document.close();

        printWindow.print();
    }

    function showAdminPasswordPrompt() {
        const password = "admin123"; // Change this to your desired password

        const userInput = prompt("Enter the admin password:");

        if (userInput === password) {
            printHoursWrapper.style.display = "block";
            renderEmployeeList();
        } else {
            alert("Incorrect password. Access denied.");
        }
    }

    function initialize() {
        loadFromLocalStorage();
        punchInButton.addEventListener("click", onPunchIn);
        punchOutButton.addEventListener("click", onPunchOut);
        printHoursButton.addEventListener("click", printHours);
        adminPasswordButton.addEventListener("click", showAdminPasswordPrompt);
        renderEmployeeList();
    }

    return {
        initialize: initialize,
    };
})();

app.initialize();
