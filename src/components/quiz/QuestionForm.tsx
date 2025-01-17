import React, {useContext} from 'react';
import {Button, Form, Row, Col} from 'react-bootstrap';
import {Answer, Question} from "./types.ts";
import AppContext from "../../AppContext.tsx";

type Props = {
    question: Question;
    onUpdate: (updatedQuestion: Question) => void;
    onRemove: (id: number) => void;
};

const QuestionForm: React.FC<Props> = ({question, onUpdate, onRemove}) => {
    const appContext = useContext(AppContext);

    const handleTextChange = (text: string) => {
        onUpdate({...question, question: text});
    };

    const addAnswer = () => {
        const newAnswer = {answer: '', correct: false};
        onUpdate({...question, answers: [...question.answers, newAnswer]});
    };

    const updateAnswer = (index: number, updatedAnswer: Answer) => {
        const updatedAnswers = question.answers.map((a, i) =>
            i === index ? updatedAnswer : a
        );
        onUpdate({...question, answers: updatedAnswers});
    };

    const removeAnswer = (index: number) => {
        const updatedAnswers = question.answers.filter((_, i) => i !== index);
        onUpdate({...question, answers: updatedAnswers});
    };

    return (
        <div className="border rounded p-3 mb-3" id={`question-${question.id}`}>
            <Form.Group className="mb-3">
                <Form.Label>Pytanie {question.id}</Form.Label>
                <Form.Control
                    type="text"
                    placeholder="Podaj treść pytania"
                    value={question.question}
                    onChange={(e) => handleTextChange(e.target.value)}
                />
            </Form.Group>
            <h6>Odpowiedzi</h6>
            {question.answers.map((answer, index) => (
                <Row key={index} className="align-items-center mb-2">
                    <Col>
                        <Form.Control
                            type="text"
                            placeholder="Treść odpowiedzi"
                            value={answer.answer}
                            onChange={(e) =>
                                updateAnswer(index, {
                                    ...answer,
                                    answer: e.target.value,
                                })
                            }
                        />
                    </Col>
                    <Col xs="auto">
                        <Form.Check
                            type="checkbox"
                            checked={answer.correct}
                            onChange={(e) =>
                                updateAnswer(index, {
                                    ...answer,
                                    correct: e.target.checked,
                                })
                            }
                        />
                    </Col>
                    <Col xs="auto">
                        <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeAnswer(index)}
                        >
                            Usuń
                        </Button>
                    </Col>
                </Row>
            ))}
            <div className="d-flex gap-2">
                <Button variant={`outline-${appContext.theme.getOppositeTheme()}`} size="sm" onClick={addAnswer}>
                    Dodaj odpowiedź
                </Button>
                <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onRemove(question.id)}
                >
                    Usuń pytanie
                </Button>
            </div>
        </div>
    );
};

export default QuestionForm;