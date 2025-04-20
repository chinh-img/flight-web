
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { auth, db } from "./config.js";
import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            alert('Please login to place an order');
            window.location.href = 'register.html';
        }
    });

    document.getElementById('order-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const user = auth.currentUser;
        const from = e.target.from.value;
        const to = e.target.to.value;
        const departure = e.target.departure.value;
        const returnDate = e.target.return.value;
        const tripType = document.querySelector('input[name="trip"]:checked').value;
        const price = calculatePrice(from, to, tripType);

        try {
            const docRef = await addDoc(collection(db, "bookings"), {
                userId: user.uid,
                userEmail: user.email,
                from,
                to,
                departure,
                return: returnDate,
                tripType,
                price,
                status: "pending",
                createdAt: serverTimestamp()
            });

            alert(`Order placed successfully! Booking ID: ${docRef.id}`);
            e.target.reset();
        } catch (error) {
            console.error("Error adding booking: ", error);
            alert('Failed to place order. Please try again.');
        }
    });
});

function calculatePrice(from, to, tripType) {
    const basePrice = 100;
    const distanceMultiplier = getDistanceMultiplier(from, to);
    const tripMultiplier = tripType === 'round' ? 1.8 : 1;
    return Math.round(basePrice * distanceMultiplier * tripMultiplier);
}

function getDistanceMultiplier(from, to) {
    const routes = {
        'Cambodia-Hong Kong': 1.5,
        'Cambodia-India': 2.0,
        // Add other routes as needed
    };
    const key = `${from}-${to}`;
    return routes[key] || 1.2;
}