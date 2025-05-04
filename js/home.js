import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { auth, db } from "./config.js";
import {
    collection,
    addDoc, doc, updateDoc,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const profileBtn = document.querySelector(".userProfile");
const orderBtn = document.querySelector(".order");
emailjs.init({
    publicKey: 'z6n_Cr4qh7mTfnTX0',
});

const weatherAPIKey = "5d6b25a0967e5e4abbb198378fe70186";

async function getWeatherForecast(cityName) {
    const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&units=metric&appid=${weatherAPIKey}`
    );
    const data = await response.json();
    console.log(data);
    return data;
}

function displayWeather(data) {
    const container = document.querySelector('#weather .weathergroup');
    container.innerHTML = "";

    const daysMap = {}; // tạo một object để nhóm các ngày
    data.list.forEach(item => {
        const date = item.dt_txt.split(" ")[0]; // lấy ngày từ chuỗi dt_txt
        if (!daysMap[date]) daysMap[date] = [];
        daysMap[date].push(item); 
    });

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let count = 0;
    for (const date in daysMap) {
        if (count >= 5) break;
        const items = daysMap[date];
        const temps = items.map(i => i.main.temp);
        const avg = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length); // tính nhiệt độ trung bình

        const city = data.city.name;
        const day = new Date(date).getDay();
        const weatherHTML = `
        <div id="day${count}">
            <div class="row">
                    <div class="weather-item">
                        <h6>${city} (${dayNames[day]})</h6>
                        <div class="weather-icon">
                            <img src="https://openweathermap.org/img/wn/${items[0].weather[0].icon}@2x.png" alt="">
                        </div>
                        <span>${avg}&deg;C</span>
                        <ul class="time-weather">
                            ${items.slice(0, 4).map(i => {
            const hour = new Date(i.dt_txt).getHours();
            return `<li>${hour}h <span>${Math.round(i.main.temp)}&deg;</span></li>`;
        }).join('')}
                        </ul>
                    </div>
            </div>
        </div>`;
        container.innerHTML += weatherHTML;
        count++;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userNameLabel = document.querySelector(".user-name");
            userNameLabel.textContent = "Hello " + user.displayName || user.email;
            document.querySelector(".gotoRegister").style.display = 'none';
            profileBtn.style.display = 'flex';

            orderBtn.disabled = false;
            orderBtn.textContent = "Order Ticket Now";
        } else {
            profileBtn.style.display = 'none';
            orderBtn.disabled = true;
            orderBtn.textContent = "Please Login to Order";
        }
    });
    countriesOpts();

    document.getElementById('to').addEventListener('change', async (e) => {
        const city = e.target.value;
        try {
            const weatherData = await getWeatherForecast(city);
            displayWeather(weatherData);
        } catch (err) {
            console.error("Failed to fetch weather:", err);
        }
    });
});

function countriesOpts() {
    const dropdowns = [document.getElementById("from"), document.getElementById("to")];

    fetch("https://restcountries.com/v3.1/all")
        .then(response => response.json())
        .then(countries => {
            const sortedCountries = countries.sort((a, b) => a.name.common.localeCompare(b.name.common));
            sortedCountries.forEach(country => {
                dropdowns.forEach(dropdown => {
                    const option = document.createElement("option");
                    option.value = country.name.common;
                    option.textContent = country.name.common;
                    dropdown.appendChild(option);
                });
            });
        })
        .catch(error => console.error("Error fetching countries:", error));
}


document.getElementById('form-submit').addEventListener('submit', async (e) => {
    e.preventDefault(); // e: event object

    const user = auth.currentUser;
    if (!user) {
        alert('Please login to book tickets');
        window.location.href = 'register.html';
        return;
    }

    const from = e.target.from.value; // e.target: lấy dữ liệu từ form
    const to = e.target.to.value;
    const departure = e.target.deparure.value;
    const returnDate = e.target.return.value;
    const tripType = document.querySelector('input[name="trip"]:checked').value;
    const price = calculatePrice(tripType);

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
        const bookingId = docRef.id;
        console.log(`Booking saved with ID: ${bookingId}`);
        // Generate QR code
        const qrUrl = await generateBookingQR(tripType, bookingId);
        await updateDoc(docRef, { qrCodeUrl: qrUrl });
        console.log(`QR Code URL: ${qrUrl}`);
        showPaymentModal(bookingId);

        const params = {
            order_id: bookingId,
            to_email: user.email,
            qrImg: qrUrl,
            from: from,
            to: to,
            departure_date: departure,
            return_date: returnDate,
            type: tripType,
            price: price,
        };
        const serviceID = "service_qsn61o2";
        const templateID = "template_5vvrfh9";

        await emailjs.send(serviceID, templateID, params)
            .then(res => {
                console.log(res);
                alert("Confirmation email sent successfully!");
            })
            .catch(err => console.error(err));

        const weatherData = await getWeatherForecast(to);
        displayWeather(weatherData);

        alert(`Ticket ordered successfully!`);
        window.open("./bookings.html", "_blank");
        e.target.reset();
    } catch (error) {
        console.error("Error adding booking: ", error);
        alert('Failed to order ticket. Please try again.');
    }
});

document.getElementById('from').addEventListener('change', updatePrice);
document.getElementById('to').addEventListener('change', updatePrice);
document.querySelectorAll('input[name="trip"]').forEach(radio => {
    radio.addEventListener('change', updatePrice);
});


function calculatePrice(tripType) {
    const basePrice = 100;
    const tripMultiplier = tripType === 'round' ? 1.8 : 1;
    return Math.round(basePrice * tripMultiplier);
}

function updatePrice() {
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;
    const tripType = document.querySelector('input[name="trip"]:checked')?.value;

    if (from && to && tripType) {
        const price = calculatePrice(from, to, tripType);
    }
}

function showPaymentModal(bookingId) {
    const confirmed = confirm("Do you want to pay right now?");
    if (confirmed) {
        document.getElementById('qrModal').style.display = 'flex';
        updateBookingStatus(bookingId, "wait to verify");
    }
}

async function updateBookingStatus(bookingId, status) {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, {
        status: status
    });
}

function generateBookingQR(tripType, bookingId) {
    return new Promise((resolve, reject) => { // Promise để xử lý bất đồng bộ
        const typeCode = tripType === 'round' ? '2' : '1';
        const content = `${typeCode}-${bookingId}`;
        QRCode.toDataURL(content, { width: 200 }, function (err, url) {
            if (err) {
                console.error(err);
                reject(err) // Reject nếu có lỗi
            } else {
                resolve(url); // Resolve với URL của QR code 
            }

        });
    })
}

profileBtn.addEventListener("click", () => {
    window.location.href = "profile.html";
});

document.getElementById('confirmButton').addEventListener('click', () => {
    alert('Thank you! We will verify your payment shortly.');
    document.getElementById('qrModal').style.display = 'none';
});
