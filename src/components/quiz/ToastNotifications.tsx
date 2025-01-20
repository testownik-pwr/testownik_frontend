import React from "react";
import {Toast, ToastContainer} from "react-bootstrap";
import {Icon} from "@iconify/react";

interface ToastNotificationsProps {
    showCopiedToast: boolean;
    showErrorToast: boolean;
    showContinuityConnectedToast: boolean;
    showContinuityDisconnectedToast: boolean;
    onClose: (id: string) => void;
}

const ToastNotifications: React.FC<ToastNotificationsProps> = ({
                                                                   showCopiedToast,
                                                                   showErrorToast,
                                                                   showContinuityConnectedToast,
                                                                   showContinuityDisconnectedToast,
                                                                   onClose,
                                                               }) => {
    return (
        <ToastContainer position="bottom-end" className="p-3">
            {renderToast(showCopiedToast, "Skopiowano", "solar:clipboard-bold", "Pytanie zostało skopiowane.", "copied", onClose)}
            {renderToast(showErrorToast, "Błąd", "solar:triangle-danger-bold", "Wystąpił błąd.", "error", onClose, "danger")}
            {renderToast(showContinuityConnectedToast, "Continuity", "flat-color-icons:multiple-devices", "Połączono z innym urządzeniem!", "continuityConnected", onClose, "info")}
            {renderToast(showContinuityDisconnectedToast, "Continuity", "flat-color-icons:multiple-devices", "Rozłączono z urządzeniem.", "continuityDisconnected", onClose, "warning")}
        </ToastContainer>
    );
};


const renderToast = (show: boolean, title: string, icon: string, body: string, id: string, onClose: (id: string) => void, color = "success") => (
    <Toast show={show} delay={4000} autohide bg={color} onClose={() => onClose(id)}>
        <Toast.Header>
            <Icon icon={icon} className="me-2"/>
            <strong className="me-auto">{title}</strong>
            <small>Teraz</small>
        </Toast.Header>
        <Toast.Body>{body}</Toast.Body>
    </Toast>
);

export default ToastNotifications;