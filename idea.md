### PHASE 1: STANDUP!! WHAT ARE WE BUILDING?

|| app features: 
basically an app where 42 students and other students can post questions, ideas, docs
and get feedbacks, comments, opinions about it.
* so, we well have users, 42 students, and not 42 students.
* users can post questions.
* questions can have many comments.
* comments can have many comments underlying and so on.
* any user can have a profile and anyone logged in can see it.
* profile for now has user image, name, about-me, and total quetions, and comments(answers).
* any user can have friends.
* anyone can send a message to anyone in the app.
* 42 students have access to 42 resources. (MAYBE)

### PHASE 2: WHO YOU ARE!! THE FIRST PAGE
```text
first page has to have project logo, sign in, sign up, a brief project summary, some images
of the prjects and features, and optionally some links below.

```


### PHASE 3 WHEN YOU KNOW YOURSELF!! ABOUT LOGIN:
```text
-> we will have a page for sign in basically with mail or username, and password.
-> option for forgot password. (for now there is a lot of options to do it, send a link via email, verify using a random integer...)

```


### PHASE 4 WHEN YOU LOSE YOURSELF? ABOUT SIGNUP:
```text
-> page for sign up with 42, or by mail.
-> to verify mail, we will send an integer to the mail, and if it match, he can sign up in case of mail.
-> in case of 42 student we will use 42 api or something like that.
-> let user first type his email, and then verifie it, and so on let him fill user information.
-> it is important for backend to check if there is an account for the user mail if yes redirect or display sign in to the user.
-> password have to be long enough, snd strong, frontend can check these, also backend needs to check for it.
-> user name have to be long enough, (if not we can have users that name themself with just a character user '1', user '2')
-> backend needs to check if the name is taken or not.
-> user name have to be just alpha with numbers. (maybe, for me this is logic)
-> photo is optional so if there is no photo there is default, so in database set DEFAULT value to a default image link;
-> bio/about me is optional.

```

sign/in
frontend:
-> sign in page requirement:
    1. input for username check if it has 2 char to 75char
    2. input for password, check password is strong, alpha, num, special, no username in password
    3. input for password to check if it matches
    4. input for mail, check if typed string is actually mail, valid mail (12-50 char)
    5. check if username is taken or not
    6. check if mail is taken or not
    7. nothing can be empty, or just white spaces
    8. sign up with 42 button(implement logic later).
