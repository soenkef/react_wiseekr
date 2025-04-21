import { Navigate } from "react-router-dom";
import { useUser } from "../contexts/UserProvider";

export default function PublicRoute({ children }) {
    const { user } = useUser();

    if (user === undefined) {
        return null; // or a loading spinner
    }
    else if (user) {
        return <Navigate to ="/" />; // Redirect to home page if user is logged in
    }
    else {
        return children; // Render nothing or a message indicating public access
    }   
}