import React, {useState} from "react";
import {Modal, Button, Badge} from "react-bootstrap";
import {Icon} from "@iconify/react";
import {PeerConnectOption} from "peerjs";

interface ContinuityModalProps {
    peerConnections: PeerConnectOption[];
    isContinuityHost: boolean;
}

const ContinuityModal: React.FC<ContinuityModalProps> = ({peerConnections, isContinuityHost}) => {
    const [showModal, setShowModal] = useState(false);

    const connectedDevices = peerConnections
        .map((c) => c.metadata?.device || "Unknown")
        .join(", ")
        .replace(/,([^,]*)$/, " i$1");

    const iconName = peerConnections.length === 1
        ? getIconByDevice(peerConnections[0]?.metadata?.type)
        : "flat-color-icons:multiple-devices";

    return (
        <>
            <Button
                className={`shadow-lg bg-body-tertiary ${peerConnections.length === 0 ? "d-none" : ""}`}
                style={{position: "fixed", bottom: "1rem", right: "1rem"}}
                onClick={() => setShowModal(true)}
            >
                <Icon icon={iconName}/>
                {isContinuityHost && (
                    <Badge bg="warning" className="position-absolute p-1 translate-middle"
                           style={{top: "10%", left: "90%"}}>
                        <Icon className="d-block" icon="mdi:crown"/>
                    </Badge>
                )}
            </Button>
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Continuity</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {peerConnections.length === 0 ? (
                        <p>Zaloguj się na obu urządzeniach i otwórz ten quiz, aby się połączyć.</p>
                    ) : (
                        <>
                            <p>Połączono z {connectedDevices}</p>
                            <p>Synchronizujesz swój postęp na żywo.</p>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Zamknij</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

const getIconByDevice = (type: string) => {
    switch (type) {
        case "desktop":
            return "fluent-emoji:desktop-computer";
        case "tablet":
            return "flat-color-icons:tablet-android";
        case "mobile":
            return "flat-color-icons:phone-android";
        default:
            return "flat-color-icons:multiple-devices";
    }
};

export default ContinuityModal;