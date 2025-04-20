import { auth, db } from './config.js';
import {
    onAuthStateChanged,
    signOut, deleteUser, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js"
import {
    doc, getDoc,
    deleteDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";


const userName = document.querySelectorAll(".user-name");
const userEmail = document.querySelectorAll(".user-email");
const userPhone = document.querySelector(".user-phone");
const userBDate = document.querySelector(".user-birth");
const userCreated = document.querySelector(".user-created");
const lastLogin = document.querySelector(".last-login");
let data = null;
// Check if user is logged in
document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/auth.user
            const uid = user.uid;
            console.log(user);
            const userRef = doc(db, "users", uid);
            getDoc(userRef)
                .then(docSnap => {
                    if (docSnap.exists()) {
                        data = docSnap.data();
                        // Update the user information in the HTML
                        updateInfor(data);
                    } else {
                        console.log("User not found!");
                    }
                })
                .catch(error => {
                    console.error(`Error getting document: ${error}`);
                });
        } else {
            signOutBtn.style.display = 'none';
            // User is signed out
            console.log(`User is signed out`);
        }
    });
});

function updateInfor(data) {
    userName.forEach(element => {
        element.innerHTML = data.username;
    });
    userEmail.forEach(element => {
        element.innerHTML = data.email;
    });
    userPhone.innerHTML = data.phone || "None";
    const converDate = new Date(data.createdAt.seconds * 1000); // Chuyển đổi giây thành mili giây
    // console.log(converDate);
    userCreated.innerHTML = converDate.toLocaleDateString() || "None";
    lastLogin.innerHTML = data.lastestLogin ? new Date(data.lastestLogin.seconds * 1000).toLocaleDateString() : "None";
    userBDate.innerHTML = data.birthDate ? new Date(data.birthDate.seconds * 1000).toLocaleDateString() : "None";
}

// SIGN OUT
const signOutBtn = document.querySelector(".signOut");
signOutBtn.addEventListener("click", () => {
    signOutUser()
});
function signOutUser(){
    signOut(auth).then(() => {
        // Sign-out successful.
        window.location.href = "/JSI09/2093_flight/loading.html";
    }).catch(error => {
        // An error happened.
        console.error(`Sign-out error: ${error}`);
    });
}

// DELETE ACCOUNT
const deleteAccountBtn = document.querySelector(".delete-account");

deleteAccountBtn.addEventListener("click", () => {
    const user = auth.currentUser;
    console.log(user);
    if (user) {
        deleteUser(user).then(async () => {
            await deleteDoc(doc(db, "users", user.uid));
            // User deleted.
            alert("Account deleted successfully.");
            window.location.href = "/JSI09/2093_flight/loading.html";
        }).catch((error) => {
            console.error(`Error deleting account: ${error}`);
        });
    } else {
        console.log("No user is signed in.");
    }
});

// UPDATE ACCOUNT
const editBtn = document.querySelector(".personal-edit");
editBtn.addEventListener("click", () => {
    if (editBtn.innerHTML.includes("Edit")) {
        editBtn.innerHTML = "Save";
        const infoValues = document.querySelectorAll(".info-value");

        infoValues.forEach(element => {
            const inputInfo = document.createElement("input");
            const parent = element.parentNode;
            const labelName = parent.querySelector(".info-label").innerText.trim().toLowerCase();

            // Set input attributes based on label name
            switch (labelName) {
                case "phone":
                    inputInfo.setAttribute("type", "tel");
                    inputInfo.setAttribute("maxlength", 10);
                    inputInfo.addEventListener("input", () => {
                        if (inputInfo.value.length > 10) {
                            inputInfo.value = inputInfo.value.slice(0, 10);
                        }
                    });
                    break;
                case "email":
                    inputInfo.setAttribute("type", "email");
                    break;
                case "date of birth":
                    inputInfo.setAttribute("type", "date");
                    break;
                case "default":
                    inputInfo.setAttribute("type", "text")
                    break;
            }


            inputInfo.value = element.innerHTML;
            inputInfo.classList.add("input-info");

            parent.replaceChild(inputInfo, element);
        });

    } else {
        editBtn.innerHTML = `<i class="fas fa-pencil-alt"></i> Edit`;
        const inputFields = document.querySelectorAll(".input-info");
        const updatedData = {};

        inputFields.forEach(input => {
            const parent = input.parentNode;
            const labelName = parent.querySelector(".info-label").innerText.trim().toLowerCase();
            const originalValue = parent.querySelector(".info-value")?.innerHTML.trim();

            if (input.value.trim !== originalValue && input.value !== "") {
                switch (labelName) {
                    case "username":
                        updatedData.username = input.value? input.value : data.username;
                        break;
                    case "email":
                        updatedData.email = input.value ? input.value : data.email;
                        break;
                    case "phone":
                        updatedData.phone = input.value? input.value : data.phone;
                        break;
                    case "date of birth":
                        updatedData.birthDate = new Date(input.value? input.value : data.birthDate);
                        break;
                }
            }

            // Replace input with label
            const label = document.createElement("label");
            label.classList.add("info-value");
            label.innerHTML = input.value;
            parent.replaceChild(label, input);
        });

        // Update the user information to firestore
        updateUserInfo(updatedData)
    }
});

async function updateUserInfo(data) {
    const user = auth.currentUser;
    if (user) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, data)
            .then(() => {
                alert("User information updated successfully.");
                window.location.reload();
            })
            .catch((error) => {
                console.error(`Error updating user information: ${error}`);
            });
    } else {
        console.log("No user is signed in.");
    }
}

// RESET PASSWORD
const resetPassBtn = document.querySelector(".reset-password");
resetPassBtn.addEventListener("click", () => {
    const user = auth.currentUser;
    if (user) {
        sendPasswordResetEmail(auth, user.email)
            .then(() => {
                // Password reset email sent!
                // ..
                alert("Password reset email sent")
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                // ..
                console.error(`Error: ${errorMessage}`);
            });
    } else {
        alert(`No user is signed in`)
    }
});

// View Flights
const viewFlightBtn = document.querySelector(".view-flights");
viewFlightBtn.addEventListener("click", () => {
    window.open("/JSI09/2093_flight/bookings.html");
});