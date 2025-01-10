import React from "react";
import { Row, Col } from "react-bootstrap";
import QuestionQuiz from "../components/dashboard/QuestionQuizCard.tsx";
import LastUsed from "../components/dashboard/LastUsedCard.tsx";
import Recommendations from "../components/dashboard/RecommendationsCard.tsx";
import SearchCard from "../components/dashboard/SearchCard.tsx";
import ImportButtonsCard from "../components/dashboard/ImportButtonsCard.tsx";
import '../styles/dashboard.css';

const DashboardPage: React.FC = () => {

    return (
        <Row className="mh-1 row-gap-3">
            {/* Left Column */}
            <Col md={4} className="d-flex flex-column">
                <QuestionQuiz />
            </Col>

            {/* Middle Column */}
            <Col md={4} className="d-flex flex-column gap-3">
                <LastUsed />
                <ImportButtonsCard />
            </Col>

            {/* Right Column */}
            <Col md={4} className="d-flex flex-column gap-3">
                <SearchCard />
                <Recommendations />
            </Col>
        </Row>
    );
};

export default DashboardPage;