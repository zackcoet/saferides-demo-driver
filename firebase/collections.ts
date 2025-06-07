import { collection } from 'firebase/firestore';
import { db } from '../config/firebase';

export const tripsCol = collection(db, 'trips'); 