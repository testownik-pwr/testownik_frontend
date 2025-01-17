import React, {useContext, useState} from "react";
import {Card, InputGroup, FormControl, Button, Table} from "react-bootstrap";
import AppContext from "../../AppContext.tsx";
import PropagateLoader from "react-spinners/PropagateLoader";
import {Icon} from "@iconify/react";

interface SearchResult {
    id: string;
    title: string;
    maintainer: string;
    is_anonymous: boolean;
}

const SearchCard: React.FC = () => {
    const appContext = useContext(AppContext);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [isSearchedEmpty, setIsSearchedEmpty] = useState<boolean>(true);

    const handleSearch = async () => {
        if (!searchQuery) {
            setIsSearchedEmpty(true);
            setSearchResults([]);
            return;
        }
        setIsSearchedEmpty(false);

        try {
            setLoading(true);
            const response = await appContext.axiosInstance.get(`/search-quizzes/?query=${encodeURIComponent(searchQuery)}`);

            const data = Object.values(response.data).flat() as SearchResult[];
            setSearchResults(data);
        } catch {
            setSearchResults([]);
        }
        setLoading(false);
    };

    return (
        <Card className="border-0 shadow flex-fill">
            <Card.Body>
                <InputGroup>
                    <FormControl
                        placeholder="Wyszukaj bazę"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSearch();
                            }
                        }}
                    />
                    <Button variant={"outline-" + appContext.theme.getOppositeTheme()} onClick={handleSearch}>
                        <Icon icon="ic:baseline-search" width="24" height="24"/>
                    </Button>
                </InputGroup>
                <div id="search-results" className="mt-3">
                    {loading ? (
                        <div className="d-flex justify-content-center pt-3">
                            <PropagateLoader color={appContext.theme.getOppositeThemeColor()} size={10}/>
                        </div>
                    ) : (
                        <Table className="mb-0 overflow-y-auto" style={{maxHeight: "20rem"}}>
                            <tbody>
                            {searchResults.length > 0 ? (
                                searchResults.map((result) => (
                                    <tr key={result.id}>
                                        <td>
                                            <a href={`/quiz/${result.id}`}
                                               className={"text-decoration-none text-" + appContext.theme.getOppositeTheme()}>
                                                {result.title}
                                                <span
                                                    className="link-secondary"> by {result.is_anonymous ? "anonim" : result.maintainer}</span>
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            ) : (isSearchedEmpty ? (
                                    <tr>
                                        <td className="text-muted">Tu pojawią się wyniki wyszukiwania.</td>
                                    </tr>
                                ) : (
                                    <tr>
                                        <td className="text-muted">Brak wyników wyszukiwania.</td>
                                    </tr>
                                )
                            )}
                            </tbody>
                        </Table>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
};

export default SearchCard;