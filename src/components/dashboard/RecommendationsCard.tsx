import React, { useEffect, useState } from "react";
import { Card, Table } from "react-bootstrap";

interface Quiz {
    id: number;
    title: string;
}

const RecommendationsCard: React.FC = () => {
    const [recommendations, setRecommendations] = useState<Quiz[]>([]);

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const fetchRecommendations = async () => {
        try {
            const response = await fetch("/api/recommendations/");
            const data: Quiz[] = await response.json();
            setRecommendations(data);
        } catch {
            setRecommendations([]);
        }
    };

    return (
        <Card className="border-0 shadow h-50">
            <Card.Body>
                <h5 className="card-title">Rekomendacje</h5>
                <Table>
                    <tbody>
                    {recommendations.length > 0 ? (
                        recommendations.map((quiz) => (
                            <tr key={quiz.id}>
                                <td>{quiz.title}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td className="text-muted">Brak rekomendacji w tej chwili.</td>
                        </tr>
                    )}
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );
};

export default RecommendationsCard;