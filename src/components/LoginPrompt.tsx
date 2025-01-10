import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Card, Button, Modal } from 'react-bootstrap';
import { useLocation , useNavigate} from 'react-router-dom';
import GridLoader from "react-spinners/GridLoader";
import '../styles/loginPrompt.css';
import AppContext from "../AppContext.tsx";
import {BASE_URL} from "../config.ts";

const LoginPrompt: React.FC = () => {
    const appContext = useContext(AppContext);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const accessToken = queryParams.get('access_token');
    const refreshToken = queryParams.get('refresh_token');
    const next = queryParams.get('next');
    const navigate = useNavigate();

    const fetchUserData = useCallback(async () => {
        try {
            const response = await appContext.axiosInstance.get("/user/");
            if (!response.data) {
                throw new Error("No user data available");
            }
            const userData = response.data;
            localStorage.setItem("profile_picture", userData.photo_url);
            localStorage.setItem("is_staff", userData.is_staff);
            appContext.setAuthenticated(true);
        } catch {
            console.error("Failed to fetch user data");
        }
    }, [appContext]);

    const handleLogin = useCallback(async () => {
        if (accessToken && refreshToken) {
            localStorage.setItem("access_token", accessToken);
            localStorage.setItem("refresh_token", refreshToken);

            await fetchUserData();

            console.log(`Redirecting to ${next ?? "/"}`);

            navigate(next ?? "/");
        }
    }, [accessToken, refreshToken, fetchUserData, navigate, next]);


    useEffect(() => {
        handleLogin();
    }, [handleLogin]);

    return (
        <div className="d-flex justify-content-center">
            <Card className="border-0 shadow" id="login-card">
                {accessToken && refreshToken ? (
                    <Card.Body className="d-flex flex-column align-items-center">
                        <Card.Text className="text-success fs-4">
                            Zalogowano pomyślnie!
                        </Card.Text>
                        <GridLoader color="#0d6efd" loading={true} size={150} />
                        <Card.Text className="text-muted mt-2">
                            Pobieranie twoich danych...
                        </Card.Text>
                    </Card.Body>
                ) : (
                    <Card.Body>
                        <Card.Title>Witaj w Testowniku!</Card.Title>
                        <Card.Text>
                            Testownik to narzędzie do tworzenia i rozwiązywania testów. Możesz korzystać z niego,
                            logując się za pomocą swojego konta USOS.
                        </Card.Text>
                        <Card.Text>
                            Obecnie dostęp do Testownika mają tylko studenci Politechniki Wrocławskiej.
                        </Card.Text>
                        <Button href={`${BASE_URL}/login/usos?jwt=true&redirect=${document.location}`}
                                variant="primary" className="w-100">Zaloguj się</Button>
                        <div className="text-center mt-2">
                            <a href="#" className="fs-6 link-secondary" onClick={() => setShowPrivacyModal(true)}>
                                Jak przetwarzamy Twoje dane?
                            </a>
                        </div>
                    </Card.Body>
                )}
            </Card>
            <Modal fade id="privacyModal" tabIndex={-1} aria-labelledby="privacyModalLabel" aria-hidden="true"
                   show={showPrivacyModal} onHide={() => setShowPrivacyModal(false)}>
                <Modal.Header>
                    <Modal.Title id="privacyModalLabel">Jak przetwarzamy Twoje dane</Modal.Title>
                    <Button variant="close" data-bs-dismiss="modal" aria-label="Close"></Button>
                </Modal.Header>
                <Modal.Body>
                    <p>Testownik korzysta z Twoich danych z USOS, aby móc zidentyfikować Cię jako studenta PWr i
                        zapewnić Ci dostęp do odpowiednich funkcji.</p>
                    <br />
                    <p>Lista danych, które otrzymujemy od USOS oraz w jaki sposób je przetwarzamy:</p>
                    <ul>
                        <li><code>default</code> - Twoje podstawowe dane, takie jak imię, nazwisko oraz status
                            studenta.
                        </li>
                        <li><code>offline_access</code> - Uprawnienie pozwalające na odświeżanie Twoich danych bez
                            konieczności logowania się do USOS za każdym razem.
                        </li>
                        <li><code>studies</code> - Informacje o Twoich studiach, takie jak numer indeksu, kierunek
                            studiów oraz twoje grupy zajęciowe.
                        </li>
                        <li><code>email</code> - Twój adres email (najczęściej [nr_indeksu]@student.pwr.edu.pl),
                            który jest używany do kontaktu przy zgłaszaniu błędów w bazach danych.
                        </li>
                        <li><code>photo</code> - Twoje zdjęcie profilowe, które jest wyświetlane w górnym prawym
                            rogu strony.
                        </li>
                        <li><code>grades</code> - Twoje oceny końcowe z USOS, które są wyświetlane w zakładce
                            "Oceny" wraz z wyliczoną średnią. Nie są one zapisywane w bazie danych Testownika, a
                            jedynie pobierane z USOS w momencie wyświetlania strony.
                        </li>
                    </ul>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPrivacyModal(false)}>Zamknij</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default LoginPrompt;