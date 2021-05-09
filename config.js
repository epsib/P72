import * as firebase from 'firebase';
require('@firebase/firestore');

var firebaseConfig = {
    apiKey: "AIzaSyCpWdozQNUB3uiJ7JFxALyaHQ9W8-NVcvc",
    authDomain: "class-71-94e9e.firebaseapp.com",
    projectId: "class-71-94e9e",
    storageBucket: "class-71-94e9e.appspot.com",
    messagingSenderId: "931942609924",
    appId: "1:931942609924:web:14de66bee5133a9d6df151"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

export default firebase.firestore();