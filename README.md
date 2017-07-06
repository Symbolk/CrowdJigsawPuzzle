# Crowd Jigsaw Puzzle

---

**Crowd Jigsaw Puzzle is an online game, on which multiple players work together to figure out a complex jigsaw puzzle.**

_Powered By [@Symbolk](http://www.symbolk.com)_

## Overview

> Language : 

> [Javascript(ES5)/Paperscript/Html5/CSS3]

> Based on :

> [Firebase](http://www.firebase.google.com/ "Firebase offical site") 
> [paper.js](http://www.paperjs.org/ "Paper.js offical site") 

> Requirements :

> Chrome Browser

> Node.js and npm

> Firebase CLI
 
---

## Play it online!

1, Visit https://www.crowdjigsawpuzzle.firebaseio.com (Only For Test, Better Run Locally)


2, Register an account with Email address and passwword; If you want to manage your account, you must verify your email.

![SignIn](https://github.com/Symbolk/CrowdJigsawPuzzle/blob/master/screenshots/sigin.jpg)

3, Click "Start Game" to play with a puzzle.

![Puzzle](https://github.com/Symbolk/CrowdJigsawPuzzle/blob/master/screenshots/puzzle.jpg)


## Run it locally!

1, Before you run it, install and config Firebase first, just run the following commands in shell(Linux) or terminal(macOS) or cmd(Windows):

```sh
npm install --save firebase
npm install -g firebase-tools 
```
2, Go to [Firebase](http://www.firebase.google.com/ "Firebase offical site") and login with your Google account, then login with:

```sh
firebase login
```
3, Create a web app in your Firebase console, and enable Email/Password login:

![Enable](https://github.com/Symbolk/CrowdJigsawPuzzle/blob/master/screenshots/enable.png) 

4, Config your app : switch to Console/Overview, copy the code inside <script></script> to scripts/config.js(remember to rename config_template.js):

![Config](https://github.com/Symbolk/CrowdJigsawPuzzle/blob/master/screenshots/config.png)

5, Link the app to Firebase:
```sh
firebase use --add
# choose your app created in 3
# and assign an alias for it
```

6, Run a local server to test:

```sh
firebase serve
```

7, Visit http://localhost:5000 then you got it!


## Project Structure:

- CrowdJigsawPuzzle
    * images
    * screenshots
    * scripts
        * config.js
        * jigsaw.js
        * jquery-1.7.2.min.js
        * paper.js
    * styles
        * main.css
        * puzzle.css
    * index.html
    * puzzle.html
        