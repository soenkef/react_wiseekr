
import { useUser } from '../contexts/UserProvider';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';

export default function TestBash() {
    const { user } = useUser();

    return (
        <Container>
            <p>
                {user === undefined ?
                    <Spinner animation="border" />
                    :
                    <>
                        {user !== null &&
                            <p>TestBAsh</p>
                        }
                    </>
                }
            </p>
        </Container>
    );

}