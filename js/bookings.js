import { auth, db } from "./config.js";
import {
    collection,
    query,
    where,
    getDocs,
    deleteDoc,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const tableBody = document.getElementById("booking-table-body");

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const q = query(
            collection(db, "bookings"),
            where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${data.from}</td>
                <td>${data.to}</td>
                <td>${data.departure}</td>
                <td>${data.return}</td>
                <td>${data.tripType}</td>
                <td>${data.price}</td>
                <td><span class="badge badge-${getStatusClass(data.status)}">${data.status}</span></td>
                <td>
                    ${data.status === "pending" ?
                    `<button class="btn btn-sm btn-success pay-btn" data-id="${docSnap.id}">Pay</button>` :
                    ""
                }
                    <button class="btn btn-sm btn-danger cancel-btn" data-id="${docSnap.id}">Cancel</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        addActionListeners();
    } else {
        alert("Please log in to view your bookings.");
        window.location.href = "register.html";
    }
});

function getStatusClass(status) {
    switch (status) {
        case "paid": return "success";
        case "pending": return "warning";
        case "cancelled": return "danger";
        default: return "secondary";
    }
}

function addActionListeners() {
    document.querySelectorAll(".cancel-btn").forEach(button => {
        button.addEventListener("click", async () => {
            const id = button.getAttribute("data-id");
            const confirmDelete = confirm("Are you sure you want to cancel this booking?");
            if (confirmDelete) {
                await deleteDoc(doc(db, "bookings", id));
                alert("Booking cancelled.");
                location.reload();
            }
        });
    });

    document.querySelectorAll(".pay-btn").forEach(button => {
        button.addEventListener("click", async () => {
            const id = button.getAttribute("data-id");
            const confirmPay = confirm("Proceed to mock payment for this booking?");
            if (confirmPay) {
                await updateDoc(doc(db, "bookings", id), {
                    status: "paid"
                });
                alert("Payment successful. Booking confirmed.");
                location.reload();
            }
        });
    });
}