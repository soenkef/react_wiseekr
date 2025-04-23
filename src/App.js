import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import ApiProvider from './contexts/ApiProvider';
import FlashProvider from './contexts/FlashProvider';
import UserProvider from './contexts/UserProvider';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import FeedPage from './pages/FeedPage';
import ExplorePage from './pages/ExplorePage';
import UserPage from './pages/UserPage';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import RegistrationPage from './pages/RegistrationPage';
import EditUserPage from './pages/EditUserPage';
import ResetRequestPage from './pages/ResetRequestPage';
import ResetPage from './pages/ResetPage';
import ScanStreamPage from './pages/ScanStreamPage';
import ScanResultsPage from './pages/ScanResultsPage';
import ScanOverviewPage from './pages/ScanOverviewPage';
import ScanDetailPage from './pages/ScanDetailPage';


export default function App() {
  return (
    <Container fluid className="App">
      <BrowserRouter>
        <FlashProvider>
          <ApiProvider>
            <UserProvider>
              <Header />
              <Routes>
                <Route path="/login" element={
                  <PublicRoute><LoginPage /></PublicRoute>
                } />
                <Route path='/register' element={
                  <PublicRoute><RegistrationPage /></PublicRoute>
                } />
                <Route path='/reset-request' element={
                  <PublicRoute><ResetRequestPage /></PublicRoute>
                } />
                <Route path='/reset' element={
                  <PublicRoute><ResetPage /></PublicRoute>
                } />
                <Route path="*" element={
                  <PrivateRoute>
                    <Routes>
                      <Route path="/" element={<FeedPage />} />
                      <Route path="/explore" element={<ExplorePage />} />
                      <Route path="/user/:username" element={<UserPage />} />

                      <Route path="/scan-results" element={<ScanResultsPage />} />
                      <Route path="/scans" element={<ScanOverviewPage />} />
                      <Route path="/scan/:id" element={<ScanDetailPage />} />

                      <Route path="/scan-stream" element={<ScanStreamPage />} />
                      <Route path="/edit" element={<EditUserPage />} />
                      <Route path="/password" element={<ChangePasswordPage />} />
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </PrivateRoute>
                } />
              </Routes>
            </UserProvider>
          </ApiProvider>
        </FlashProvider>
      </BrowserRouter>
    </Container>
  );
}