import app from "./firebaseConfig";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

const auth = getAuth(app);

export const registerWithEmail = async (
  email: string,
  password: string,
  name: string
) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  // Update display name (optional but good for user UX)
  await updateProfile(userCredential.user, {
    displayName: name,
  });

  // Get auth token (for backend verification)
  const token = await userCredential.user.getIdToken();

  return {
    user: userCredential.user,
    token,
  };
};
