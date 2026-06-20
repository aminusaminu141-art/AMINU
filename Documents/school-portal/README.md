# School Portal

## Overview
The School Portal is a web application designed to manage various aspects of school operations, including student records, class schedules, exam management, and user authentication. The application is structured to support different user roles such as principals, students, class masters, and exam officers.

## Features
- **User Authentication**: Secure login and registration for different user roles.
- **Principal Dashboard**: View reports and manage school operations.
- **Student Dashboard**: Access grades, submit assignments, and view personal information.
- **Class Master Dashboard**: Manage class schedules and student attendance.
- **Exam Officer Dashboard**: Oversee exam schedules and results.

## Project Structure
```
school-portal
├── src
│   ├── server
│   │   ├── app.ts
│   │   ├── routes
│   │   │   ├── auth.ts
│   │   │   ├── principal.ts
│   │   │   ├── student.ts
│   │   │   ├── classMaster.ts
│   │   │   └── examOfficer.ts
│   │   ├── controllers
│   │   │   ├── principalController.ts
│   │   │   ├── studentController.ts
│   │   │   ├── classMasterController.ts
│   │   │   └── examOfficerController.ts
│   │   ├── models
│   │   │   ├── user.ts
│   │   │   ├── student.ts
│   │   │   ├── class.ts
│   │   │   └── exam.ts
│   │   ├── middleware
│   │   │   └── auth.ts
│   │   └── db
│   │       └── index.ts
│   ├── client
│   │   ├── index.html
│   │   ├── styles
│   │   │   └── main.css
│   │   ├── scripts
│   │   │   ├── main.js
│   │   │   ├── auth.js
│   │   │   └── dashboard.js
│   │   └── views
│   │       ├── principal.html
│   │       ├── student.html
│   │       ├── classMaster.html
│   │       └── examOfficer.html
│   └── types
│       └── index.d.ts
├── config
│   └── default.json
├── tests
│   ├── server.test.ts
│   └── client.test.ts
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd school-portal
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Set up environment variables by copying `.env.example` to `.env` and updating the values as needed.

## Usage
1. Start the server:
   ```
   npm start
   ```
2. Open your browser and navigate to `http://localhost:3000` to access the application.

## Testing
Run the tests using:
```
npm test
```

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.