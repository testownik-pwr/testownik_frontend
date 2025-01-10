import React, { useEffect, useState } from "react";
import { Card, Table } from "react-bootstrap";

interface Quiz {
    id: number;
    title: string;
}

const LastUsedCard: React.FC = () => {
    const [lastUsedQuizzes, setLastUsedQuizzes] = useState<Quiz[]>([]);

    useEffect(() => {
        fetchLastUsedQuizzes();
    }, []);

    const fetchLastUsedQuizzes = async () => {
        try {
            const response = await fetch("/api/last-used-quizzes/");
            const data: Quiz[] = await response.json();
            setLastUsedQuizzes(data);
        } catch {
            setLastUsedQuizzes([]);
        }
    };

    return (
        <Card className="border-0 shadow h-50">
            <Card.Body>
                <h5 className="card-title mb-3">Ostatnio używane</h5>
                <div style={{ overflowY: "auto", maxHeight: "11rem" }}>
                    <Table>
                        <tbody>
                        {lastUsedQuizzes.length > 0 ? (
                            lastUsedQuizzes.map((quiz) => (
                                <tr key={quiz.id}>
                                    <td>
                                        <a href={`/quizzes/${quiz.id}/`}>{quiz.title}</a>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td className="text-muted">Brak ostatnio używanych baz.</td>
                            </tr>
                        )}
                        </tbody>
                    </Table>
                </div>
            </Card.Body>
        </Card>
    );
};

export default LastUsedCard;