import React from "react";
import { Nav, Card } from "react-bootstrap";

interface MenuSidebarProps {
    activeTab: string;
    onTabSelect: (tabKey: string | null) => void;
}

const MenuSidebar: React.FC<MenuSidebarProps> = ({ activeTab, onTabSelect }) => {
    return (
        <Card className="border-0 shadow">
            <Card.Body>
                <Nav
                    className="flex-column"
                    variant="pills"
                    activeKey={activeTab}
                    onSelect={onTabSelect}
                >
                    <Nav.Item>
                        <Nav.Link eventKey="account">Konto</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="settings">Ustawienia</Nav.Link>
                    </Nav.Item>
                </Nav>
            </Card.Body>
        </Card>
    );
};

export default MenuSidebar;