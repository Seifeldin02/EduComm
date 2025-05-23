import { app } from "./firebaseConfig";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

const auth = getAuth(app);
export const logout = async () => {
  await signOut(auth);
};
// Registration (already perfect!)
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

  await updateProfile(userCredential.user, {
    displayName: name,
  });

  await sendEmailVerification(userCredential.user);

  const token = await userCredential.user.getIdToken();

  return {
    user: userCredential.user,
    token,
  };
};

// 🔥 Add this Login function explicitly:
export const loginWithEmail = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  const token = await userCredential.user.getIdToken();

  return {
    user: userCredential.user,
    token,
  };
};

export { auth };
