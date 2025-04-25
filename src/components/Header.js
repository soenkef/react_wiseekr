import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Spinner from 'react-bootstrap/Spinner';
import { NavLink } from 'react-router-dom';
import { useUser } from '../contexts/UserProvider';
import DarkModeToggle from './DarkModeToggle';

export default function Header() {
  const { user, logout } = useUser();

  return (
    <Navbar bg="light" expand="lg" sticky="top" className="Header">
      <Container>
        <Navbar.Brand as={NavLink} to="/">Wiseekr</Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar" className="justify-content-end">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/">Feed</Nav.Link>
            <Nav.Link as={NavLink} to="/explore">Explore</Nav.Link>
            <Nav.Link as={NavLink} to="/scans">Scans</Nav.Link>
            <Nav.Link as={NavLink} to="/scan-results">Wifi Test</Nav.Link>
            <Nav.Link as={NavLink} to="/scan-stream">Terminal</Nav.Link>
          </Nav>

          <Nav className="align-items-center gap-2">
            {/* DarkMode Toggle bleibt oben */}
            <DarkModeToggle />

            {/* Benutzeroptionen im Dropdown */}
            <NavDropdown title="Options" align="end">
              {user === undefined ? (
                <NavDropdown.Item>
                  <Spinner animation="border" size="sm" /> Lade Benutzer...
                </NavDropdown.Item>
              ) : user !== null && (
                <>
                  <NavDropdown.Item as={NavLink} to={'/user/' + user.username}>
                    Profil
                  </NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/password">
                    Passwort ändern
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={logout}>Logout</NavDropdown.Item>
                </>
              )}
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
