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

enum TRIVIASTATUS {
    NEW,
    OPENPOLLS,
    CLOSEDPOLLS,
    ANSWERREVEALED,
    CONCLUDED
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
    const [selectedAnswerId, setSelectedAnswerId] = useState<number | undefined>();
    const [timer, setTimer] = useState(5)
    const [triviaStatus, setTriviaStatus] = useState<TRIVIASTATUS>(TRIVIASTATUS.NEW)

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
                    lastQuestionRef.push(trivia);
                }
            })
    }

    const openPolls = () => {
        setTriviaStatus(TRIVIASTATUS.OPENPOLLS)

        const interval = setInterval(() => {
            if (timer > 0) {
                setTimer(--timer)
            } else {
                setTriviaStatus(TRIVIASTATUS.ANSWERREVEALED);
                clearInterval(interval);
                // console.log(interval);
            }
        }, 1000)
    }

    const onClickAnswer = (e: React.MouseEvent<HTMLElement>, a: string, id: number) => {
        setSelectedAnswerId(id)

        if (a === q?.correct_answer) {
            console.log("Yayyy");
        }
    }

    useEffect(() => {
        lastQuestionRef.on('value', function (snapshot) {
            if (!snapshot.val()) { return; }
            const r: triviaQuestion[] = Object.values(snapshot.val());
            if (r && r.length) {
                setQuestion(r[0])
                setTimer(5)
                setTriviaStatus(TRIVIASTATUS.NEW)
            }
        });
    }, [])

    useEffect(() => {


    }, [triviaStatus])

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
        <h2 dangerouslySetInnerHTML={{ __html: q?.category || "" }}></h2>
        <div className="difficulty">
            <span>Reward: </span>
            <h2 className="stars">{stars}</h2>
        </div>
        <span>{timer > 0 ? `Remaining ${timer}` : `Time's up!`}</span>
        <h1 dangerouslySetInnerHTML={{ __html: q?.question || "" }}></h1>

        <div className="answer-list">
            {q?.all_answers.map((a, id) => <button onClick={(e) => onClickAnswer(e, a, id)} className={`answer ${id === selectedAnswerId && "answer--selected"}`} key={id}>
                <b>{`${['A', 'B', 'C', 'D'][id]}. `}</b>
                <span dangerouslySetInnerHTML={{ __html: a }}></span>
            </button>)}
        </div>
        {triviaStatus === TRIVIASTATUS.ANSWERREVEALED && <h2>Answer: {['A', 'B', 'C', 'D'][q?.all_answers.indexOf(q?.correct_answer || " ") || 5]}. {q?.correct_answer}</h2>}
        <button onClick={getQuestion} type="button">Get New Question</button>
        <button onClick={openPolls} type="button">Open Polls</button>
    </>
}

ReactDOM.render(<TriviaApp />, document.getElementById('app'))