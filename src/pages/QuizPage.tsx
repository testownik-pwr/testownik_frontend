import React, {useState, useEffect, useCallback} from 'react';
import {Modal, Button, Toast, ToastContainer, Badge, Container, Card, Row, Col} from 'react-bootstrap';
import 'katex/dist/katex.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {useParams} from "react-router-dom";
import AppContext from "../AppContext.tsx";
import {Icon} from "@iconify/react";
import ReactPlayer from "react-player";
import {Quiz} from "../components/quiz/types.ts";


const TopButtonGroup: React.FC = () => (
    <div className="d-flex justify-content-end mt-2">
        <div className="btn-group btn-group-sm top-button-group" role="group">
            <Button variant="outline-light" className="top-button" id="chatGPTButton">
                <Icon icon="simple-icons:openai"/>
            </Button>
            <Button variant="outline-light" className="top-button" id="clipboardButton">
                <Icon icon="solar:clipboard-bold"/>
            </Button>
        </div>
    </div>
);

const QuestionCard: React.FC = () => (
    <Card className="border-0 shadow">
        <Card.Body>
            <p id="questionText" style={{whiteSpace: 'pre-line'}}></p>
            <div id="questionImage" className="mt-3"></div>
            <div id="buttonContainer" className="button-container"></div>
            <div id="feedback" className="mt-3"></div>
            <div className="bottom-buttons">
                <Button variant="primary" id="nextButton">
                    Sprawdź
                </Button>
            </div>
            <div id="explanation" className="mt-3"></div>
        </Card.Body>
    </Card>
);

const QuizCard: React.FC = () => (
    <Card className="border-0 shadow">
        <Card.Body>
            <Stats/>
            <div className="text-end mt-3">
                <Button variant="danger" size="sm" id="reportButton" style={{display: 'none'}}>
                    <Icon icon="bi:exclamation-triangle-fill"/>
                </Button>
                <Button variant="secondary" size="sm" id="resetButton">
                    Reset
                </Button>
            </div>
        </Card.Body>
    </Card>
);

const Stats: React.FC = () => (
    <div className="stats">
        <div className="stat-item">
            <span>Udzielone odpowiedzi</span>
            <span className="text-success" id="providedAnswers">0</span>
        </div>
        <div className="stat-item">
            <span>Opanowane pytania</span>
            <span className="text-secondary" id="masteredQuestions">0</span>
        </div>
        <div className="stat-item">
            <span>Liczba pytań</span>
            <span className="text-success" id="totalQuestions">0</span>
        </div>
        <div className="stat-item">
            <span>Czas nauki</span>
            <span className="text-success" id="studyTime">00:00:00</span>
        </div>
    </div>
);

const ContinuityModal: React.FC = () => (
    <Modal id="continuityModal" aria-labelledby="continuityModalLabel">
        <Modal.Header closeButton>
            <Modal.Title id="continuityModalLabel">Continuity</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <div id="continuityNotConnectedDiv">
                <p>Aby połączyć się z innym urządzeniem, zaloguj się na obu urządzeniach i otwórz ten quiz</p>
            </div>
            <div id="continuityConnectedDiv" className="d-none">
                <p>Połączono z <span id="continuityConnectedName"></span></p>
                <div className="d-flex justify-content-center">
                    {/*<dotlottie-player*/}
                    {/*    src="https://lottie.host/25909953-1714-4638-921c-a7b94593bae2/k3okRjUxg9.json"*/}
                    {/*    background="transparent"*/}
                    {/*    speed="1"*/}
                    {/*    style={{ width: 300, height: 300 }}*/}
                    {/*    loop*/}
                    {/*    autoplay*/}
                    {/*/>*/}
                </div>
                <div className="text-center mt-3">
                    Te urządzenia są połączone i synchronizują swój postęp na żywo. Możesz połączyć się z więcej niż
                    jednym urządzeniem.
                </div>
            </div>
        </Modal.Body>
        <Modal.Footer>
            <svg width="32" height="32" viewBox="0 0 32 32" className="circular-progress d-none"
                 id="continuityModalProgress">
                <circle className="bg"></circle>
                <circle className="fg"></circle>
            </svg>
            <Button variant="secondary" data-bs-dismiss="modal">Zamknij</Button>
        </Modal.Footer>
    </Modal>
);

const ToastNotifications: React.FC = () => (
    <ToastContainer className="position-fixed bottom-0 end-0 p-3">
        <Toast id="copiedToast" data-bs-delay="4000">
            <Toast.Header>
                <Icon icon="solar:clipboard-bold" className="me-2"/>
                <strong className="me-auto">Skopiowano</strong>
                <small>Teraz</small>
            </Toast.Header>
            <Toast.Body>Skopiowano pytanie do schowka</Toast.Body>
        </Toast>
        {/* Add other Toast notifications here */}
    </ToastContainer>
);


const QuizPage: React.FC = () => {
    const {quizId} = useParams<{ quizId: string }>();
    const appContext = React.useContext(AppContext);

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [reoccurrences, setReoccurrences] = useState([]);
    const [currentQuestionId, setCurrentQuestionId] = useState(null);
    const [currentQuestionData, setCurrentQuestionData] = useState(null);
    const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
    const [wrongAnswersCount, setWrongAnswersCount] = useState(0);
    const [isQuizFinished, setIsQuizFinished] = useState(false);
    const [startTime, setStartTime] = useState(new Date());
    const [studyTime, setStudyTime] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [showToast, setShowToast] = useState({
        copied: false,
        error: false,
        continuityDisconnected: false,
        continuityConnected: false
    });
    const [peer, setPeer] = useState(null);
    const [peerConnections, setPeerConnections] = useState([]);
    const [isContinuityHost, setIsContinuityHost] = useState(false);

    //html,
    useEffect(() => {
        // Load progress and fetch questions
        fetchQuiz()
        loadProgress();
        // Set up event listeners
        document.addEventListener('keydown', handleKeyPress);
        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, []);

    useEffect(() => {
        if (quiz !== null) {
            loadQuestion(1);
        }
    }, [quiz]);

    const fetchQuiz = async () => {
        const response = await appContext.axiosInstance.get(`/quizzes/${quizId}/`);
        if (response.status === 200) {
            const data: Quiz = response.data;
            setQuiz(data)
        } else {
            console.error("Nie udało się załadować quizu.");
        }
    };

    // Load a specific question
    const loadQuestion = useCallback(
        (id: number) => {
            if (quiz === null){
                console.error("Quiz not loaded.");
                return;
            }
            const question = quiz.questions.find((q) => q.id === id);
            if (!question) {
                alert('Nie znaleziono pytania o podanym identyfikatorze.');
                return;
            }
            // Populate UI with question details
            const questionText = document.getElementById('questionText');
            const buttonContainer = document.getElementById('buttonContainer');

            if (questionText) questionText.textContent = `${question.id}. ${question.question}`;
            if (buttonContainer) {
                buttonContainer.innerHTML = '';
                question.answers.forEach((answer, idx) => {
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'btn-check';
                    checkbox.id = `btn-check-${idx}`;
                    checkbox.name = 'answer';
                    checkbox.value = String(answer.correct);
                    checkbox.dataset.key = answer.answer;

                    const label = document.createElement('label');
                    label.className = 'btn btn-outline-secondary btn-block';
                    label.htmlFor = `btn-check-${idx}`;
                    label.textContent = answer.answer;

                    buttonContainer.appendChild(checkbox);
                    buttonContainer.appendChild(label);
                });
            }
        },
        [quiz]
    );

    // Get a random question ID
    const getRandomQuestionId = useCallback(() => {
        const availableQuestions = reoccurrences.filter((r) => r.reoccurrences > 0);
        if (availableQuestions.length === 0) {
            setIsQuizFinished(true);
            return null;
        }
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        return availableQuestions[randomIndex].id;
    }, [reoccurrences]);


    const loadProgress = async () => {
        // Load progress logic
    };

    const handleKeyPress = (event) => {
        // Handle key press logic
    };

    const handleNextButtonClick = () => {
        // Handle next button click logic
    };

    const checkAnswer = () => {
        // Check answer logic
    };

    const nextQuestion = () => {
        // Load next question logic
    };

    const copyToClipboard = () => {
        // Copy to clipboard logic
    };

    const openInChatGPT = () => {
        // Open in ChatGPT logic
    };

    const initiateContinuity = () => {
        // Initiate continuity logic
    };

    const handlePeerConnection = (conn) => {
        // Handle peer connection logic
    };

    const handlePeerData = (conn, data) => {
        // Handle peer data logic
    };

    const updateContinuityModal = () => {
        // Update continuity modal logic
    };

    return (
        <Container style={{marginTop: 20}}>
            <Row>
                <Col md={8}>
                    <TopButtonGroup/>
                    <QuestionCard/>
                </Col>
                <Col md={4}>
                    <QuizCard/>
                    <ReactPlayer url='https://www.youtube.com/watch?v=zZ7AimPACzc'
                                 playing={true}
                                 muted={true}
                                 loop={true}
                                 width="100%"
                                 height="40rem"
                    />
                </Col>
            </Row>
            <ContinuityModal/>
            <ToastNotifications/>
            <div className="position-fixed bottom-0 end-0 m-3" id="bottomButtons">
                <Button
                    className="shadow-lg bg-body-tertiary d-none"
                    id="continuityButton"
                    data-bs-toggle="modal"
                    data-bs-target="#continuityModal"
                >
                    <Icon icon="flat-color-icons:multiple-devices" id="continuityIcon"/>
                    <Badge bg="warning" className="position-absolute p-1 translate-middle d-none"
                           style={{top: '10%', left: '90%'}} id="continuityHostBadge">
                        <Icon className="d-block" icon="mdi:crown"/>
                    </Badge>
                </Button>
            </div>
        </Container>
    );
}

export default QuizPage;