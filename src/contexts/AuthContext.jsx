import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@utils/firebase";
import { deleteUser, onAuthStateChanged, signOut, updateEmail, updatePassword } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import defaultAvatar from "@assets/user-default.svg";

const UserContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || {});
    const [userData, setUserData] = useState(JSON.parse(localStorage.getItem("userData")) || null);

    const createUser = async (uid, username, email) => {
        const userDoc = doc(db, "users", uid);
        try {
            await setDoc(userDoc, {
                uid,
                username,
                email,
                avatar: defaultAvatar,
                social_link: "",
                bio: "",
                followers: [],
                following_users: [],
                following_communities: [],
                favorite_communities: [],
                moderating: [],
                createdAt: serverTimestamp(),
                saved_posts: [],
                posts: [],
                upvoted: [],
                downvoted: []
            })
        } catch (error) {
            console.error("Could not add user to Firestore:", error);
        }
    }

    const usernameCheck = async (username) => {
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            const usernames = querySnapshot.docs.map((doc) => doc.data().username);
            return !usernames.includes(username);
        } catch (error) {
            console.error("Could not check username availability:", error)
        }
    }

    const updatePasscode = async (newPassword) => {
        try {
            await updatePassword(user, newPassword);
        } catch (error) {
            console.error("Could not update password:", error);
        }
    }

    const deleteAccount = async () => {
        try {
            await deleteUser(user);
            const userDoc = doc(db, "users", user.uid);
            await deleteDoc(userDoc);
        } catch (error) {
            console.error("Could not delete account:", error);
        }
    }

    const logOut = () => {
        return signOut(auth);
    }

    useEffect(() => {
        const fetchUserData = async (uid) => {
            const userDoc = doc(db, "users", uid);
            try {
                const docSnap = await getDoc(userDoc);
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                }
            } catch (error) {
                console.error("Could not fetch user data:", error);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                fetchUserData(currentUser.uid);
            } else {
                setUserData(null);
            }
        });

        return () => unsubscribe();
    }, []);


    useEffect(() => {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("userData", JSON.stringify(userData));
    }, [user, userData]);

    return (
        <UserContext.Provider value={{
            user,
            userData,
            createUser,
            usernameCheck,
            updatePasscode,
            deleteAccount,
            logOut
        }}>
            {children}
        </UserContext.Provider>
    )
}

export const useAuth = () => {
    return useContext(UserContext);
}