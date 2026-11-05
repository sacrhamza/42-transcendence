# Register API — Documentation

## 1. API Information

**API Name:** User Registration

**Method:** `POST`

**Endpoint:** `/api/auth/register`

**URL:** `http://localhost:3000/api/auth/register`

**Content-Type:** `application/json`

## 2. What Does This API Do?

This API allows a new user to create an account.

When a user sends a registration request, the backend:

1. Validates the user information.
2. Checks that the password does not contain personal information.
3. Checks if the email is already registered.
4. Checks if the username is already taken.
5. Hashes the password using bcrypt (12 rounds).
6. Saves the user in PostgreSQL.
7. Returns a success response with the new user ID.

## 3. Expected Request Body

```json
{
  "username": "syna_test_001",
  "email": "syna_test_001@example.com",
  "password": "SecurePass123!"
}
```

All three fields are required.

## 4. API Responses

### 201 — Created

The user was registered successfully.

```json
{
  "message": "User registered successfully",
  "userId": "1"
}
```

### 400 — Bad Request

The request contains invalid or missing information.

Examples:
- Invalid email format.
- Missing password.
- Password contains personal information.
- Input does not pass validation.

Example:

```json
{
  "message": "Password must not contain personal information",
  "error": "Bad Request",
  "statusCode": 400
}
```

### 409 — Conflict

The email or username is already registered.

Example:

```json
{
  "message": "Username or email already registered",
  "error": "Conflict",
  "statusCode": 409
}
```

## 5. Tests Completed

| # | Test Case | Expected Status | Result |
|---|---|---|---|
| 1 | Register a new user | 201 | PASSED |
| 2 | Register with an existing email | 409 | PASSED |
| 3 | Register with an existing username | 409 | PASSED |
| 4 | Register with an invalid email | 400 | PASSED |
| 5 | Register without a password | 400 | PASSED |
| 6 | Password contains the username | 400 | PASSED |
| 7 | Verify user data in PostgreSQL | Data saved correctly | PASSED |
| 8 | Send two registration requests at the same time with the same username | One 201, one 409 | PASSED |

**Total: 8/8 Tests Passed**

## 6. Database Verification

The registration data was checked directly in PostgreSQL.

- The user exists in the `users` table.
- The email exists in the `normal_users` table.
- The foreign key is correct.
- The password is stored as a bcrypt hash, not plain text.

## 7. Concurrent Requests Test

Two registration requests were sent at the same time using the same username.

**Results:**

- Request A: `409 Conflict`
- Request B: `201 Created`

Only one request created a user successfully.

## 8. Current Status

**Status: Basic registration tests passed.**

The API successfully handles valid registrations, invalid input, duplicate users, and the tested concurrent registration case.

Code review and automated tests are recommended before merging into `main`.