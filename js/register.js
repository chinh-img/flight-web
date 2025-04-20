import { auth, db } from "./config.js"
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    sendEmailVerification,
    GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";


const container = document.querySelector('.container');
const registerSwitch = document.querySelector('.register-btn');
const loginSwitch = document.querySelector('.login-btn');
const signUpBtn = document.querySelector(".signUpSubmit");
const signInBtn = document.querySelector(".signInSubmit");
const googleBtn = document.querySelector(".bxl-google");

registerSwitch.addEventListener('click', () => {
    container.classList.add('active');
})

loginSwitch.addEventListener('click', () => {
    container.classList.remove('active');
})
// SIGN UP
signUpBtn.addEventListener("click", (e) => {
    e.preventDefault()
    const username = document.querySelector(".name-register");
    const email = document.querySelector(".email-register");
    const pass = document.querySelector(".pass-register");

    createUserWithEmailAndPassword(auth, email.value, pass.value)
        .then((userCredential) => {
            // Signed up 
            const user = userCredential.user;

            updateProfile(user, {
                displayName: username.value
            }).then(async () => {
                console.log(`${user.email} has signed up!`);
                const docRef = await setDoc(doc(db, "users", user.uid), {
                    username: user.displayName,
                    email: user.email,
                    id: user.uid,
                    createdAt: new Date(),
                    role: "user",
                });
                // Send email verifycation
                sendEmailVerification(user)
                    .then(() => {
                        alert("Verification email sent. Please check your inbox");
                        container.classList.remove('active');
                    })
                    .catch(error => {
                        console.error(`Error sending verification email: ${error}`)
                    });
            })

        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error(`Error: ${errorMessage}`);
        });
});
// EMAIL SIGN IN
signInBtn.addEventListener("click", (e) => {
    e.preventDefault()
    const email = document.querySelector(".email-signIn");
    const pass = document.querySelector(".pass-signIn");

    signInWithEmailAndPassword(auth, email.value, pass.value)
        .then(async (userCredential) => {
            // Signed in 
            const user = userCredential.user;
            console.log(user);
            if (user.emailVerified) {
                const docRef = doc(db, "users", user.uid);
                await updateDoc(docRef, {
                    verified: user.emailVerified,
                    lastestLogin: new Date(),
                });
                // Dữ liệu được lưu trữ trong sessionStorage chỉ khả dụng trong suốt thời gian của phiên trang
                sessionStorage.setItem("loggedInUser", JSON.stringify({ uid: user.uid, email: user.email }));
                alert(`${user.email} has successfully signed in`);
                window.location.href = "/JSI09/2093_flight/loading.html";
            } else {
                alert("Please verify your email before signing in.");
            }

        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error(`Error: ${errorMessage}`);
        });
});

// GOOGLE SIGN IN
const ggprovider = new GoogleAuthProvider();
googleBtn.addEventListener("click", e => {
    e.preventDefault();
    signInWithPopup(auth, ggprovider)
        .then((result) => {
            // This gives you a Google Access Token. You can use it to access the Google API.
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            // The signed-in user info.
            const user = result.user;
            // IdP data available using getAdditionalUserInfo(result)
            console.log(`User: ${user.email} has successfully signed in with google`);
            window.location.href = "/JSI09/2093_flight/loading.html";

        }).catch((error) => {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            // The email of the user's account used.
            const email = error.customData.email;
            // The AuthCredential type that was used.
            const credential = GoogleAuthProvider.credentialFromError(error);
            console.error(`Error: ${errorMessage}`);
        });
});
// FORGET PASSWORD
document.querySelector(".forgot-link").addEventListener("click", () => {
    if (document.querySelector(".email-signIn").value === "") {
        alert("Please fill the email box first before reset pass word");
    } else {
        sendPasswordResetEmail(auth, document.querySelector(".email-signIn").value)
            .then(() => {
                // Password reset email sent!
                alert("Please check your email");
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error(`Error: ${errorMessage}`);
            });
    }
});