import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
import * as firebase from "firebase/app";
// Add the Firebase products that you want to use
// require("firebase/firestore");
import "firebase/auth";
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
const lastQuestionRef = firebase.database().ref('lastQuestion');
const questionsRef = firebase.database().ref('questions');

interface ITriviaQuestion {
    category: string,
    type: string,
    difficulty: string,
    question: string,
    correct_answer: string,
    incorrect_answers: string[],
    all_answers: string[]
}
interface IUser {
    uid: string,
    displayName: string,
    photoURL: string,
    email: string
}
enum TRIVIASTATUS {
    NEW,
    OPENPOLLS,
    CLOSEDPOLLS,
    ANSWERREVEALED,
    CONCLUDED
}

enum DIFFICULTY {
    EASY = "easy",
    MEDIUM = "medium",
    HARD = "hard"
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

    const [triviaQuestion, setTriviaQuestion] = useState<ITriviaQuestion>();
    const [selectedAnswer, setSelectedAnswer] = useState<{ answer?: string, id?: number } | null>();
    const [timer, setTimer] = useState(5)
    const [triviaStatus, setTriviaStatus] = useState<TRIVIASTATUS>(TRIVIASTATUS.NEW)
    const [user, setUser] = useState<IUser | null>()

    const getQuestion = () => {

        lastQuestionRef.remove();

        fetch("https://opentdb.com/api.php?amount=1&type=multiple", { method: "GET" })
            .then(data => data.json())
            .then(data => {
                if (!data.response_code && data.results.length) {
                    const trivia = data.results[0] as ITriviaQuestion;
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
        setSelectedAnswer({ answer: a, id })
    }

    const onSocialLogin = () => {

        let provider = new firebase.auth.GoogleAuthProvider();

        firebase.auth().signInWithPopup(provider).then(function (result) {
            if (result.user) {
                localStorage.setItem("triviaUser", JSON.stringify(result.user));
                setUser(result.user as IUser)
            };
        }).catch(function (error) { console.log(error) });
    }

    // useEffect(() => {

    // })

    useEffect(() => {
        // Handle User
        const u = localStorage.getItem("triviaUser");
        if (u) { setUser(JSON.parse(u) as IUser) }
    }, [])

    useEffect(() => {
        // Subscribe to last question changes
        lastQuestionRef.on('value', function (snapshot) {
            if (!snapshot.val()) { return; }
            const r: ITriviaQuestion[] = Object.values(snapshot.val());
            if (r && r.length) {
                setTriviaQuestion(r[0]);
                setTimer(5);
                setTriviaStatus(TRIVIASTATUS.NEW);
                setSelectedAnswer(null)
            }
        });
    }, [])

    useEffect(() => {

        if (triviaStatus === TRIVIASTATUS.ANSWERREVEALED) {
            let score = 0;

            if (selectedAnswer?.answer === triviaQuestion?.correct_answer) {
                switch (triviaQuestion?.difficulty) {
                    case DIFFICULTY.EASY:
                        score = 1;
                        break;
                    case DIFFICULTY.MEDIUM:
                        score = 2;
                        break;
                    case DIFFICULTY.HARD:
                        score = 3;
                        break;
                }
            }

            const fbQuestion = {
                question: triviaQuestion?.question,
                answer: triviaQuestion?.correct_answer,
                userId: user?.uid,
                userName: user?.displayName,
                score
            }

            questionsRef.push(fbQuestion);
        }

    }, [triviaStatus])

    let stars = "⭐";

    switch (triviaQuestion?.difficulty) {
        case DIFFICULTY.MEDIUM:
            stars = "⭐⭐"
            break;
        case DIFFICULTY.HARD:
            stars = "⭐⭐⭐"
            break;
    }

    return <>
        <header>
            <nav>
                <h1>Trivia</h1>
                {!user && <button type="button" onClick={onSocialLogin}>Log In</button>}
                {user && <img src={user.photoURL} alt={user.displayName} />}
            </nav>
        </header>
        <main>
            <h2 dangerouslySetInnerHTML={{ __html: triviaQuestion?.category || "" }}></h2>
            <div className="difficulty">
                <span>Reward: </span>
                <h2 className="stars">{stars}</h2>
            </div>
            <span>{timer > 0 ? `Remaining ${timer}` : `Time's up!`}</span>
            <h1 dangerouslySetInnerHTML={{ __html: triviaQuestion?.question || "" }}></h1>

            <div className="answer-list">
                {triviaQuestion?.all_answers.map((a, id) => <button onClick={(e) => onClickAnswer(e, a, id)} className={`answer ${id === selectedAnswer?.id && "answer--selected"}`} key={id}>
                    <b>{`${['A', 'B', 'C', 'D'][id]}. `}</b>
                    <span dangerouslySetInnerHTML={{ __html: a }}></span>
                </button>)}
            </div>
            {triviaStatus === TRIVIASTATUS.ANSWERREVEALED && <h2>Answer: {['A', 'B', 'C', 'D'][triviaQuestion?.all_answers.indexOf(triviaQuestion?.correct_answer || " ") || 5]}. {triviaQuestion?.correct_answer}</h2>}
            <button onClick={getQuestion} type="button">Get New Question</button>
            <button onClick={openPolls} type="button">Open Polls</button>
        </main>
    </>
}

ReactDOM.render(<TriviaApp />, document.getElementById('app'))