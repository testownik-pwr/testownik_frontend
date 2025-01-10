import React, {useState, useEffect, useContext} from "react";
import { Card, Button } from "react-bootstrap";
import AppContext from "../../AppContext.tsx";


interface Answer {
    answer: string;
    correct: boolean;
}

interface Question {
    id: number;
    question: string;
    quiz_title: string;
    quiz_id: number;
    answers: Answer[];
}

const QuestionQuizCard: React.FC = () => {
    const appContext = useContext(AppContext);
    const [questionData, setQuestionData] = useState<Question | null>(null);
    const [enableEdit, setEnableEdit] = useState<boolean>(false);
    const [result, setResult] = useState<string | null>(null);

    useEffect(() => {
        fetchQuestion();
    }, []);

    const fetchQuestion = async () => {
        try {
            const response = await appContext.axiosInstance.get("/random-question/");
            if (!response.data) {
                setQuestionData(null);
                throw new Error("No questions available");
            }
            const data: Question = response.data;
            setQuestionData(data);
            setEnableEdit(true);
            setResult(null);
        } catch {
            setQuestionData(null);
        }
    };

    const checkAnswers = () => {
        if (!questionData) return;

        const answers = document.querySelectorAll<HTMLButtonElement>(".answer");
        let isCorrect = true;

        answers.forEach((answer) => {
            const isSelected = answer.classList.contains("active");
            const isCorrectAnswer = answer.dataset.correct === "true";

            if (isSelected && !isCorrectAnswer) {
                isCorrect = false;
                answer.classList.add("btn-danger");
            } else if (!isSelected && isCorrectAnswer) {
                isCorrect = false;
                answer.classList.add("btn-success", "opacity-50");
            } else if (isSelected && isCorrectAnswer) {
                answer.classList.add("btn-success");
            }

            answer.classList.remove("active");
        });

        setResult(isCorrect ? "Poprawna odpowiedź!" : "Niepoprawna odpowiedź.");
        setEnableEdit(false);
    };

    return (
        <Card className="border-0 shadow h-100">
            <Card.Body>
                {questionData ? (
                    <div>
                        <small className="text-muted">Powtórz to jeszcze raz:</small>
                        <h5 className="card-title mb-0 text-secondary">{questionData.question}</h5>
                        <a href={`/quizzes/${questionData.quiz_id}/`} className="small text-secondary">
                            {questionData.quiz_title}
                        </a>
                        <div className="d-grid gap-2 mt-3">
                            {questionData.answers.map((answer, idx) => (
                                <Button
                                    key={idx}
                                    className={`btn btn-${appContext.theme.getTheme()} btn-sm w-100 answer`}
                                    data-correct={answer.correct}
                                    onClick={(e) => {
                                        if (!enableEdit) return;
                                        e.currentTarget.classList.toggle("active");
                                    }}
                                >
                                    {answer.answer}
                                </Button>
                            ))}
                        </div>
                        {result && (
                            <h5 className={`card-title mt-3 text-${result.includes("Poprawna") ? "success" : "danger"}`}>
                                {result}
                            </h5>
                        )}
                        <div className="d-flex justify-content-end mt-2">
                            <Button className="btn btn-outline-secondary btn-sm" onClick={checkAnswers} disabled={!enableEdit}>
                                Sprawdź odpowiedź
                            </Button>
                            <Button
                                className="btn btn-outline-secondary btn-sm ms-2"
                                onClick={fetchQuestion}
                                disabled={enableEdit}
                            >
                                Następne pytanie
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h5 className="card-title">Nie ma żadnych pytań do powtórzenia.</h5>
                        <p className="small text-muted">Po użyciu twojej pierwszej bazy pojawią się tutaj pytania.</p>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default QuestionQuizCard;