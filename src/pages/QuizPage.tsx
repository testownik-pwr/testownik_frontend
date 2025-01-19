import React, {useState, useEffect, useCallback} from 'react';
import {Modal, Button, Toast, ToastContainer, Badge, Container, Card, Row, Col} from 'react-bootstrap';
import 'katex/dist/katex.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {useParams} from "react-router-dom";
import AppContext from "../AppContext.tsx";
import {Icon} from "@iconify/react";
import ReactPlayer from "react-player";
import {Question, Quiz} from "../components/quiz/types.ts";
import QuestionCard from "../components/quiz/QuestionCard.tsx";


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

    const [reoccurrences, setReoccurrences] = useState<{ id: number, reoccurrences: number }[]>([]);
    const [currentQuestionData, setCurrentQuestionData] = useState<Question | null>(null);
    const [loading, setLoading] = useState(true);

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [questionChecked, setQuestionChecked] = useState(false);
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
            setLoading(false);
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
            setCurrentQuestion(question);
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

    const handleKeyPress = (event: KeyboardEvent): void => {
        // Get the currently active element
        const activeElement = document.activeElement as HTMLElement;

        // If the event target is an input element (excluding checkboxes), return early
        if (event.target instanceof HTMLInputElement && event.target.type !== 'checkbox') return;

        // Get the pressed key in lowercase
        const key = event.key.toLowerCase();

        // Handle different key presses
        if (key === 's') {
            // If 's' is pressed, load the next question
            nextQuestion();
        } else if (key === 'enter') {
            // If 'enter' is pressed and the active element is not a button, handle the next button click
            if (activeElement.tagName.toLowerCase() === 'button') {
                return;
            }
            handleNextButtonClick();
        } else if (key >= '1' && key <= '9') {
            // If a number key (1-9) is pressed, click the corresponding checkbox
            const index = parseInt(key, 10) - 1;
            const checkboxes = document.querySelectorAll<HTMLInputElement>('input[name="answer"]');
            if (checkboxes[index]) {
                checkboxes[index].click();
            }
        } else if (key === 'c' && !event.ctrlKey) {
            // If 'c' is pressed without the control key, show the continuity button
            const continuityButton = document.getElementById('continuityButton');
            if (continuityButton) {
                continuityButton.classList.remove('d-none');
            }
        }
    };

    const resetProgress = async (): Promise<void> => {
        // Stop progress saving
        stopProgressSaving = true;

        // Remove progress and version from localStorage
        localStorage.removeItem(`${source}_progress`);
        localStorage.removeItem(`${source}_version`);

        // If user settings allow and user is authenticated, delete progress from the server
        if (userSettings.syncProgress && userAuthenticated) {
            await fetch(`${source}progress/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': csrfToken
                }
            });
        }
    };

    const handleNextButtonClick = (): void => {
        // Get the next button element
        const nextButton = document.getElementById('nextButton') as HTMLButtonElement;

        // Check the text content of the next button
        if (nextButton.textContent === 'Sprawdź') {
            // If the button text is 'Sprawdź', check the answer
            checkAnswer();
        } else {
            // Otherwise, load the next question
            nextQuestion();
        }
    };

    const handleCheckboxClick = (clickedCheckbox: HTMLInputElement, isMultiple: boolean, remote: boolean = false): void => {
        // If multiple selection is not allowed, uncheck all other checkboxes
        if (!isMultiple) {
            document.querySelectorAll<HTMLInputElement>('input[name="answer"]').forEach(checkbox => {
                if (checkbox !== clickedCheckbox) {
                    checkbox.checked = false;
                }
            });
        }

        // If the click is not remote, send the selected answer to all peers
        if (!remote) {
            sendToAllPeers({
                type: 'answer_selected',
                answer: clickedCheckbox.dataset.key
            });
        } else {
            // If the click is remote, toggle the checkbox state
            clickedCheckbox.checked = !clickedCheckbox.checked;
        }

        // Update the label color based on the checkbox state
        if (clickedCheckbox.labels && clickedCheckbox.labels[0]) {
            clickedCheckbox.labels[0].style.color = clickedCheckbox.checked ? 'var(--bs-light)' : 'var(--bs-body-color)';
        }
    };

    const checkAnswer = (remote: boolean = false): void => {
        // Get all selected checkboxes
        const selectedCheckboxes = document.querySelectorAll<HTMLInputElement>('input[name="answer"]:checked');
        // Get feedback, explanation, next button, and button container elements
        const feedback = document.getElementById('feedback') as HTMLElement;
        const explanation = document.getElementById('explanation') as HTMLElement;
        const nextButton = document.getElementById('nextButton') as HTMLButtonElement;
        const buttonContainer = document.getElementById('buttonContainer') as HTMLElement;

        let allCorrect = true;
        let hasSelectedCorrect = false;
        // Get correct answers from current question data
        const correctAnswers = currentQuestionData?.answers.filter(answer => answer.correct) || [];
        // Get selected answers' keys
        const selectedAnswers = Array.from(selectedCheckboxes).map(checkbox => checkbox.dataset.key);

        // Check if all correct answers are selected
        correctAnswers.forEach(answer => {
            if (!selectedAnswers.includes(answer.answer + (answer.image || ''))) {
                allCorrect = false;
            }
        });

        // Check each selected checkbox if it is correct or not
        selectedCheckboxes.forEach(selectedCheckbox => {
            const isCorrect = selectedCheckbox.value === 'true';
            if (isCorrect) {
                hasSelectedCorrect = true;
                selectedCheckbox.nextElementSibling?.classList.replace('btn-outline-secondary', 'btn-success');
            } else {
                allCorrect = false;
                selectedCheckbox.nextElementSibling?.classList.replace('btn-outline-secondary', 'btn-danger');
            }
        });

        // Update feedback and explanation based on the correctness of the answers
        if (allCorrect && hasSelectedCorrect) {
            feedback.textContent = 'Poprawna odpowiedź!';
            feedback.className = 'text-success';
            setCorrectAnswersCount(prev => prev + 1);
            const question = reoccurrences.find(q => q.id === currentQuestionData?.id);
            if (question) question.reoccurrences--;
        } else {
            feedback.innerHTML = selectedCheckboxes.length === 0 ? 'Brak odpowiedzi!' : 'Zła odpowiedź!';
            explanation.textContent = '';

            if (currentQuestionData?.explanation) {
                explanation.innerHTML = marked.parse(currentQuestionData.explanation.replaceAll('\\(', '\\\\(').replaceAll('\\)', '\\\\)').replaceAll('\\[', '\\\\[').replaceAll('\\]', '\\\\]'));
                renderMathInElement(explanation);
            }

            feedback.className = 'text-danger';
            // Highlight correct answers that were not selected
            buttonContainer.querySelectorAll<HTMLInputElement>('input[value="true"]').forEach(correctCheckbox => {
                correctCheckbox.nextElementSibling?.classList.replace('btn-outline-secondary', 'btn-success');
            });
            setWrongAnswersCount(prev => prev + 1);
            const question = reoccurrences.find(q => q.id === currentQuestionData?.id);
            if (question) question.reoccurrences += userSettings.wrongAnswerRepetitions;
        }

        // Update provided answers and mastered questions count
        document.getElementById('providedAnswers')!.textContent = (wrongAnswersCount + correctAnswersCount).toString();
        document.getElementById('masteredQuestions')!.textContent = reoccurrences.filter(q => q.reoccurrences === 0).length.toString();
        nextButton.textContent = 'Następne';
        saveProgress();
        // Send answer checked event to all peers if not remote
        if (!remote) {
            sendToAllPeers({
                type: 'answer_checked'
            });
        }
    };

    const nextQuestion = (): void => {
        // Get a random question ID
        const newQuestionId = getRandomQuestionId();
        if (newQuestionId) {
            // Load the question with the obtained ID
            loadQuestion(newQuestionId);
        } else {
            // Alert the user if all questions are mastered
            alert('Wszystkie pytania zostały opanowane, zresetuj postępy aby zacząć od nowa.');
        }
    };

    const copyToClipboard = (): void => {
        try {
            // Destructure question and answers from currentQuestionData
            const {question, answers} = currentQuestionData;

            // Format answers text
            const answersText = answers.map((answer, idx) => `Odpowiedź ${idx + 1}: ${answer.answer} (Poprawna: ${answer.correct ? 'Tak' : 'Nie'})`).join('\n');

            // Combine question and answers into a single text
            const fullText = `${question}\n\n${answersText}`;

            // Copy the text to the clipboard
            navigator.clipboard.writeText(fullText).then(() => {
                // Show success toast notification
                bootstrap.Toast.getOrCreateInstance(document.getElementById('copiedToast')).show();
            }).catch(err => {
                // Log error if copying fails
                console.error('Nie można skopiować tekstu: ', err);
            });
        } catch (error) {
            // Log error to console
            console.error('Błąd podczas kopiowania do schowka:', error);

            // Show error toast notification
            bootstrap.Toast.getOrCreateInstance(document.getElementById('errorToast')).show();
        }
    };

    const openInChatGPT = () => {
        try {
            // Destructure question and answers from currentQuestionData
            const {question, answers} = currentQuestionData;

            // Format answers text
            const answersText = answers.map((answer, idx) => `Odpowiedź ${idx + 1}: ${answer.answer} (Poprawna: ${answer.correct ? 'Tak' : 'Nie'})`).join('\n');

            // Combine question and answers into a single text
            const fullText = `Pytanie: ${question}\n\nOdpowiedzi:\n${answersText}`;

            // Create ChatGPT URL with encoded question and answers
            const chatGPTUrl = `https://chat.openai.com/?q=${encodeURIComponent(fullText)}`;

            // Open ChatGPT URL in a new tab
            window.open(chatGPTUrl, '_blank');
        } catch (error) {
            // Log error to console
            console.error('Error opening in ChatGPT:', error);

            // Show error toast notification
            bootstrap.Toast.getOrCreateInstance(document.getElementById('errorToast')).show();
        }
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

    const handlePeerClose = (conn: any): void => {
        // Function implementation
    };

    const getPeerId = (): string => {
        // Function implementation
    };

    const connectToPeer = (peerId: string): void => {
        // Function implementation
    };

    const updateStudyTime = (): void => {
        // Get the current time
        const currentTime = new Date();
        // Calculate the time difference in seconds
        const timeDiff = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
        // Update the study time state
        setStudyTime(timeDiff);

        // Calculate hours, minutes, and seconds
        const hours = String(Math.floor(timeDiff / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((timeDiff % 3600) / 60)).padStart(2, '0');
        const seconds = String(timeDiff % 60).padStart(2, '0');

        // Update the study time display in the UI
        const studyTimeElement = document.getElementById('studyTime');
        if (studyTimeElement) {
            studyTimeElement.textContent = `${hours}:${minutes}:${seconds}`;
        }

        // Save progress without showing a toast notification
        saveProgress(false);
    };

    const handleVersionUpdate = useCallback(() => {
        const storedVersion = localStorage.getItem(`${quizId}_version`);
        const localStorageVersion = storedVersion ? parseInt(storedVersion) : quiz?.version || 1;

        // If no version is stored, set the current quiz version in localStorage
        if (!storedVersion) {
            localStorage.setItem(`${quizId}_version`, quiz?.version.toString() || "1");
        }

        // If the quiz version has changed, show a toast notification and update localStorage
        if (quiz?.version !== localStorageVersion) {
            setShowToast(prev => ({ ...prev, updated: true }));
            localStorage.setItem(`${quizId}_version`, quiz?.version.toString() || "1");
        }
    }, [quiz, quizId]);

    const shuffleArray = useCallback((array: any[]) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }, []);

    const reportIncorrectQuestion = useCallback(() => {
        if (!currentQuestionData) return;
        const email = quiz?.report_email;
        if (!email) {
            alert("Brak adresu e-mail do zgłaszania błędów.");
            return;
        }
        // Prepare email subject and body with question details
        const subject = encodeURIComponent(`Testownik - zgłoszenie błędu`);
        const body = encodeURIComponent(
            `Pytanie nr ${currentQuestionData.id}:\n${currentQuestionData.question}\n\nOdpowiedzi:\n${currentQuestionData.answers
                .map(a => `${a.answer} (Poprawna: ${a.correct ? "Tak" : "Nie"})`)
                .join("\n")}\n\nUwagi:\n`
        );
        // Open the default mail client with the prepared email
        window.open(`mailto:${email}?subject=${subject}&body=${body}`);
    }, [currentQuestionData, quiz]);

    const pingPeers = useCallback(() => {
        peerConnections.forEach(conn => {
            if (conn.open) {
                conn.send({ type: "ping" });
                // Close connection if no response within 15 seconds
                setTimeout(() => {
                    if (!conn.open) {
                        console.warn("Ping timeout: closing connection.");
                        conn.close();
                    }
                }, 15000);
            }
        });
    }, [peerConnections]);

    const gracefullyClosePeerConnection = useCallback(() => {
        if (peer && !peer.destroyed) {
            peer.destroy();
        }
    }, [peer]);

    useEffect(() => {
        window.addEventListener("beforeunload", gracefullyClosePeerConnection);
        return () => {
            window.removeEventListener("beforeunload", gracefullyClosePeerConnection);
        };
    }, [gracefullyClosePeerConnection]);

    const getDeviceFriendlyName = useCallback(() => {
        const ua = navigator.userAgent;
        if (/iPad/.test(ua)) return "iPad";
        if (/iPhone/.test(ua)) return "iPhone";
        if (/Macintosh/.test(ua)) return "Mac";
        if (/Windows/.test(ua)) return "Windows PC";
        if (/Android/.test(ua)) return "Android";
        return "Unknown Device";
    }, []);

    const getDeviceType = useCallback(() => {
        const ua = navigator.userAgent;
        if (/iPad|Tablet/.test(ua)) return "tablet";
        if (/iPhone|Android/.test(ua)) return "mobile";
        return "desktop";
    }, []);

    const sendToPeer = useCallback((conn: any, data: any) => {
        if (conn.open) {
            conn.send(data);
        } else {
            console.error("Cannot send data: connection is closed.");
        }
    }, []);

    const sendToAllPeers = useCallback(
        (data: any) => {
            peerConnections.forEach(conn => sendToPeer(conn, data));
        },
        [peerConnections, sendToPeer]
    );

    const sendToAllPeersExcept = useCallback(
        (exceptConn: any, data: any) => {
            peerConnections.forEach(conn => {
                if (conn !== exceptConn) {
                    sendToPeer(conn, data);
                }
            });
        },
        [peerConnections, sendToPeer]
    );

    return (
        <Container style={{marginTop: 20}}>
            <Row>
                {loading ? (
                    <div className="text-center">Ładowanie...</div>
                ) : (
                    <>
                        <Col md={8}>
                            <TopButtonGroup/>
                            <QuestionCard question={currentQuestion} selectedAnswers={selectedAnswers}
                                          setSelectedAnswers={setSelectedAnswers} questionChecked={questionChecked}
                                          nextAction={nextQuestion}/>
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
                    </>
                )}
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