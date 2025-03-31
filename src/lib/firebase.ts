// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getDownloadURL, getStorage, ref, uploadBytesResumable} from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDcT5V12mujnsJYUs20KVCYtY6n9vVQq6I",
  authDomain: "dionysus-9633f.firebaseapp.com",
  projectId: "dionysus-9633f",
  storageBucket: "dionysus-9633f.firebasestorage.app",
  messagingSenderId: "1031981261142",
  appId: "1:1031981261142:web:7df2f1385e5870eb34b6f7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

export async function uploadFile(file: File, setProgress?: (progress:number)=> void){
  return new Promise((resolve, reject)=>{
    try{
        const storageRef = ref(storage, file.name);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed', snapshot =>{
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            if(setProgress){
                setProgress(progress);
            }
            switch (snapshot.state) {
                case 'paused':
                    console.log('Upload is paused');
                    break;
                case 'running':
                    console.log('Upload is running');
                    break;
            }
        }, error =>{
                reject(error);
        },()=>{
            getDownloadURL(uploadTask.snapshot.ref).then(downloadUrl=>{
                resolve(downloadUrl);
            })
        })
    }catch(err){
        console.log(err);
        reject(err);
    }
  })
}