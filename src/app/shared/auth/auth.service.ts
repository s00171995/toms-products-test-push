import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AngularFireAuth } from "@angular/fire/auth";
import { Router } from "@angular/router";
import * as firebase from "firebase/";
import { NotificationService } from "../notification/notification.service";

@Injectable({
  providedIn: "root"
})
export class AuthService {
  private user: Observable<firebase.User>;
  loggedInStatus: boolean = false;

  constructor(
    private _firebaseAuth: AngularFireAuth,
    private router: Router,
    public notifier: NotificationService
  ) {
    this.user = _firebaseAuth.authState;
    console.log(this.user);
  }

  // sign up using email and password
  signup(email: string, password: string, name: string) {
    // clear all messages
    this.notifier.display(false, "");
    this._firebaseAuth.auth
      .createUserWithEmailAndPassword(email, password)
      .then(res => {
        this.sendEmailVerification();
        const message =
          "A verification email has been sent, please check your email and follow the steps!";
        this.notifier.display(true, message);
        return firebase
          .database()
          .ref("users/" + res.user.uid)
          .update({
            email: res.user.email,
            uid: res.user.uid,
            registrationDate: new Date().toString(),
            name: name
          })
          .then(() => {
            firebase.auth().signOut();
            this.router.navigate(["login"]);
          });
      })
      .catch(err => {
        console.log(err);
        this.notifier.display(true, err.message);
      });
  }

  // send verification email
  sendEmailVerification() {
    this._firebaseAuth.authState.subscribe(user => {
      user.sendEmailVerification().then(() => {
        console.log("email sent");
      });
    });
  }
  // logging out method - set status to false which changes which nav items to display
  doLogout() {
    return new Promise((resolve, reject) => {
      if (firebase.auth().currentUser) {
        this._firebaseAuth.auth.signOut();
        resolve();
      } else {
        reject();
      }
      this.loggedInStatus = false;
    });
  }

  isLoggedIn(): boolean {
    return this.loggedInStatus;
  }

  // logging in with email and password
  doLogin(value) {
    return new Promise<any>((resolve, reject) => {
      firebase
        .auth()
        .signInWithEmailAndPassword(value.email, value.password)
        .then(
          res => {
            resolve(res);
            this.loggedInStatus = true;
          },
          err => reject(err)
        );
    });
  }

  // logging in with google
  doGoogleLogin() {
    return new Promise<any>((resolve, reject) => {
      const provider = new firebase.auth.GoogleAuthProvider();
      return this._firebaseAuth.auth
        .signInWithPopup(provider)
        .then(credential => {
          resolve(credential);
          this.loggedInStatus = true;
          console.log(credential);
        });
    });
  }

  // logging in with facebook
  // LOGGING IN WITH FACEBOOK - this wont work if you have already logged in with google and your google/facebook email are the same
  doFacebookLogin() {
    return new Promise<any>((resolve, reject) => {
      const provider = new firebase.auth.FacebookAuthProvider();
      return this._firebaseAuth.auth
        .signInWithPopup(provider)
        .then(credential => {
          resolve(credential);
          this.loggedInStatus = true;
          console.log(credential);
        });
    });
  }
}
