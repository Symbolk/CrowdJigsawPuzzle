'use strict';

const splashPage = document.querySelector('#page-splash');
const signInEmail = document.querySelector('#sign-in-email');
const signUpEmail = document.querySelector('#sign-up-email');
const signInGoogle = document.querySelector('#sign-in-google');
const psResetButton = document.querySelector('#reset-password');
const userPic = document.querySelector('#user-pic');
const userName = document.querySelector('#user-name');


var listeningFirebaseRefs = [];
var currentUID;
var currentUName;
/**
 * click the user charm and show the user profile
 */
(function () {
    let showButton = document.querySelector('#show-user');
    let dialog = document.querySelector('#user-profile');
    let closeButton = document.querySelector('#close-button');
    let signOutButton = document.querySelector('#sign-out-button');

    if (!dialog.showModal) {
        dialogPolyfill.registerDialog(dialog);
    }

    closeButton.addEventListener('click', event => {
        dialog.close();
    });

    showButton.addEventListener('click', event => {
        dialog.showModal();
    });

    signOutButton.addEventListener('click', event => {
        firebase.auth().signOut();
        dialog.close();
    });
}());


/**
 * Clean up the UI and remove all listeners
 */
function cleanUI() {
    listeningFirebaseRefs.forEach(function (ref) {
        ref.off();
    });
    listeningFirebaseRefs = [];
}

/**
 * Write the user profile into the database
 * @param {*} userId 
 * @param {*} name 
 * @param {*} email 
 * @param {*} imageUrl 
 */
function writeUserData(userId, name, email, imageUrl) {
    firebase.database().ref('users/' + userId).set({
        username: name,
        email: email,
        profile_picture: imageUrl
    });
}

/**
 * Initialize the database which keeps all the links
 * For every tile/node, create one record
 * RUN ONLY ONCE
 */
function initDatabase(tilesNum){
    for(let i = 0;i < tilesNum;i++){
        firebase.database().ref('links/' + i).set({
            self : i
        });
    }
}

/**
 *  Every release and combine update one link in the database
 *  When one link is created by one user: 
 *  1, If the link does not exist, update the tile list of the selected tile and the combined tile;
 *  2, If the link already exists, push(append) the user to the supporter list(child) of the selected tile;
 *  When one link is broken by one user:
 *  1, Remove the user from the supporter list of the 2 tiles;
 *  2, If the user is the last one supporter, remove the link
 * @param {*} sourceTileIndex the selected tile index
 * @param {*} targetTileIndex the around combined tile index
 */
function updateLink(sourceTileIndex, targetTileIndex){
    // Update the link bidirectionally
    let sourceRef=firebase.database().ref('links/' + sourceTileIndex + '/' + targetTileIndex);
    let targetRef=firebase.database().ref('links/' + targetTileIndex + '/' + sourceTileIndex);
    
    sourceRef.push({
        supporter : currentUName
    });
    
    targetRef.push({
        supporter : currentUName
    });
}

/**
 * Track the user state change
 * @param {*} user 
 */
function onAuthStateChanged(user) {
    if (user && currentUID === user.uid) {
        return;
    }
    // cleanUI();
    if (user) {
        // user is signed in
        currentUID = user.uid;
        currentUName = user.displayName || user.email ;
        splashPage.style.display = 'none';
        writeUserData(user.uid, user.displayName, user.email, user.photoURL);
        userName.textContent = user.displayName || user.email;
        // userPic.style.backgroundImage = 'url(' + (user.photoURL || '../images/profile_placeholder.png') + ')';
        // userPic.src= 'url(' + (user.photoURL || '../images/profile_placeholder.png') +')';
    } else {
        currentUID = null;
        splashPage.style.display = '';
    }
}

function checkEmail(email) {
    const pattern = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/;
    if (pattern.test(email.value)) {
        email.style.color = "green";
        return true;
    } else {
        // email.style.color = "red";
        return false;
    }
}

function signInWithEmail() {
    if (firebase.auth().currentUser) {
        firebase.auth().signOut();
    } else {
        let email = document.getElementById('email');
        let password = document.getElementById('password');
        if (!checkEmail(email)) {
            alert('邮箱格式不正确！');
            email.focus();
            signInEmail.disabled = false;
            return;
        }
        if(password.value.length<3){
            alert('请输入密码！');
            return;
        }

        firebase.auth().signInWithEmailAndPassword(email.value, password.value).catch(error => {
            if (error.code === 'auth/wrong-password') {
                alert('密码错误！');
            } else if (error.code == 'auth/user-not-found') {
                alert('用户不存在！');
            }else{
                alert(error.message);
                console.log(error);
            }
            signInEmail.disabled = false;
        });
    }
    signInEmail.disabled = true;
}

function sendPSResetEmail() {
    let email = document.getElementById('email');
    // [START sendpasswordemail]
    firebase.auth().sendPasswordResetEmail(email.value).then(function () {
        // Password Reset Email Sent!
        // [START_EXCLUDE]
        alert('密码重置邮件已发送！');
        // [END_EXCLUDE]
    }).catch(function (error) {
        // Handle Errors here.
        let errorCode = error.code;
        let errorMessage = error.message;
        // [START_EXCLUDE]
        if (errorCode == 'auth/invalid-email') {
            alert('邮箱格式不正确！');
        } else if (errorCode == 'auth/user-not-found') {
            alert('用户不存在！');    
        }else{
            alert(errorMessage);              
            console.log(error);
        }
        // [END_EXCLUDE]
    });
    // [END sendpasswordemail];
}

function handleSignUp() {
        let email = document.getElementById('email');
        let password = document.getElementById('password');
        if (!checkEmail(email)) {
            alert('邮箱格式不正确！');
            email.focus();
            signInEmail.disabled = false;
            return;
        }
        if (password.value.length < 3) {
            alert('请输入密码！');
            return;
        }
        // Sign in with email and pass.
        // [START createwithemail]
        firebase.auth().createUserWithEmailAndPassword(email.value, password.value).catch(function(error) {
            // Handle Errors here.
            let errorCode = error.code;
            let errorMessage = error.message;
            // [START_EXCLUDE]
            if (errorCode == 'auth/weak-password') {
                alert('密码太弱！');
            } else {
                alert(errorMessage);
            }
            console.log(error);
            // [END_EXCLUDE]
        }).then(function(){
            alert('注册成功，但邮箱未验证！');
        });
        // [END createwithemail]
    }

window.addEventListener('load', function () {
    firebase.auth().onAuthStateChanged(onAuthStateChanged);
    signInGoogle.addEventListener('click', function () {
        let provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider);
    });

    signInEmail.addEventListener('click', signInWithEmail, false);
    signUpEmail.addEventListener('click', handleSignUp, false);
    psResetButton.addEventListener('click', sendPSResetEmail, false);
    signInEmail.disabled = false;
}, false);