import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

// Sign in with email and password
async function signin ( params: { username: string; password: string } ) {
    const userCredential = await signInWithEmailAndPassword( auth, params.username, params.password );
    const user = userCredential.user;

    // Fetch user role from Firestore
    const userDoc = await getDoc( doc( db, 'users', user.uid ) );
    const role = userDoc.exists() ? userDoc.data().role : 'user'; // Default to 'user' if not set

    return {
        id: user.uid,
        username: user.email,
        firstName: user.displayName || '',
        lastName: '',
        role: role,
        token: await user.getIdToken(),
    };
}

// Sign out
async function signout () {
    await signOut( auth );
    return {};
}

// Sign up with email and password
async function signup ( params: { fullname: string; email: string; password: string } ) {
    const userCredential = await createUserWithEmailAndPassword( auth, params.email, params.password );
    const user = userCredential.user;

    // Set user role in Firestore (default to 'user', admin can change later)
    await setDoc( doc( db, 'users', user.uid ), {
        email: params.email,
        fullname: params.fullname,
        role: 'user', // Default role
    } );

    return {
        id: user.uid,
        username: params.email,
        firstName: params.fullname.split( ' ' )[ 0 ],
        lastName: params.fullname.split( ' ' )[ 1 ] || '',
        role: 'user',
        token: await user.getIdToken(),
    };
}

// Forgot password
async function forgotPassword ( params: { username: string } ) {
    await sendPasswordResetEmail( auth, params.username );
    return { message: "Password reset email sent." };
}

export { signin, signout, signup, forgotPassword };
