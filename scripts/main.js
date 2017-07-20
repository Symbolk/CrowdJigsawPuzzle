'use strict';

const splashPage = document.querySelector('#page-splash');
const signInEmail = document.querySelector('#sign-in-email');
const signUpEmail = document.querySelector('#sign-up-email');
const signInGoogle = document.querySelector('#sign-in-google');
const psResetButton = document.querySelector('#reset-password');
const userPic = document.querySelector('#user-pic');
const userName = document.querySelector('#user-name');


var listeningFirebaseRefs = [];
var currentUID; // firebase.auth().currentUser.uid;
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

Array.prototype.removeByValue = function (val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == val) {
            this.splice(i, 1);
            break;
        }
    }
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
        photoURL: imageUrl
    });
}


/**
 *  Triggered by every release and combine
 *  When one link is created by one user: 
 *  1, If the link does not exist, update the tile list of the selected tile and the combined tile;
 *  2, If the link already exists, push(append) the user to the supporter list(child) of the selected tile;
 *  When one link is broken by one user:
 *  1, Remove the user from the supporter list of the 2 tiles;
 *  2, If the user is the last one supporter, remove the link
 * 
 * logs:
 * ++ : add one supporter for the link
 * -- : reduce one supporter for the link
 * ++++ : new a link and the current user is the first supporter
 * ---- : remove a link because the current user is the last supporter
 * @param {*} sourceTileIndex the selected tile's index
 * @param {*} aroundTiles the array of the around tiles after release, whose length <= 4
 */
function updateLinks(sourceTileIndex, aroundTileIndexes) {
    // get the around tiles BEFORE release
    let sourceRef = firebase.database().ref('links/' + sourceTileIndex);
    // linked indexes before this release, whose length <= 4
    let sourceIndexString = sourceTileIndex.toString();
    let lastLinkedIndexes = new Array();
    sourceRef.once('value', snapshot => {
        snapshot.forEach(childSnapshot => {
            let targetIndex = childSnapshot.key;
            let targetData = childSnapshot.val();
            if (targetData.supporters[currentUName] === true) {
                if (!isNaN(targetIndex)) {
                    lastLinkedIndexes.push(targetIndex);
                }
            }
        });
    }).then(function () {
        for (let i of lastLinkedIndexes) {
            console.log(i);
        }
        sourceRef.once('value', snapshot => {
            // for every tile to be processed
            for (let targetTileIndex of aroundTileIndexes) {
                let targetIndexString = targetTileIndex.toString();
                if (snapshot.hasChild(targetIndexString)) {
                    // if it already exists
                    lastLinkedIndexes.removeByValue(targetIndexString);
                    // supported by others but not current user, so update the link
                    if (snapshot.child(targetIndexString).val().supporters[currentUName] != true) {
                        console.log('++' + sourceIndexString + '-' + targetIndexString);
                        let newSupNum = snapshot.child(targetIndexString).val().supNum + 1;
                        let updateLink = {};
                        updateLink['supNum'] = newSupNum;
                        updateLink['supporters/' + currentUName] = true;
                        sourceRef.child(targetIndexString).update(updateLink);
                    }
                } else {
                    console.log('++++' + sourceIndexString + '-' + targetIndexString);
                    // not yet supported by anyone, so new a link
                    sourceRef.child(targetIndexString).set({
                        target: targetTileIndex,
                        supNum: 1,
                        supporters: {
                            [currentUName]: true
                        }
                    });
                }
            }
        }).then(function () {
            // remove links that are not supported by the current user anymore
            sourceRef.once('value').then(snapshot => {
                for (let targetIndex of lastLinkedIndexes) {
                    let targetIndexString = targetIndex.toString();
                    let childRef = sourceRef.child(targetIndexString);
                    let newSupNum = snapshot.child(targetIndexString).val().supNum - 1;
                    if (newSupNum === 0) {
                        console.log('----' + sourceIndexString + '-' + targetIndexString);
                        childRef.remove();
                    } else {
                        console.log('--' + sourceIndexString + '-' + targetIndexString);
                        let updateLink = {};
                        updateLink['supNum'] = newSupNum;
                        childRef.update(updateLink);
                        childRef.child('supporters').child(currentUName).remove();
                    }

                    let targetRef = firebase.database().ref('links/' + targetIndexString);
                    targetRef.once('value').then(snapshot => {
                        let childRef = targetRef.child(sourceIndexString);
                        if (snapshot.child(sourceIndexString).val().supporters[currentUName] === true) {
                            let newSupNum = snapshot.child(sourceIndexString).val().supNum - 1;
                            if (newSupNum === 0) {
                                console.log('----' + targetIndexString + '-' + sourceIndexString);
                                childRef.remove();
                            } else {
                                console.log('--' + targetIndexString + '-' + sourceIndexString);
                                let updateLink = {};
                                updateLink['supNum'] = newSupNum;
                                childRef.update(updateLink);
                                childRef.child('supporters').child(currentUName).remove();
                            }
                        }
                    });
                }
            });
        });

        // update bidirectionally in the targets side
        for (let targetIndex of aroundTileIndexes) {
            let targetIndexString = targetIndex.toString();
            let targetRef = firebase.database().ref('links/' + targetIndexString);
            targetRef.once('value', snapshot => {
                if (snapshot.hasChild(sourceIndexString)) {
                    if (snapshot.child(sourceIndexString).val().supporters[currentUName] != true) {
                        console.log('++' + targetIndexString + '-' + sourceIndexString);
                        let newSupNum = snapshot.child(sourceIndexString).val().supNum + 1;
                        let updateLink = {};
                        updateLink['supNum'] = newSupNum;
                        updateLink['supporters/' + currentUName] = true;
                        targetRef.child(sourceIndexString).update(updateLink);
                    }
                } else {
                    console.log('++++' + targetIndexString + '-' + sourceIndexString);
                    targetRef.child(sourceIndexString).set({
                        target: sourceTileIndex,
                        supNum: 1,
                        supporters: {
                            [currentUName]: true
                        }
                    });
                }
            });
        }
    });

}


/**
 * Remove all supporting links if the use pick and release the tile in an empty place
 * remove bidirectionaly
 * @param {*} sourceTileIndex 
 * @param {*} aroundTileIndexes 
 */
function removeLinks(sourceTileIndex) {
    // get the around tiles BEFORE release
    let sourceRef = firebase.database().ref('links/' + sourceTileIndex);
    sourceRef.once('value').then(snapshot => {
        snapshot.forEach(childSnapshot => {
            let targetIndex = childSnapshot.key;
            let targetData = childSnapshot.val();
            if (targetData.supporters[currentUName] === true) {
                // if(Number.isInteger(targetIndex)){
                if (!isNaN(targetIndex)) {
                    // remove and upade the links around the current tile
                    sourceRef.once('value').then(snapshot => {
                        let childRef = sourceRef.child(targetIndex);
                        if (snapshot.child(targetIndex).val().supporters[currentUName] === true) { //to makes sure
                            let newSupNum = snapshot.child(targetIndex).val().supNum - 1;
                            if (newSupNum === 0) {
                                childRef.remove();
                            } else {
                                let updateLink = {};
                                updateLink['supNum'] = newSupNum;
                                childRef.update(updateLink);
                                childRef.child('supporters').child(currentUName).remove();
                            }
                        }
                    });
                    // also update the links from the current tile to the target tiles
                    let targetRef = firebase.database().ref('links/' + targetIndex);
                    targetRef.once('value').then(snapshot => {
                        let childRef = targetRef.child(sourceTileIndex);
                        if (snapshot.child(sourceTileIndex).val().supporters[currentUName] === true) {
                            let newSupNum = snapshot.child(sourceTileIndex).val().supNum - 1;
                            if (newSupNum === 0) {
                                childRef.remove();
                            } else {
                                let updateLink = {};
                                updateLink['supNum'] = newSupNum;
                                childRef.update(updateLink);
                                childRef.child('supporters').child(currentUName).remove();
                            }
                        }
                    });
                }
            }
        });
    });
}

/**
 * Recommend 1~4 tiles for the current user
 * @param {*} selectedTileIndex 
 * @param {*} n 
 */
function recommendTiles(selectedTileIndex, n, tiles) {
    let topTilesRef = firebase.database().ref('links/' + selectedTileIndex).orderByChild('supNum');// ascending order     
    let topNTilesRef = topTilesRef.limitToLast(n);
    let topNIndex = new Array();
    topNTilesRef.once('value').then(snapshot => {
        // console.log(snapshot.val());
        snapshot.forEach(childSnapshot => {
            if (!isNaN(childSnapshot.key)) {
                topNIndex.push(childSnapshot.key);
            }
        });
    }).then(function () {
        if (topNIndex.length > 0) {
            for (let i of topNIndex) {
                let tile = tiles[Number(i)];
                tile._style.strokeColor = "#FF0000";
                tile.scale(1.25);
                setTimeout(function () {
                    tile._style.strokeColor = "#FFF";
                    tile.scale(1 / 1.25);
                }, 3000);
            }
        } else {
            console.log('No recommendation.');
        }
    });
}


/**
 * Initialize the timer: reset and start it once the user signs in 
 * @param {*} timer 
 */
let hour, minute, second, t;
let timer = document.querySelector('#timer');
function initTimer() {
    timer.innerHTML = "00:00:00";
    hour = minute = second = 0;
    startIt();
}
function startIt() {
    second++;
    if (second >= 60) {
        second = 0;
        minute++;
    }
    if (minute >= 60) {
        minute = 0;
        hour++;
    }
    timer.innerHTML = judge(hour) + ":" + judge(minute) + ":" + judge(second);
    t = setTimeout("startIt()", 1000);
}
function judge(arg) {
    return arg >= 10 ? arg : "0" + arg;
}
/**
 *  Bind event handlers for the show_steps and show_time switch
 */
document.querySelector('#show_steps').addEventListener('click', function () {
    $('#steps_chip').fadeToggle('slow');
});
document.querySelector('#show_timer').addEventListener('click', function () {
    $('#timer_chip').fadeToggle('slow');
});

/**
 * Track the user state change
 * @param {*} user 
 */
function onAuthStateChanged(user) {
    if (user && currentUID === user.uid) {
        initTimer();
        // initialize the database which keeps the links
        // initDatabase(64);
        return;
    }
    // cleanUI();
    if (user) {
        // user is signed in
        currentUID = user.uid;
        currentUName = user.displayName || (user.email.toString().split('.')[0]);
        splashPage.style.display = 'none';
        let photoURL = user.photoURL || '../images/profile_placeholder.png';
        writeUserData(user.uid, user.displayName, user.email, photoURL);
        userName.textContent = currentUName;
        userPic.src=  ( user.photoURL || '../images/profile_placeholder.png');
        initTimer();
        // initialize the database which keeps the links
        // initDatabase(64);
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
        if (password.value.length < 3) {
            alert('请输入密码！');
            return;
        }

        firebase.auth().signInWithEmailAndPassword(email.value, password.value).catch(error => {
            if (error.code === 'auth/wrong-password') {
                alert('密码错误！');
            } else if (error.code == 'auth/user-not-found') {
                alert('用户不存在！');
            } else {
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
        } else {
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
    firebase.auth().createUserWithEmailAndPassword(email.value, password.value).catch(function (error) {
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
    }).then(function () {
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