import React from "react";
import {Card, Button} from "react-bootstrap";
import AppContext from "../../AppContext.tsx";

const ImportButtonsCard: React.FC = () => {
    const appContext = React.useContext(AppContext);

    return (
        <Card className="border-0 shadow flex-fill">
            <Card.Body className="d-flex align-items-center">
                <div className="row gap-3 p-2 justify-content-center">
                    <Button className="w-auto" variant={`outline-${appContext.theme.getOppositeTheme()}`}>Dodaj nową
                        bazę</Button>
                    <Button className="w-auto" variant={`outline-${appContext.theme.getOppositeTheme()}`}>Importuj
                        bazę</Button>
                    <Button className="w-auto" variant={`outline-${appContext.theme.getOppositeTheme()}`}>Importuj bazę
                        (stara wersja)</Button>
                </div>
            </Card.Body>
        </Card>
    );
};

export default ImportButtonsCard;