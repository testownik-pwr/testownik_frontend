import React, {useContext, useEffect, useRef, useState} from "react";
import AppContext from "../../AppContext.tsx";
import {Button, Form, Modal, OverlayTrigger, Popover, Tooltip} from "react-bootstrap";
import PropagateLoader from "react-spinners/PropagateLoader";
import {distance} from 'fastest-levenshtein';
import AccessLevelSelector from "./AccessLevelSelector.tsx";
import {Icon} from "@iconify/react";


enum AccessLevel {
    PRIVATE = 0,
    SHARED = 1,
    UNLISTED = 2,
    PUBLIC = 3
}

interface User {
    id: string;
    full_name: string;
    photo_url: string;
    student_number: string;
}

interface Term {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
}

interface Group {
    id: string;
    name: string;
    term: Term;
    photo_url: string;
}


interface ShareQuizModalProps {
    show: boolean;
    onHide: () => void;
    quizId: string;
    quizTitle: string;
}


interface QuizMetadata {
    id: string;
    title: string;
    description: string;
    maintainer: User;
    visibility: AccessLevel;
    is_anonymous: boolean;
    version: number;
}

interface SharedQuiz {
    id: number;
    quiz: string;
    user: User;
    group: Group;
}

const ShareQuizModal: React.FC<ShareQuizModalProps> = ({show, onHide, quizId, quizTitle}) => {
    const appContext = useContext(AppContext);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<User[] | Group[]>([]);
    const [inputWidth, setInputWidth] = useState(0);
    const [loading, setLoading] = useState(false);
    const [searchResultsLoading, setSearchResultsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [quizMetadata, setQuizMetadata] = useState<QuizMetadata | null>(null);
    const [usersWithAccess, setUsersWithAccess] = useState<User[]>([]);
    const [groupsWithAccess, setGroupsWithAccess] = useState<Group[]>([]);
    const [accessLevel, setAccessLevel] = useState<number>(0);
    const [userGroups, setUserGroups] = useState<Group[]>([]);

    useEffect(() => {
        if (inputRef.current) {
            setInputWidth(inputRef.current.clientWidth);
            inputRef.current.addEventListener("click", () => setInputWidth(inputRef.current!.clientWidth));
        }
        setLoading(true);
        Promise.all([fetchQuizMetadata(), fetchGroups(), fetchAccess()])
            .finally(() => setLoading(false));
    }, []);

    const fetchQuizMetadata = async () => {
        try {
            const response = await appContext.axiosInstance.get(`/quiz-metadata/${quizId}/`);
            setQuizMetadata(response.data);
            setAccessLevel(response.data.visibility);
        } catch {
            console.error("Failed to fetch quiz metadata");
            setQuizMetadata(null);
            setAccessLevel(0);
        }
    }

    const fetchAccess = async () => {
        try {
            const response = await appContext.axiosInstance.get(`/shared-quizzes/?quiz=${quizId}`);
            console.log(response.data);
            setUsersWithAccess(response.data.flatMap((sharedQuiz: SharedQuiz) => sharedQuiz.user ? [sharedQuiz.user] : []));
            setGroupsWithAccess(response.data.flatMap((sharedQuiz: SharedQuiz) => sharedQuiz.group ? [sharedQuiz.group] : []));
        } catch {
            setUsersWithAccess([]);
            setGroupsWithAccess([]);
        }
    }

    const fetchGroups = async () => {
        try {
            const response = await appContext.axiosInstance.get("/study-groups/");
            response.data.forEach((group: Group) => {
                group.photo_url = `https://ui-avatars.com/api/?background=random&name=${group.name.split(" ")[0]}+${group.name.split(" ")[1]}&size=128`;
            })
            setUserGroups(response.data);
        } catch {
            setUserGroups([]);
        }
    }

    const searchResultsPopover = (searchResults: User[] | Group[]) => {
        return (
            <Popover id="search-results-popover" style={{maxWidth: "100%", width: inputWidth}}>
                <Popover.Body className="d-flex flex-column gap-2 overflow-auto" style={{maxHeight: "20rem"}}>
                    {searchResultsLoading ? (
                        <div className="d-flex justify-content-center mt-1 mb-3">
                            <PropagateLoader color={appContext.theme.getOppositeThemeColor()} size={10}/>
                        </div>
                    ) : searchResults.length > 0 ? (
                        searchResults.map((result: User | Group) => (
                            <div key={result.id} className="d-flex align-items-center gap-2">
                                <img src={result.photo_url} alt="avatar" className="rounded-circle" width="32"
                                     height="32"/>
                                <div>
                                    <p className="m-0">{Object.prototype.hasOwnProperty.call(result, "full_name") ? (result as User).full_name : (result as Group).name}</p>
                                </div>
                            </div>
                        ))
                    ) : searchQuery.length >= 3 ? (
                        <span className="text-center">Brak wyników</span>
                    ) : (
                        <span className="text-center">Wpisz co najmniej 3 znaki</span>
                    )}
                </Popover.Body>
            </Popover>
        );
    }

    const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        if (e.target.value.length >= 3) {
            handleSearch(e.target.value);
        } else {
            setSearchResults([]);
        }
    }

    const handleSearch = async (query: string) => {
        try {
            setSearchResultsLoading(true);
            const usersResponse = await appContext.axiosInstance.get(`/users/?search=${encodeURIComponent(query)}`);
            const searchedGroups = userGroups.filter((group: Group) => group.name.toLowerCase().includes(query.toLowerCase()));
            const data = [...usersResponse.data, ...searchedGroups];

            let userByIndex = null;
            if (query.length === 6 && !isNaN(parseInt(query))) {
                userByIndex = data.find((user: User) => user.student_number === query);
                data.splice(data.indexOf(userByIndex), 1);
            }
            data.sort((a: User | Group, b: User | Group) => {
                const aIsGroup = Object.prototype.hasOwnProperty.call(a, "name");
                const bIsGroup = Object.prototype.hasOwnProperty.call(b, "name");

                if (aIsGroup && bIsGroup) {
                    const aGroup = a as Group;
                    const bGroup = b as Group;

                    if (aGroup.term.is_current && !bGroup.term.is_current) {
                        return -1;
                    } else if (!aGroup.term.is_current && bGroup.term.is_current) {
                        return 1;
                    } else {
                        return distance(aGroup.name, query) - distance(bGroup.name, query);
                    }
                } else if (aIsGroup) {
                    return distance((a as Group).name, query) - distance((b as User).full_name, query);
                } else if (bIsGroup) {
                    return distance((a as User).full_name, query) - distance((b as Group).name, query);
                } else {
                    return distance((a as User).full_name, query) - distance((b as User).full_name, query);
                }
            });
            if (userByIndex) {
                data.unshift(userByIndex);
            }
            setSearchResults(data);
        } catch {
            setSearchResults([]);
        }
        setSearchResultsLoading(false);
    }

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Udostępnij "{quizTitle}"</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <OverlayTrigger overlay={searchResultsPopover(searchResults)} placement="bottom"
                                show={searchQuery.length > 0}>
                    <Form.Control placeholder="Wpisz imię/nazwisko, grupę lub numer indeksu..." className="mb-2"
                                  ref={inputRef} value={searchQuery} onChange={handleSearchInput}/>
                </OverlayTrigger>
                <h6>Osoby z dostępem:</h6>
                <div className="d-flex flex-wrap gap-2" style={{maxHeight: "10rem", overflowY: "auto"}}>
                    {loading ? (
                        <div className="d-flex justify-content-center w-100 mt-1 mb-3">
                            <PropagateLoader color={appContext.theme.getOppositeThemeColor()} size={10}/>
                        </div>
                    ) : (
                        <>
                            {quizMetadata?.maintainer && (
                                <div key={quizMetadata?.maintainer.id}
                                     className={`d-flex justify-content-between align-items-center w-100 p-2 rounded bg-${appContext.theme.getTheme()}`}>
                                    <div className="d-flex align-items-center gap-2">
                                        <img src={quizMetadata?.maintainer.photo_url} alt="avatar"
                                             className="rounded-circle" width="32"
                                             height="32"/>
                                        <div>
                                            <p className="m-0">{quizMetadata?.maintainer.full_name}</p>
                                        </div>
                                    </div>
                                    <div onClick={() => setQuizMetadata({
                                        ...quizMetadata,
                                        is_anonymous: !quizMetadata.is_anonymous
                                    })}>
                                        {quizMetadata.is_anonymous ? (
                                            <Icon icon="mdi:incognito"
                                                  className="text-white bg-danger-subtle rounded-circle p-1" width="32"
                                                  height="32"/>
                                        ) : (
                                            <Icon icon="mdi:account"
                                                  className="text-white bg-info-subtle rounded-circle p-1" width="32"
                                                  height="32"/>
                                        )}
                                    </div>
                                </div>
                            )}
                            {usersWithAccess.map((user) => (
                                <div key={user.id}
                                     className={`d-flex justify-content-between align-items-center w-100 p-2 rounded bg-${appContext.theme.getTheme()}`}>
                                    <div className="d-flex align-items-center gap-2">
                                        <img src={user.photo_url} alt="avatar" className="rounded-circle" width="32"
                                             height="32"/>
                                        <div>
                                            <p className="m-0">{user.full_name}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <Button size="sm"
                                                className="text-danger bg-danger bg-opacity-25 text-danger border-0">Usuń</Button>
                                    </div>
                                </div>
                            ))
                            }
                            {groupsWithAccess.map((group) => (
                                <div key={group.id}
                                     className={`d-flex justify-content-between align-items-center w-100 p-2 rounded bg-${appContext.theme.getTheme()}`}>
                                    <div className="d-flex align-items-center gap-2">
                                        <img src={group.photo_url} alt="avatar" className="rounded-circle"
                                             width="32"
                                             height="32"/>
                                        <div>
                                            <p className="m-0">{group.name}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <Button size="sm"
                                                className="text-danger bg-danger bg-opacity-25 text-danger border-0">Usuń</Button>
                                    </div>
                                </div>
                            ))
                            }
                        </>
                    )}
                </div>
                <h6>Poziom dostępu:</h6>
                <AccessLevelSelector value={accessLevel} onChange={setAccessLevel}/>
            </Modal.Body>
            <Modal.Footer>
                <div className="d-flex justify-content-between w-100">
                    <OverlayTrigger
                        overlay={<Tooltip id="copy-link-tooltip">Link do quizu został skopiowany do schowka</Tooltip>}
                        placement="bottom" trigger="click" rootClose>
                        <Button variant={`outline-${appContext.theme.getOppositeTheme()}`} onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/quiz/${quizId}`);
                        }} className="d-inline-flex align-items-center"
                        ><Icon icon={"mdi:link-variant"} className="me-1"/>Kopiuj link</Button>
                    </OverlayTrigger>
                    <Button variant="primary">Zapisz</Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
}

export default ShareQuizModal;