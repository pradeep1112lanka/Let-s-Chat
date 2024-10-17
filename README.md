Lanka Pradeep (EE22B074),
Electrical engineering ,
IIT Madras

# Messaging Service Prototype

This repository contains a messaging service prototype with features such as user authentication, chat functionality , real-time updates, and file uploads. The project is built using **React** for the front end, **Vite** for fast development, and **Firebase** for backend services like authentication, real-time database, and file storage.

webisite has been deployed online and can be accessed by using this link https://main.d1tegnvoh89ebk.amplifyapp.com/
## Features

- **User Authentication**: Secure login and registration (no email verification)using Firebase Authentication.
- **Chat Functionality**: Real-time messaging between users.
- **File Upload**: Send images and other files during chat sessions.
- **Responsive UI**: A user-friendly and responsive design for seamless communication.

## Project Structure

The project is organized as follows:


### Key Directories and Files

- **App.js**: Main component that initializes the app and handles routing.
- **Main.js**: Entry point for rendering the app.
- **index.css**: Global styles for the application.
- **vite.config.js**: Vite configuration file for optimizing the build and development process.
- **components/**: Contains UI components for login, chat, user information, and more.
- **lib/**: Utility and service modules for managing chat, file uploads, Firebase integration, and user state.

## Installation

### Prerequisites

- **Node.js** (v14.x or higher)
- **npm** or **yarn** (for managing packages)
- **Firebase** account (for authentication, real-time database, and storage services)

### Steps to Set Up the Project

1. **Clone the repository**:
    ```bash
    git clone https://github.com/pradeep1112lanka/Let-s-Chat.git
    cd Let-s-Chat
    ```

2. **Install the dependencies**:
    ```bash
    npm install
    ```

3. **Set up Firebase**:
    - Create a Firebase project from the [Firebase Console](https://console.firebase.google.com/).
    - Enable authentication methods (e.g., Email/Password, Google Sign-In) and configure the Firestore database.
    - Add your Firebase credentials to the `firebase.js` file located in `lib/`.

4. **Run the development server**:
    ```bash
    npm run dev
    ```

5. **Access the app**:
    - Once the server is running, open your browser and go to `http://localhost:3000`.

## Technologies Used

- **React.js**: For building the user interface and managing component state.
- **Vite**: A fast build tool for front-end development.
- **Firebase**: Used for authentication, real-time database management, and file storage.
- **CSS**: For styling the application’s interface.

## Firebase Setup

1. Sign up for Firebase and create a new project.
2. Enable Authentication (Email/Password or other providers like Google).
3. Create a Firestore database and configure security rules.
4. Copy your Firebase configuration into `firebase.js`:
    ```javascript
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT_ID.appspot.com",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    };
    ```
5. Add Firebase SDK to your app by installing the package:
    ```bash
    npm install firebase
    ```

## Deployment

To deploy the app for production, follow these steps:

1. Build the project:
    ```bash
    npm run build
    ```

2. Deploy the production build to a hosting service like Firebase Hosting or Vercel or Amazon AWS.

## Contributing

If you want to contribute to this project:

1. Fork the repository.
2. Create a new branch for your feature/fix.
3. Make your changes and submit a pull request.

## Contact

For any queries or issues, feel free to reach out:
Lanka Pradeep (EE22b074) IIT Madras.
- **Email**: [pradeeplanka1112@gmail.com](mailto:pradeeplanka1112@gmail.com)
- **GitHub**: [github.com/pradeep1112lanka](https://github.com/pradeep1112lanka)
- **LinkedIn**: [linkedin.com/in/pradeep-lanka-62a850264](https://www.linkedin.com/in/pradeep-lanka-62a850264)

