import React, {useContext, useState} from 'react';
import {Button, Card, Form, Alert} from 'react-bootstrap';
import QuestionForm from '../components/quiz/QuestionForm';
import {Question, Quiz} from "../components/quiz/types.ts";
import AppContext from "../AppContext.tsx";
import QuizPreviewModal from "../components/quiz/QuizPreviewModal.tsx";
import {useNavigate} from "react-router-dom";


const CreateQuizPage: React.FC = () => {
    const appContext = useContext(AppContext);
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState<Question[]>([{
        id: 1,
        question: '',
        multiple: true,
        answers: [{answer: '', correct: false}, {answer: '', correct: false}]
    }]);
    const [error, setError] = useState<string | null>(null);
    const [quiz, setQuiz] = useState<Quiz | null>(null); // Result of the quiz creation

    document.title = "Stwórz bazę - Testownik";

    const addQuestion = () => {
        setQuestions((prev) => [
            ...prev,
            {
                id: prev.length + 1,
                question: '',
                multiple: true,
                answers: [{answer: '', correct: false}, {answer: '', correct: false}]
            },
        ]);
    };

    const updateQuestion = (updatedQuestion: Question) => {
        setQuestions((prev) =>
            prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q))
        );
    };

    const removeQuestion = (id: number) => {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            setError('Podaj tytuł bazy.');
            return;
        }

        if (questions.length === 0) {
            setError('Dodaj przynajmniej jedno pytanie.');
            return;
        }

        if (questions.some((q) => !q.question.trim())) {
            setError('Wszystkie pytania muszą mieć treść.');
            return;
        }

        if (questions.some((q) => q.answers.length < 1)) {
            setError('Wszystkie pytania muszą mieć przynajmniej jedną odpowiedź.');
            return;
        }

        if (questions.some((q) => q.answers.filter((a) => a.correct).length === 0)) {
            setError('Wszystkie pytania muszą mieć przynajmniej jedną prawidłową odpowiedź.');
            return;
        }

        setError(null);

        try {
            const response = await appContext.axiosInstance.post('/quizzes/', {
                title,
                description,
                questions,
            });

            if (response.status === 201) {
                const result = await response.data;
                setQuiz(result);
            } else {
                const errorData = await response.data;
                setError(errorData.error || 'Wystąpił błąd podczas importowania quizu.');
            }
        } catch {
            setError('Wystąpił błąd podczas importowania quizu.');
        }
    };

    return (
        <>
            <Card className="border-0 shadow p-4">
                <h1 className="h5">Stwórz nową bazę</h1>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Tytuł</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Podaj tytuł bazy"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Opis</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Podaj opis bazy"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </Form.Group>

                    <h2 className="h6 mt-4">Pytania</h2>
                    {questions.map((question) => (
                        <QuestionForm
                            key={question.id}
                            question={question}
                            onUpdate={updateQuestion}
                            onRemove={removeQuestion}
                        />
                    ))}
                    <Button variant={`outline-${appContext.theme.getOppositeTheme()}`} onClick={addQuestion}
                            className="mt-3">
                        Dodaj pytanie
                    </Button>
                    <div className="text-center mt-4">
                        <Button onClick={handleSubmit} variant={appContext.theme.getOppositeTheme()}>
                            Stwórz bazę
                        </Button>
                    </div>
                </Form>
            </Card>
            <QuizPreviewModal show={quiz !== null} onHide={() => navigate("/")} quiz={quiz} type="created"/>
        </>
    );
};

export default CreateQuizPage;