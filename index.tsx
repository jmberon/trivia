import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
import * as firebase from "firebase/app";
// Add the Firebase products that you want to use
// require("firebase/firestore");
import "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyBwsO6l-t4nVtGWZqAOwrIBkmsOCL51yQk",
    authDomain: "chowa-3d9ea.firebaseapp.com",
    databaseURL: "https://chowa-3d9ea.firebaseio.com",
    projectId: "chowa-3d9ea",
    storageBucket: "chowa-3d9ea.appspot.com",
    messagingSenderId: "242470526537",
    appId: "1:242470526537:web:29d5d7dd2df340701ba998",
    measurementId: "G-6X1SC97X0W"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const database = firebase.database();
var lastQuestionRef = firebase.database().ref('lastQuestion');

interface triviaQuestion {
    category: string,
    type: string,
    difficulty: string,
    question: string,
    correct_answer: string,
    incorrect_answers: string[],
    all_answers: string[]
}

const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

const TriviaApp = () => {

    const [q, setQuestion] = useState<triviaQuestion>();

    const getQuestion = () => {

        lastQuestionRef.remove();

        fetch("https://opentdb.com/api.php?amount=1&type=multiple", { method: "GET" })
            .then(data => data.json())
            .then(data => {
                if (!data.response_code && data.results.length) {
                    const trivia = data.results[0] as triviaQuestion;
                    let a = [...trivia.incorrect_answers, trivia.correct_answer];
                    shuffleArray(a)
                    trivia.all_answers = a;
                    console.log(trivia.correct_answer);
                    lastQuestionRef.push(trivia);
                }
            })
    }

    useEffect(() => {
        lastQuestionRef.on('value', function (snapshot) {
            const r: triviaQuestion[] = Object.values(snapshot.val());
            console.log(r);
            if (r && r.length) {
                setQuestion(r[0])
            }
        });
    }, [])

    let stars = "⭐";

    switch (q?.difficulty) {
        case "medium":
            stars = "⭐⭐"
            break;
        case "hard":
            stars = "⭐⭐⭐"
            break;
    }


    return <>
        <p>Category: {q?.category}</p>
        <p>Difficulty: {stars}</p>
        <h1 dangerouslySetInnerHTML={{ __html: q?.question || "" }}></h1>
        < ol >
            {q?.all_answers.map((a, id) => <li key={id}>{a}</li>)}
        </ol>
        <button onClick={getQuestion} type="button">Get New Question</button>
    </>
}

ReactDOM.render(<TriviaApp />, document.getElementById('app'))