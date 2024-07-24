### `README.md`

# Backend Project

This project is a backend server built with Node.js, Express, and other dependencies, intended to handle various backend functionalities.

## Table of Contents

- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

## Getting Started

These instructions will help you set up and run the project on your local machine for development and testing purposes.

## Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

## Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/Mansvini/chat-app-backend.git
   cd chat-app-backend
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

## Running the Project

1. Start the server:

   ```sh
   npm run dev
   ```

2. The server should now be running at `http://localhost:3001`.

## Environment Variables

Create a `.env` file in the root directory of the project and add the following environment variables:

```plaintext
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
# PUBLIC_FRONTEND_URL=your-frontend-url (optional)
LOCAL_FRONTEND_URL=http://localhost:3000
BACKEND_PORT=3001
NODE_ENV=development (or production)
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or fixes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.