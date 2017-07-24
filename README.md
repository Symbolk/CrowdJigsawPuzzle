# Crowd Jigsaw Puzzle

---

**Crowd Jigsaw Puzzle is an online game, on which multiple players work together to figure out a complex jigsaw puzzle.**
**Designed to be an social experiment on Crowd Wisdom/Collective Intelligence**

_Powered By [@Symbolk](http://www.symbolk.com)_

## Overview

Language : 

> [Javascript/Paperscript/Html5/CSS3]

Based on :

> [Firebase](http://www.firebase.google.com/ "Firebase offical site") 
> [paper.js](http://www.paperjs.org/ "Paper.js offical site") 

Requirements :

> Chrome Browser

> Node.js and npm

> Firebase CLI
 
---
## Game Rules:

1, One puzzle is played by multiple players online, who cowork together in this way : every time when a player selects one tile, 4 tiles are highlighted and magnified. which are considered to be combined with the selected one,  according to the crowd's opinio.

2, 2 indicators are placed at the left-bottom corner of the puzzle page---the steps and the time. When a user signs in, the timer starts; Every pick and combine is counted as one step. They can be hidden if you want.

## Play it Online!

1, Visit https://crowdjigsawpuzzle.firebaseapp.com (Only For Test, Better Run Locally)


2, Register an account with Email address and passwword; If you want to manage your account, you must verify your email.

![SignIn](https://github.com/Symbolk/CrowdJigsawPuzzle/blob/master/screenshots/signin.jpg)

3, Click "Start Game" to play with a puzzle.

![Puzzle](https://github.com/Symbolk/CrowdJigsawPuzzle/blob/master/screenshots/puzzle.jpg)


## Run it Locally!

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
        * main.js
        * dialog-polyfill.js
        * jquery-1.7.2.min.js
        * paper.js
    * styles
        * main.css
        * puzzle.css
    * index.html
        
