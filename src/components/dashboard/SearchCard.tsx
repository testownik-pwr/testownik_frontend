import React, { useState } from "react";
import { Card, InputGroup, FormControl, Button, Table } from "react-bootstrap";

interface SearchResult {
    id: number;
    title: string;
}

const SearchCard: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

    const handleSearch = async () => {
        if (!searchQuery) return;

        try {
            const response = await fetch(`/api/search-quizzes/?query=${encodeURIComponent(searchQuery)}`);
            const data: SearchResult[] = await response.json();
            setSearchResults(data);
        } catch {
            setSearchResults([]);
        }
    };

    return (
        <Card className="border-0 shadow h-50">
            <Card.Body>
                <InputGroup>
                    <FormControl
                        placeholder="Wyszukaj bazę"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button variant="outline-secondary" onClick={handleSearch}>
                        Szukaj
                    </Button>
                </InputGroup>
                <div id="search-results" className="mt-3">
                    <Table>
                        <tbody>
                        {searchResults.length > 0 ? (
                            searchResults.map((result) => (
                                <tr key={result.id}>
                                    <td>
                                        <a href={`/quizzes/${result.id}/`}>{result.title}</a>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td className="text-muted">Brak wyników wyszukiwania.</td>
                            </tr>
                        )}
                        </tbody>
                    </Table>
                </div>
            </Card.Body>
        </Card>
    );
};

export default SearchCard;