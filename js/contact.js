import { auth, db } from "./config.js";
import {
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/auth.user
            const uid = user.uid;
            // ...
            const userNameLabel = document.querySelector(".user-name");
            document.querySelector("#name").value = user.displayName;
            document.querySelector("#email").value = user.email;
        } else {
            // User is signed out
            console.log(`User is signed out`);
        }
    });
});

function sendMail(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
        alert("Please login to send a message.");
        return;
    }
    
    var params = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        message: document.getElementById("message").value,
    };

    const serviceID = "service_ervoqjb";
    const templateID = "template_jrbys8h";

    emailjs.send(serviceID, templateID, params)
        .then(res => {
            document.getElementById("name").value = "";
            document.getElementById("email").value = "";
            document.getElementById("message").value = "";
            console.log(res);
            alert("Your message has been sent successfully!");
            window.location.reload();
        })
        .catch(err => console.error(err));
};

document.querySelector(".send-message").addEventListener("click", sendMail);