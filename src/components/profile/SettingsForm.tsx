import React from "react";
import {Card, Table, Form} from "react-bootstrap";

interface SettingsData {
    sync_progress: boolean;
    initial_reoccurrences: number;
    wrong_answer_reoccurrences: number;
}

interface SettingsFormProps {
    settings: SettingsData;
    onSettingChange: (name: keyof SettingsData, value: boolean | number) => void;
}

const SettingsForm: React.FC<SettingsFormProps> = ({settings, onSettingChange}) => {
    return (
        <Card className="border-0 shadow">
            <Card.Body>
                <Table>
                    <tbody>
                    <tr>
                        <td>
                            <Form.Label>Synchronizuj postępy</Form.Label>
                        </td>
                        <td>
                            <Form.Check
                                type="switch"
                                checked={settings.sync_progress}
                                onChange={(e) =>
                                    onSettingChange("sync_progress", e.target.checked)
                                }
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <Form.Label>Wstępna liczba powtórzeń</Form.Label>
                        </td>
                        <td>
                            <Form.Control
                                type="number"
                                min="1"
                                value={settings.initial_reoccurrences}
                                onChange={(e) =>
                                    onSettingChange("initial_reoccurrences", Number(e.target.value))
                                }
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <Form.Label>Liczba dodatkowych powtórzeń przy błędnej odpowiedzi</Form.Label>
                        </td>
                        <td>
                            <Form.Control
                                type="number"
                                min="0"
                                value={settings.wrong_answer_reoccurrences}
                                onChange={(e) =>
                                    onSettingChange("wrong_answer_reoccurrences", Number(e.target.value))
                                }
                            />
                        </td>
                    </tr>
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );
};

export default SettingsForm;